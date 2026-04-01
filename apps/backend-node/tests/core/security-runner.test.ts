import { EventEmitter } from 'events';
import { PassThrough } from 'stream';
import { describe, expect, it, vi } from 'vitest';

const spawnMock = vi.fn();

vi.mock('child_process', () => ({
  spawn: (...args: unknown[]) => spawnMock(...args),
}));

class MockChildProcess extends EventEmitter {
  stdout = new PassThrough();
  stderr = new PassThrough();

  kill(): boolean {
    this.emit('close', null);
    return true;
  }
}

describe('OpenCLIRunner Security', () => {
  it('should execute with shell=false and keep malicious-looking args as plain values', async () => {
    spawnMock.mockImplementation((command: string, args: string[], options: { shell?: boolean }) => {
      const child = new MockChildProcess();
      setImmediate(() => {
        child.stdout.write(`cmd=${command};args=${JSON.stringify(args)}`);
        child.stdout.end();
        child.stderr.end();
        child.emit('close', 0);
      });
      expect(options.shell).toBe(false);
      return child;
    });

    const { OpenCLIRunner } = await import('../../src/core/opencli-runner.js');

    const malicious = 'title; rm -rf /; $(touch /tmp/pwned)';
    const result = await OpenCLIRunner.run('echo', [malicious]);

    expect(spawnMock).toHaveBeenCalledTimes(1);
    expect(spawnMock).toHaveBeenCalledWith(
      'echo',
      [malicious],
      expect.objectContaining({ shell: false })
    );
    expect(result.code).toBe(0);
    expect(result.stdout).toContain(malicious);
  });
});
