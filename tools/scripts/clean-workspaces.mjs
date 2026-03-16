import fs from 'fs/promises';
import path from 'path';

const repoRoot = process.cwd();
const targets = ['node_modules', 'dist', 'build', 'coverage', '.cache', '.vite'];

const removeIfExists = async (targetPath) => {
  try {
    await fs.rm(targetPath, { recursive: true, force: true });
  } catch {
    // ignore
  }
};

const listDirs = async (baseDir) => {
  try {
    const entries = await fs.readdir(baseDir, { withFileTypes: true });
    return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  } catch {
    return [];
  }
};

const cleanDir = async (dirPath) => {
  for (const target of targets) {
    await removeIfExists(path.join(dirPath, target));
  }
};

const main = async () => {
  await cleanDir(repoRoot);

  const appDirs = await listDirs(path.join(repoRoot, 'apps'));
  for (const dir of appDirs) {
    await cleanDir(path.join(repoRoot, 'apps', dir));
  }

  const packageDirs = await listDirs(path.join(repoRoot, 'packages'));
  for (const dir of packageDirs) {
    await cleanDir(path.join(repoRoot, 'packages', dir));
  }

  console.log('Workspace clean complete.');
};

main().catch((err) => {
  console.error('Workspace clean failed:', err);
  process.exit(1);
});
