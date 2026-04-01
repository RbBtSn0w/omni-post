import { describe, it, expect, vi } from 'vitest';
import { OpenCLIRunner } from '../../src/core/opencli-runner.js';

describe('OpenCLIRunner', () => {
  it('should run a simple command and return output', async () => {
    const result = await OpenCLIRunner.run('echo', ['hello world']);
    expect(result.code).toBe(0);
    expect(result.stdout.trim()).toBe('hello world');
  });

  it('should handle multiple arguments safely', async () => {
    const result = await OpenCLIRunner.run('echo', ['arg1', 'arg2']);
    expect(result.code).toBe(0);
    expect(result.stdout.trim()).toBe('arg1 arg2');
  });

  it('should parse progress from stdout based on regex', async () => {
    const onProgress = vi.fn();
    await OpenCLIRunner.run('echo', ['Progress: 75%'], {
      onProgress,
      progressRegex: /Progress: (\d+)%/
    });
    expect(onProgress).toHaveBeenCalledWith(75);
  });

  it('should handle non-zero exit code', async () => {
    // ls on non-existent file usually returns 1 or 2
    const result = await OpenCLIRunner.run('ls', ['/non-existent-directory-xyz-123']);
    expect(result.code).not.toBe(0);
    expect(result.code).not.toBeNull();
  });

  it('should fail on timeout', async () => {
    // sleep for 2 seconds, but set timeout to 500ms
    await expect(OpenCLIRunner.run('sleep', ['2'], { timeout: 500 }))
      .rejects.toThrow(/timed out/);
  });
});
