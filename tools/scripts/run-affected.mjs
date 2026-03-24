import { execSync, spawnSync } from 'node:child_process';

const run = (cmd, args) => {
  const result = spawnSync(cmd, args, { stdio: 'inherit' });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

const execLines = (command) => {
  const output = execSync(command, { encoding: 'utf8' }).trim();
  if (!output) {
    return [];
  }
  return output.split('\n').map((line) => line.trim()).filter(Boolean);
};

const changedFiles = new Set([
  ...execLines('git diff --name-only --relative HEAD'),
  ...execLines('git ls-files --others --exclude-standard'),
]);

const forceAll = process.argv.includes('--all');
const hasChanges = changedFiles.size > 0;

const matches = (prefix) => [...changedFiles].some((file) => file.startsWith(prefix));
const nodeInfraChanged = [...changedFiles].some((file) =>
  file === 'package.json'
  || file === 'package-lock.json'
  || file.startsWith('packages/shared-config/')
  || file.startsWith('.github/actions/')
  || file.startsWith('.github/workflows/')
);

const affected = {
  shared: forceAll || nodeInfraChanged || matches('packages/shared/'),
  cli: forceAll || nodeInfraChanged || matches('packages/cli/'),
  frontend: forceAll || nodeInfraChanged || matches('apps/frontend/'),
  backendNode: forceAll || nodeInfraChanged || matches('apps/backend-node/'),
};

if (!forceAll && !hasChanges) {
  console.log('No changed files detected. Nothing to run.');
  process.exit(0);
}

console.log('Detected affected targets:', affected);
run('node', ['tools/scripts/check-no-new-any.mjs']);

if (affected.shared) {
  run('npm', ['run', 'lint', '-w', '@omni-post/shared']);
  run('npm', ['run', 'test', '-w', '@omni-post/shared']);
  run('npm', ['run', 'build', '-w', '@omni-post/shared']);
}

if (affected.cli) {
  run('npm', ['run', 'lint', '-w', '@omni-post/shared-cli']);
  run('npm', ['run', 'build', '-w', '@omni-post/shared-cli']);
}

if (affected.frontend) {
  run('npm', ['run', 'lint', '-w', 'apps/frontend']);
  run('npm', ['run', 'test', '-w', 'apps/frontend']);
}

if (affected.backendNode) {
  run('npm', ['run', 'lint', '-w', 'apps/backend-node']);
  run('npm', ['run', 'typecheck', '-w', 'apps/backend-node']);
  run('npm', ['run', 'test', '-w', 'apps/backend-node']);
}

console.log('Affected checks completed successfully.');
