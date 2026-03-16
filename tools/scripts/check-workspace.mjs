import fs from 'fs/promises';
import path from 'path';

const repoRoot = process.cwd();
const appsDir = path.join(repoRoot, 'apps');
const packagesDir = path.join(repoRoot, 'packages');

const requiredScripts = ['dev', 'build', 'test', 'lint', 'clean'];

const isDirectory = async (dirPath) => {
  try {
    const stat = await fs.stat(dirPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
};

const readJson = async (filePath) => {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw);
};

const listPackages = async (baseDir) => {
  if (!(await isDirectory(baseDir))) {
    return [];
  }
  const entries = await fs.readdir(baseDir);
  const result = [];
  for (const entry of entries) {
    const fullPath = path.join(baseDir, entry);
    if (!(await isDirectory(fullPath))) {
      continue;
    }
    const pkgPath = path.join(fullPath, 'package.json');
    try {
      await fs.access(pkgPath);
      result.push({ name: entry, dir: fullPath, pkgPath });
    } catch {
      continue;
    }
  }
  return result;
};

const collectWorkspace = async () => {
  const apps = await listPackages(appsDir);
  const packages = await listPackages(packagesDir);
  return { apps, packages };
};

const validateScripts = (pkgJson, pkgName) => {
  const missing = [];
  const scripts = pkgJson.scripts || {};
  for (const scriptName of requiredScripts) {
    if (!scripts[scriptName]) {
      missing.push(scriptName);
    }
  }
  if (missing.length) {
    return `${pkgName}: missing scripts ${missing.join(', ')}`;
  }
  return null;
};

const validateName = (pkgJson, pkgDirName, type) => {
  if (!pkgJson.name) {
    return `${pkgDirName}: missing package.json name`;
  }
  if (type === 'app') {
    const expected = `@omni-post/${pkgDirName}`;
    if (pkgJson.name !== expected) {
      return `${pkgDirName}: expected name ${expected}`;
    }
    if (pkgJson.private !== true) {
      return `${pkgDirName}: apps must be private`;
    }
  } else {
    const expected = pkgDirName.startsWith('shared-')
      ? `@omni-post/${pkgDirName}`
      : `@omni-post/shared-${pkgDirName}`;
    if (pkgJson.name !== expected) {
      return `${pkgDirName}: expected name ${expected}`;
    }
  }
  return null;
};

const validateWorkspaceDeps = (pkgJson, workspaceNames, pkgDirName) => {
  const problems = [];
  const sections = ['dependencies', 'devDependencies', 'peerDependencies'];
  for (const section of sections) {
    const deps = pkgJson[section] || {};
    for (const [dep, version] of Object.entries(deps)) {
      if (!workspaceNames.has(dep)) {
        continue;
      }
      if (!version.startsWith('workspace:')) {
        problems.push(`${pkgDirName}: ${dep} must use workspace:*`);
      }
    }
  }
  return problems;
};

const main = async () => {
  const { apps, packages } = await collectWorkspace();
  const workspaceNames = new Set();
  for (const pkg of [...apps, ...packages]) {
    const pkgJson = await readJson(pkg.pkgPath);
    workspaceNames.add(pkgJson.name);
  }

  const errors = [];
  for (const pkg of apps) {
    const pkgJson = await readJson(pkg.pkgPath);
    const nameError = validateName(pkgJson, pkg.name, 'app');
    if (nameError) {
      errors.push(nameError);
    }
    const scriptError = validateScripts(pkgJson, pkg.name);
    if (scriptError) {
      errors.push(scriptError);
    }
    errors.push(...validateWorkspaceDeps(pkgJson, workspaceNames, pkg.name));
  }

  for (const pkg of packages) {
    const pkgJson = await readJson(pkg.pkgPath);
    const nameError = validateName(pkgJson, pkg.name, 'package');
    if (nameError) {
      errors.push(nameError);
    }
    const scriptError = validateScripts(pkgJson, pkg.name);
    if (scriptError) {
      errors.push(scriptError);
    }
    errors.push(...validateWorkspaceDeps(pkgJson, workspaceNames, pkg.name));
  }

  if (errors.length) {
    console.error('Workspace contract violations:');
    for (const err of errors) {
      console.error(`- ${err}`);
    }
    process.exit(1);
  }

  console.log('Workspace contract checks passed.');
};

main().catch((err) => {
  console.error('Workspace check failed:', err);
  process.exit(1);
});
