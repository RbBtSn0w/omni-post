import { spawnSync } from 'child_process';
import path from 'path';

const repoRoot = process.cwd();
const backendDir = path.join(repoRoot, 'apps', 'backend');

const run = (cmd, args, options = {}) =>
  spawnSync(cmd, args, { stdio: 'inherit', shell: false, ...options });

const hasBinary = (name) => {
  const result = spawnSync(name, ['--version'], { stdio: 'ignore' });
  return result.status === 0;
};

const main = () => {
  if (!hasBinary('python3') && !hasBinary('python')) {
    console.warn('Python not found. Skipping legacy backend install.');
    return;
  }

  const pythonCmd = hasBinary('python3') ? 'python3' : 'python';
  const pipArgs = ['-m', 'pip', 'install', '-r', 'requirements.txt'];
  const result = run(pythonCmd, pipArgs, { cwd: backendDir });

  if (result.status !== 0) {
    console.warn('Python dependency install failed. Continuing setup.');
  }
};

main();
