import { BrowserContext } from 'playwright';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { BaseUploader } from '../base-uploader.js';
import { OpenCLIRunner } from '../../core/opencli-runner.js';
import { extensionService, type OCSAction } from '../../services/extension-service.js';
import { logger } from '../../core/logger.js';
import type { UploadOptions } from '../../db/models.js';

export class OpenCLIUploader extends BaseUploader {
  protected platformName = 'OpenCLI';

  /**
   * Post video via OpenCLI bridge.
   * Note: CLI-based uploaders ignore the Playwright context.
   */
  async postVideo(
    _context: BrowserContext,
    options: UploadOptions,
    onProgress: (progress: number) => void
  ): Promise<void> {
    const platformId = options.platform_id;
    if (!platformId) throw new Error('Missing dynamic platform_id in options');

    const ext = extensionService.getExtensionByPlatformId(platformId);
    if (!ext) throw new Error(`Extension with ID ${platformId} not found in registry`);

    // Fetch credentials if userName is provided (Strategy: local session / managed)
    const credentials = options.userName ? extensionService.getCredentials(platformId, options.userName) : {};
    const mergedOptions = { ...options, ...credentials };

    const manifest = ext.manifest;
    const action = manifest.actions.publish_video;
    if (!action || typeof action === 'string') {
      throw new Error(`Platform ${ext.name} does not support publish_video`);
    }

    const tempFiles: string[] = [];
    try {
      const args = this.buildArgs(ext.manifest.executable_args, action, mergedOptions, tempFiles);
      
      let progressRegex: RegExp | undefined;
      if (action.progress_regex) {
        try {
          progressRegex = new RegExp(action.progress_regex);
        } catch (error) {
          logger.error(`Invalid progress_regex for ${ext.name}: ${action.progress_regex}. Error: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      // Mask sensitive arguments for logging (best effort: mask any value following a flag that might contain tokens)
      const maskedArgs = args.map((arg, i, arr) => {
        const prev = arr[i - 1];
        if (prev && (prev.includes('token') || prev.includes('cookie') || prev.includes('pass') || prev.includes('key') || prev.includes('user'))) {
          return '********';
        }
        return arg;
      });

      logger.info(`Dispatching OpenCLI publish for ${ext.name}: ${ext.executable} ${maskedArgs.join(' ')}`.trim());

      const result = await OpenCLIRunner.run(ext.executable, args, {
        onProgress,
        progressRegex,
        onLog: (line) => logger.debug(`[${ext.name}] ${line}`)
      });

      if (result.code !== 0) {
        throw new Error(`OpenCLI publish failed with code ${result.code}: ${result.stderr}`);
      }
    } finally {
      // Clean up temp files
      for (const f of tempFiles) {
        fs.rmSync(f, { force: true });
      }
    }
  }

  /**
   * Post article via OpenCLI bridge.
   */
  async postArticle(
    _context: BrowserContext,
    options: UploadOptions,
    onProgress: (progress: number) => void
  ): Promise<void> {
    const platformId = options.platform_id;
    if (!platformId) throw new Error('Missing dynamic platform_id in options');

    const ext = extensionService.getExtensionByPlatformId(platformId);
    if (!ext) throw new Error(`Extension with ID ${platformId} not found`);

    const credentials = options.userName ? extensionService.getCredentials(platformId, options.userName) : {};
    const mergedOptions = { ...options, ...credentials };

    const action = ext.manifest.actions.publish_article;
    if (!action || typeof action === 'string') {
        throw new Error(`Platform ${ext.name} does not support publish_article`);
    }

    const tempFiles: string[] = [];
    try {
      const args = this.buildArgs(ext.manifest.executable_args, action, mergedOptions, tempFiles);
      
      let progressRegex: RegExp | undefined;
      if (action.progress_regex) {
        try {
          progressRegex = new RegExp(action.progress_regex);
        } catch (error) {
          logger.error(`Invalid progress_regex for ${ext.name}: ${action.progress_regex}`);
        }
      }

      const result = await OpenCLIRunner.run(ext.executable, args, {
        onProgress,
        progressRegex
      });

      if (result.code !== 0) {
        throw new Error(`OpenCLI publish failed: ${result.stderr}`);
      }
    } finally {
      for (const f of tempFiles) {
        fs.rmSync(f, { force: true });
      }
    }
  }

  private buildArgs(baseArgs: string[] | undefined, action: OCSAction, options: Record<string, unknown>, tempFiles: string[]): string[] {
    const args: string[] = [];
    if (Array.isArray(baseArgs)) args.push(...baseArgs);
    if (action.command) args.push(action.command);
    args.push(...this.mapOptionsToArgs(options, action.args, tempFiles));
    return args;
  }

  private mapOptionsToArgs(options: Record<string, unknown>, argMapping: Record<string, string>, tempFiles: string[]): string[] {
    const args: string[] = [];
    const nestedArticle = options.article && typeof options.article === 'object'
      ? options.article as Record<string, unknown>
      : null;
    
    // Threshold for writing to a temp file instead of passing via argv (to avoid E2BIG)
    // 4KB is a safe conservative limit for most OS argv items
    const LARGE_FIELD_THRESHOLD = 4096;

    for (const [key, flag] of Object.entries(argMapping)) {
      const value = options[key] ?? nestedArticle?.[key];
      if (value !== undefined && value !== null && value !== '') {
        const stringValue = Array.isArray(value) ? value.join(',') : String(value);
        
        if (stringValue.length > LARGE_FIELD_THRESHOLD) {
          const tempPath = path.join(os.tmpdir(), `omnipost-${key}-${crypto.randomUUID()}.tmp`);
          fs.writeFileSync(tempPath, stringValue, { mode: 0o600 });
          tempFiles.push(tempPath);
          
          args.push(flag);
          args.push(`@${tempPath}`); // Use @ prefix to indicate file path (common CLI convention)
          logger.debug(`Field ${key} is large (${stringValue.length} bytes), passing via temp file: ${tempPath}`);
        } else {
          args.push(flag);
          args.push(stringValue);
        }
      }
    }
    return args;
  }
}
