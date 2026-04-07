import { describe, it, expect, vi } from 'vitest';
import { OpenCLIRunner } from '../../src/core/opencli-runner.js';

describe('OpenCLIRunner', () => {
  it('should run a simple command and return output', async () => {
    const result = await OpenCLIRunner.run('node', ['-e', 'console.log("hello world")']);
    expect(result.code).toBe(0);
    expect(result.stdout.trim()).toBe('hello world');
  });

  it('should handle multiple arguments safely', async () => {
    const result = await OpenCLIRunner.run('node', ['-e', 'console.log(process.argv.slice(1).join(" "))', 'arg1', 'arg2']);
    expect(result.code).toBe(0);
    expect(result.stdout.trim()).toBe('arg1 arg2');
  });

  it('should parse progress from stdout based on regex', async () => {
    const onProgress = vi.fn();
    await OpenCLIRunner.run('node', ['-e', 'console.log("Progress: 75%")'], {
      onProgress,
      progressRegex: /Progress: (\d+)%/
    });
    expect(onProgress).toHaveBeenCalledWith(75);
  });

  it('should handle non-zero exit code', async () => {
    // Exit with 1
    const result = await OpenCLIRunner.run('node', ['-e', 'process.exit(1)']);
    expect(result.code).not.toBe(0);
    expect(result.code).not.toBeNull();
  });

  it('should fail on timeout', async () => {
    // sleep for 2 seconds, but set timeout to 500ms
    await expect(OpenCLIRunner.run('node', ['-e', 'setTimeout(() => {}, 2000)'], { timeout: 500 }))
      .rejects.toThrow(/timed out/);
  });
});
