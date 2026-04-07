import { BrowserContext } from 'playwright';
import { BaseUploader } from '../base-uploader.js';
import { OpenCLIRunner } from '../../core/opencli-runner.js';
import { extensionService, type OCSAction } from '../../services/extension-service.js';
import { logger } from '../../core/logger.js';
import type { UploadOptions } from '../../db/models.js';

type OpenCLIOptions = UploadOptions & Record<string, unknown>;

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

    const args = this.buildArgs(ext.manifest.executable_args, action, mergedOptions);
    const progressRegex = action.progress_regex ? new RegExp(action.progress_regex) : undefined;

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

    const args = this.buildArgs(ext.manifest.executable_args, action, mergedOptions);
    const progressRegex = action.progress_regex ? new RegExp(action.progress_regex) : undefined;

    const result = await OpenCLIRunner.run(ext.executable, args, {
      onProgress,
      progressRegex
    });

    if (result.code !== 0) {
      throw new Error(`OpenCLI publish failed: ${result.stderr}`);
    }
  }

  private buildArgs(baseArgs: string[] | undefined, action: OCSAction, options: Record<string, unknown>): string[] {
    const args: string[] = [];
    if (Array.isArray(baseArgs)) args.push(...baseArgs);
    if (action.command) args.push(action.command);
    args.push(...this.mapOptionsToArgs(options, action.args));
    return args;
  }

  private mapOptionsToArgs(options: Record<string, unknown>, argMapping: Record<string, string>): string[] {
    const args: string[] = [];
    const nestedArticle = options.article && typeof options.article === 'object'
      ? options.article as Record<string, unknown>
      : null;
    for (const [key, flag] of Object.entries(argMapping)) {
      const value = options[key] ?? nestedArticle?.[key];
      if (value !== undefined && value !== null && value !== '') {
        args.push(flag);
        args.push(Array.isArray(value) ? value.join(',') : String(value));
      }
    }
    return args;
  }
}
