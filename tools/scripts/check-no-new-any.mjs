import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);

const getArgValue = (name) => {
  const index = args.indexOf(name);
  if (index === -1) {
    return '';
  }
  return args[index + 1] ?? '';
};

const base = getArgValue('--base');
const head = getArgValue('--head');

const isTsFile = (file) => {
  const ext = path.extname(file);
  return ['.ts', '.tsx', '.mts', '.cts'].includes(ext);
};

const shouldCheckFile = (file) => {
  if (!file || file.endsWith('.d.ts') || file.endsWith('.min.js')) {
    return false;
  }
  if (!isTsFile(file)) {
    return false;
  }
  if (
    !file.startsWith('apps/backend-node/')
    && !file.startsWith('apps/frontend/')
    && !file.startsWith('packages/cli/')
    && !file.startsWith('packages/shared/')
  ) {
    return false;
  }
  return true;
};

const runGit = (gitArgs) => {
  try {
    return execFileSync('git', gitArgs, { encoding: 'utf8' });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to execute git ${gitArgs.join(' ')}: ${message}`);
  }
};

const listFromOutput = (output) =>
  output
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

const explicitAnyPatterns = [
  /:\s*any\b/,
  /\bas\s+any\b/,
  /<\s*any\s*>/,
  /\bArray<\s*any\s*>/,
];

const hasExplicitAny = (line) => explicitAnyPatterns.some((pattern) => pattern.test(line));

const findAddedAnyFromPatch = (patchText) => {
  const lines = patchText.split('\n');
  const matches = [];
  let lineNumber = 0;

  for (const line of lines) {
    const hunkMatch = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
    if (hunkMatch) {
      lineNumber = Number(hunkMatch[1]);
      continue;
    }

    if (line.startsWith('+++') || line.startsWith('---')) {
      continue;
    }

    if (line.startsWith('+')) {
      const content = line.slice(1);
      if (hasExplicitAny(content)) {
        matches.push({ line: lineNumber, content });
      }
      lineNumber += 1;
      continue;
    }

    if (!line.startsWith('-') && !line.startsWith('\\')) {
      lineNumber += 1;
    }
  }

  return matches;
};

const findAnyInUntrackedFile = (filePath) => {
  try {
    const content = readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    return lines
      .map((line, index) => ({ line: index + 1, content: line }))
      .filter((entry) => hasExplicitAny(entry.content));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to read file "${filePath}" while checking explicit any: ${message}`);
  }
};

const collectChangedFiles = () => {
  if (base && head) {
    return listFromOutput(runGit(['diff', '--name-only', '--diff-filter=AMRT', '--relative', `${base}..${head}`]));
  }

  const tracked = listFromOutput(runGit(['diff', '--name-only', '--diff-filter=AMRT', '--relative', 'HEAD']));
  const untracked = listFromOutput(runGit(['ls-files', '--others', '--exclude-standard']));
  return [...new Set([...tracked, ...untracked])];
};

const changedFiles = collectChangedFiles().filter(shouldCheckFile);

if (changedFiles.length === 0) {
  console.log('No changed TypeScript files to check for explicit any.');
  process.exit(0);
}

const untrackedFiles = new Set();
if (!base || !head) {
  for (const file of listFromOutput(runGit(['ls-files', '--others', '--exclude-standard']))) {
    if (shouldCheckFile(file)) {
      untrackedFiles.add(file);
    }
  }
}

const violations = [];

for (const file of changedFiles) {
  if (untrackedFiles.has(file)) {
    const hits = findAnyInUntrackedFile(file);
    for (const hit of hits) {
      violations.push({ file, line: hit.line, content: hit.content });
    }
    continue;
  }

  const diffRange = base && head ? `${base}..${head}` : 'HEAD';
  const patch = runGit(['diff', '--unified=0', '--no-color', diffRange, '--', file]);
  const hits = findAddedAnyFromPatch(patch);
  for (const hit of hits) {
    violations.push({ file, line: hit.line, content: hit.content });
  }
}

if (violations.length > 0) {
  console.error('Detected newly added explicit any usages:');
  for (const violation of violations) {
    console.error(`- ${violation.file}:${violation.line} -> ${violation.content.trim()}`);
  }
  process.exit(1);
}

console.log('No newly added explicit any usages detected.');
