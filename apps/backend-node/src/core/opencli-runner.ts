import { spawn } from 'child_process';
import { logger } from './logger.js';

/**
 * Options for running an OpenCLI command.
 */
export interface RunOptions {
  /** Callback for real-time progress updates (0-100) */
  onProgress?: (progress: number) => void;
  /** Callback for raw stdout/stderr lines */
  onLog?: (line: string) => void;
  /** Timeout in milliseconds (default: 5 minutes) */
  timeout?: number;
  /** Current working directory for the command */
  cwd?: string;
  /** Environment variables to merge with process.env */
  env?: Record<string, string>;
  /** Regex to extract progress percentage from stdout */
  progressRegex?: RegExp;
}

/**
 * Result of a CLI command execution.
 */
export interface RunResult {
  code: number | null;
  stdout: string;
  stderr: string;
}

/**
 * Generic runner for OpenCLI tools using child_process.spawn.
 * Ensures safe execution by avoiding shell interpolation.
 */
export class OpenCLIRunner {
  /**
   * Execute a command with provided arguments.
   */
  static async run(command: string, args: string[], options: RunOptions = {}): Promise<RunResult> {
    const {
      onProgress,
      onLog,
      timeout = 300000, 
      cwd,
      env = {},
      progressRegex
    } = options;

    return new Promise((resolve, reject) => {
      let stdout = '';
      let stderr = '';

      const child = spawn(command, args, {
        cwd,
        env: { ...process.env, ...env },
        shell: false // SECURE: Avoid shell injection
      });

      const timer = setTimeout(() => {
        child.kill();
        reject(new Error(`Command timed out after ${timeout}ms: ${command} ${args.join(' ')}`));
      }, timeout);

      const processLine = (data: Buffer, stream: 'stdout' | 'stderr') => {
        const line = data.toString();
        if (stream === 'stdout') {
          stdout += line;
          // Progress parsing
          if (onProgress && progressRegex) {
            const match = line.match(progressRegex);
            if (match && match[1]) {
              const p = parseInt(match[1], 10);
              if (!isNaN(p)) onProgress(p);
            }
          }
        } else {
          stderr += line;
        }

        if (onLog) onLog(line.trim());
        logger.debug(`[OpenCLI][${stream}] ${line.trim()}`);
      };

      child.stdout.on('data', (data) => processLine(data, 'stdout'));
      child.stderr.on('data', (data) => processLine(data, 'stderr'));

      child.on('close', (code) => {
        clearTimeout(timer);
        if (code === 0) {
          resolve({ code, stdout, stderr });
        } else {
          logger.warn(`OpenCLI exit code ${code} for: ${command} ${args.join(' ')}`);
          resolve({ code, stdout, stderr });
        }
      });

      child.on('error', (err) => {
        clearTimeout(timer);
        logger.error(`OpenCLI spawn error: ${err.message}`);
        reject(err);
      });
    });
  }
}
