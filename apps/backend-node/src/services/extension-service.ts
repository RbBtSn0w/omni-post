import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { logger } from '../core/logger.js';
import { OpenCLIRunner } from '../core/opencli-runner.js';
import { dbManager } from '../db/database.js';

export interface OCSAction {
  command?: string;
  args: Record<string, string>;
  progress_regex?: string;
}

export interface OCSManifest {
  ocs_version: string;
  name: string;
  version: string;
  description?: string;
  command?: string;
  platform_id?: number; // Optional override for native platforms (e.g. 8 for WX MP)
  executable?: string; // Optional path override
  executable_args?: string[];
  actions: {
    publish_video?: OCSAction;
    publish_article?: OCSAction;
    [key: string]: string | OCSAction | undefined;
  };
}

export interface ExtensionInfo {
  id: string;
  platform_id: number;
  name: string;
  manifest: OCSManifest;
  executable: string; // Absolute executable path or binary name
  source_type: 'system' | 'local';
}

interface SystemExtensionRow {
  id: string;
  platform_id: number;
  name: string;
  manifest: string;
  executable: string;
  source_type: 'system' | 'local';
}

interface CredentialsRow {
  credentials: string | null;
}

interface CommandSpec {
  executable: string;
  executableArgs: string[];
}

interface OpenCLIListArg {
  name?: string;
  positional?: boolean;
}

interface OpenCLIListItem {
  command?: string;
  site?: string;
  name?: string;
  description?: string;
  args?: OpenCLIListArg[];
}

export class ExtensionService {
  private static readonly DYNAMIC_ID_START = 100;
  private static readonly SYSTEM_DYNAMIC_ID_START = 10000;
  private static readonly SAFE_LOCAL_EXECUTABLES = new Set(['opencli']);
  private lastSyncAttempt = 0;
  private static readonly SYNC_COOLDOWN_MS = 30000; // 30 seconds cooldown

  private resolveLocalExtDirs(): string[] {
    const candidates = [
      path.resolve(process.cwd(), 'extensions'),
      path.resolve(process.cwd(), '..', 'extensions'),
      path.resolve(process.cwd(), '..', '..', 'extensions'),
    ];
    const unique = [...new Set(candidates)];
    const existing = unique.filter((dir) => fs.existsSync(dir));
    if (existing.length > 0) return existing;
    return [unique[0]];
  }

  /**
   * Sync all extensions from system and local directory.
   */
  async syncExtensions(force = false): Promise<number> {
    const now = Date.now();
    const db = dbManager.getDb();
    
    // If not forced and we tried recently and have no extensions, skip to avoid overhead.
    if (!force && (now - this.lastSyncAttempt < ExtensionService.SYNC_COOLDOWN_MS)) {
      const existing = this.getAllExtensions();
      if (existing.length === 0) {
        logger.debug('Skipping redundant OpenCLI sync (cooldown active)');
        return 0;
      }
    }
    
    this.lastSyncAttempt = now;
    logger.info('Syncing OpenCLI extensions...');
    const systemExtensions = await this.discoverSystemExtensions();
    const localExtensions = await this.discoverLocalExtensions();
    const mergedByPlatformId = new Map<number, ExtensionInfo>();

    // System first, local last to enforce local override on conflicts.
    for (const ext of systemExtensions) {
      mergedByPlatformId.set(ext.platform_id, ext);
    }
    for (const ext of localExtensions) {
      mergedByPlatformId.set(ext.platform_id, ext);
    }
    const allExtensions = [...mergedByPlatformId.values()];

    let count = 0;
    db.transaction(() => {
      // Full refresh to avoid stale rows from removed extensions.
      db.prepare('DELETE FROM system_extensions').run();
      for (const ext of allExtensions) {
        db.prepare(`
          INSERT OR REPLACE INTO system_extensions (id, platform_id, name, manifest, executable, source_type, last_synced)
          VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).run(ext.id, ext.platform_id, ext.name, JSON.stringify(ext.manifest), ext.executable, ext.source_type);
        count++;
      }
    })();

    logger.info(`Synced ${count} extensions successfully.`);
    return count;
  }

  /**
   * Check if global opencli environment is ready.
   */
  async checkEnvironment(): Promise<{ installed: boolean; binary_path: string; version?: string }> {
    try {
      const binaryPath = execFileSync('which', ['opencli'], { stdio: ['pipe', 'pipe', 'pipe'] }).toString().trim();
      if (!binaryPath) return { installed: false, binary_path: '' };

      const version = execFileSync(binaryPath, ['--version'], { stdio: ['pipe', 'pipe', 'pipe'] }).toString().trim();
      return { installed: true, binary_path: binaryPath, version };
    } catch {
      return { installed: false, binary_path: '' };
    }
  }

  /**
   * Get an extension by its dynamic platform ID.
   */
  getExtensionByPlatformId(platformId: number): ExtensionInfo | null {
    const db = dbManager.getDb();
    const row = db
      .prepare('SELECT * FROM system_extensions WHERE platform_id = ? ORDER BY source_type = \'local\' DESC, last_synced DESC LIMIT 1')
      .get(platformId) as SystemExtensionRow | undefined;
    if (!row) return null;
    return {
      id: row.id,
      platform_id: row.platform_id,
      name: row.name,
      manifest: JSON.parse(row.manifest),
      executable: row.executable,
      source_type: row.source_type as 'system' | 'local'
    };
  }

  /**
   * Get credentials for a dynamic platform and user.
   */
  getCredentials(platformId: number, userName: string): Record<string, string> {
    const db = dbManager.getDb();
    const row = db
      .prepare('SELECT credentials FROM user_info WHERE type = ? AND userName = ?')
      .get(platformId, userName) as CredentialsRow | undefined;
    if (!row || !row.credentials) return {};
    try {
      return JSON.parse(row.credentials);
    } catch {
      return {};
    }
  }

  /**
   * Get all registered extensions.
   */
  getAllExtensions(): ExtensionInfo[] {
    const db = dbManager.getDb();
    const rows = db
      .prepare('SELECT * FROM system_extensions ORDER BY source_type = \'local\' DESC, name ASC')
      .all() as SystemExtensionRow[];
    return rows.map(row => ({
      id: row.id,
      platform_id: row.platform_id,
      name: row.name,
      manifest: JSON.parse(row.manifest),
      executable: row.executable,
      source_type: row.source_type as 'system' | 'local'
    }));
  }

  private async discoverSystemExtensions(): Promise<ExtensionInfo[]> {
    const extensions: ExtensionInfo[] = [];
    try {
      const binaryPath = execFileSync('which', ['opencli'], { stdio: ['pipe', 'pipe', 'pipe'] }).toString().trim();
      if (binaryPath) {
        logger.debug(`Probing system opencli at ${binaryPath}`);
        const manifests = await this.discoverSystemManifests(binaryPath);
        const usedPlatformIds = new Set<number>();
        for (const manifest of manifests) {
          const commandSpec = this.resolveSystemCommandSpec(binaryPath, manifest);
          manifest.executable_args = commandSpec.executableArgs;
          const siteKey = this.getManifestSiteKey(manifest);
          const platformId = this.computeStableSystemPlatformId(siteKey, usedPlatformIds);
          extensions.push({
            id: `system-${siteKey}`,
            platform_id: platformId,
            name: manifest.name,
            manifest,
            executable: commandSpec.executable,
            source_type: 'system'
          });
        }
      }
    } catch (error) {
      logger.debug(`System opencli discovery failed: ${error instanceof Error ? error.message : String(error)}`);
    }
    return extensions;
  }

  private async discoverSystemManifests(binaryPath: string): Promise<OCSManifest[]> {
    const probeArgsList: string[][] = [
      ['list', '--json'],
      ['--ocs'],
      ['--manifest'],
      ['manifest', '--json'],
    ];

    for (const args of probeArgsList) {
      const result = await OpenCLIRunner.run(binaryPath, args, { timeout: 10000 });
      if (result.code !== 0 || !result.stdout.trim()) {
        continue;
      }
      const manifests = this.parseSystemManifestOutput(result.stdout);
      if (manifests.length > 0) {
        logger.info(`Detected ${manifests.length} OpenCLI system extension(s) via: ${binaryPath} ${args.join(' ')}`);
        return manifests;
      }
    }

    return [];
  }

  private parseSystemManifestOutput(raw: string): OCSManifest[] {
    try {
      const parsed = JSON.parse(raw) as unknown;
      const manifests = this.parseAsManifestList(parsed);
      if (manifests.length > 0) return manifests;

      const listItems = this.parseAsOpenCLIListItems(parsed);
      if (listItems.length > 0) return this.buildManifestsFromOpenCLIList(listItems);

      return [];
    } catch {
      return [];
    }
  }

  private parseAsManifestList(value: unknown): OCSManifest[] {
    const list = Array.isArray(value) ? value : [value];
    return list.filter((item): item is OCSManifest => {
      if (!item || typeof item !== 'object') return false;
      const record = item as Record<string, unknown>;
      return typeof record.name === 'string'
        && !!record.actions
        && typeof record.actions === 'object';
    });
  }

  private parseAsOpenCLIListItems(value: unknown): OpenCLIListItem[] {
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is OpenCLIListItem => {
      if (!item || typeof item !== 'object') return false;
      const record = item as Record<string, unknown>;
      return typeof record.command === 'string'
        && typeof record.site === 'string'
        && typeof record.name === 'string';
    });
  }

  private buildManifestsFromOpenCLIList(items: OpenCLIListItem[]): OCSManifest[] {
    const grouped = new Map<string, OpenCLIListItem[]>();
    for (const item of items) {
      const site = (item.site || '').trim();
      if (!site || site.startsWith('_')) continue;
      const current = grouped.get(site) || [];
      current.push(item);
      grouped.set(site, current);
    }

    const manifests: OCSManifest[] = [];
    for (const [site, commands] of grouped) {
      const actions: Record<string, string | OCSAction | undefined> = {};
      for (const command of commands) {
        const key = this.normalizeActionKey(command.name || command.command || 'action');
        actions[key] = {
          command: command.command,
          args: this.buildArgMap(command.args)
        };
      }

      const articleCmd = this.findBestPublishCommand(commands, 'article');
      const videoCmd = this.findBestPublishCommand(commands, 'video');
      if (articleCmd) {
        actions.publish_article = {
          command: articleCmd.command,
          args: this.buildArgMap(articleCmd.args),
        };
      }
      if (videoCmd) {
        actions.publish_video = {
          command: videoCmd.command,
          args: this.buildArgMap(videoCmd.args),
        };
      }

      manifests.push({
        ocs_version: '1.0',
        name: this.formatSiteName(site),
        version: 'system',
        description: `Discovered from opencli list --json (${commands.length} commands)`,
        command: 'opencli',
        actions,
      });
    }

    return manifests;
  }

  private normalizeActionKey(raw: string): string {
    const normalized = raw
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    return normalized || 'action';
  }

  private formatSiteName(site: string): string {
    return site
      .split(/[_-]/)
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase() + part.slice(1))
      .join(' ');
  }

  private buildArgMap(args: OpenCLIListArg[] | undefined): Record<string, string> {
    if (!Array.isArray(args)) return {};
    const map: Record<string, string> = {};
    for (const arg of args) {
      if (!arg || typeof arg.name !== 'string' || !arg.name.trim()) continue;
      map[arg.name] = `--${arg.name}`;
    }
    return map;
  }

  private findBestPublishCommand(commands: OpenCLIListItem[], mode: 'article' | 'video'): OpenCLIListItem | null {
    const candidates = commands.filter((item) => this.isLikelyPublishCommand(item));
    if (candidates.length === 0) return null;

    const scored = candidates
      .map((item) => ({ item, score: this.scorePublishCommand(item, mode) }))
      .sort((a, b) => b.score - a.score);
    if (scored[0].score <= 0) return null;
    return scored[0].item;
  }

  private isLikelyPublishCommand(item: OpenCLIListItem): boolean {
    const text = `${item.command || ''} ${item.name || ''} ${item.description || ''}`.toLowerCase();
    return /(publish|post|create|tweet|send)/.test(text);
  }

  private scorePublishCommand(item: OpenCLIListItem, mode: 'article' | 'video'): number {
    const text = `${item.command || ''} ${item.name || ''} ${item.description || ''}`.toLowerCase();
    const argNames = Array.isArray(item.args)
      ? item.args.map((arg) => (arg.name || '').toLowerCase())
      : [];
    let score = 0;

    if (/publish/.test(text)) score += 6;
    if (/post/.test(text)) score += 4;
    if (/create/.test(text)) score += 2;

    if (mode === 'video') {
      if (/(video|clip|media|upload)/.test(text)) score += 8;
      if (argNames.some((name) => /(video|media|file|path|cover)/.test(name))) score += 5;
      if (argNames.some((name) => /(text|content|title|body)/.test(name))) score -= 1;
    } else {
      if (/(article|note|tweet|post|thread|publish)/.test(text)) score += 5;
      if (argNames.some((name) => /(title|content|text|body|topic|tag|image)/.test(name))) score += 4;
      if (argNames.some((name) => /(video|clip)/.test(name))) score -= 2;
    }

    return score;
  }

  private getManifestSiteKey(manifest: OCSManifest): string {
    const actionCommands = Object.values(manifest.actions)
      .filter((action): action is OCSAction => !!action && typeof action === 'object')
      .map((action) => action.command || '')
      .filter(Boolean);
    const firstCommand = actionCommands[0] || manifest.name;
    const siteCandidate = firstCommand.split('/')[0] || manifest.name;
    return this.normalizeActionKey(siteCandidate);
  }

  private computeStableSystemPlatformId(siteKey: string, used: Set<number>): number {
    let hash = 2166136261;
    for (let i = 0; i < siteKey.length; i++) {
      hash ^= siteKey.charCodeAt(i);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    let id = ExtensionService.SYSTEM_DYNAMIC_ID_START + Math.abs(hash) % 9000;
    while (used.has(id)) id++;
    used.add(id);
    return id;
  }

  private async discoverLocalExtensions(): Promise<ExtensionInfo[]> {
    const extensions: ExtensionInfo[] = [];
    const localExtDirs = this.resolveLocalExtDirs();
    const existingDirs = localExtDirs.filter((dir) => fs.existsSync(dir));
    if (existingDirs.length === 0) {
      fs.mkdirSync(localExtDirs[0], { recursive: true });
      return [];
    }

    const visited = new Set<string>();
    const seenLocalExtensionNames = new Set<string>();
    let nextId = ExtensionService.DYNAMIC_ID_START;

    for (const localExtDir of existingDirs) {
      const dirs = fs.readdirSync(localExtDir);
      for (const dirName of dirs) {
        const extPath = path.join(localExtDir, dirName);
        if (visited.has(extPath)) continue;
        visited.add(extPath);
        if (!fs.statSync(extPath).isDirectory()) continue;
        if (seenLocalExtensionNames.has(dirName)) continue;

        const manifestPath = path.join(extPath, 'manifest.ocs.json');
        if (fs.existsSync(manifestPath)) {
          try {
            const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
            const manifest = JSON.parse(manifestContent) as OCSManifest;

            // Validate platform_id
            if (manifest.platform_id !== undefined) {
              const id = manifest.platform_id;
              const isReserved = id > 0 && id < ExtensionService.DYNAMIC_ID_START;
              const isAllowedBuiltIn = id === 8; // WX_OFFICIAL_ACCOUNT

              if (isReserved && !isAllowedBuiltIn) {
                logger.error(`Rejected local extension at ${extPath}: platform_id ${id} is reserved for built-in platforms.`);
                continue;
              }

              if (extensions.some(e => e.platform_id === id)) {
                logger.error(`Rejected local extension at ${extPath}: platform_id ${id} conflicts with another local extension.`);
                continue;
              }
            }

            const commandSpec = this.resolveLocalCommandSpec(extPath, manifest);
            manifest.executable_args = commandSpec.executableArgs;

            // Assign platform_id, ensuring auto-assigned IDs don't conflict with manifest-provided ones
            let platformId = manifest.platform_id;
            if (platformId === undefined) {
              while (extensions.some(e => e.platform_id === nextId)) {
                nextId++;
              }
              platformId = nextId++;
            }

            extensions.push({
              id: `local-${dirName}`,
              platform_id: platformId,
              name: manifest.name,
              manifest,
              executable: commandSpec.executable,
              source_type: 'local'
            });
            seenLocalExtensionNames.add(dirName);
          } catch (error) {
            logger.error(`Error parsing manifest at ${manifestPath}: ${error instanceof Error ? error.message : String(error)}`);
          }
        }
      }
    }
    return extensions;
  }

  private resolveSystemCommandSpec(binaryPath: string, manifest: OCSManifest): CommandSpec {
    const declared = manifest.command?.trim();
    if (!declared) {
      return {
        executable: binaryPath,
        executableArgs: [manifest.name.toLowerCase().replace(/\s+/g, '-')],
      };
    }

    const tokens = this.tokenizeCommand(declared);
    if (tokens.length === 0) {
      return { executable: binaryPath, executableArgs: [] };
    }

    if (tokens[0] === 'opencli') {
      return { executable: binaryPath, executableArgs: tokens.slice(1) };
    }

    return { executable: binaryPath, executableArgs: tokens };
  }

  private resolveLocalCommandSpec(extPath: string, manifest: OCSManifest): CommandSpec {
    const declared = manifest.executable?.trim();
    if (!declared) {
      return {
        executable: process.execPath,
        executableArgs: [path.join(extPath, 'cli.js')],
      };
    }

    const tokens = this.tokenizeCommand(declared);
    if (tokens.length === 0) {
      return {
        executable: process.execPath,
        executableArgs: [path.join(extPath, 'cli.js')],
      };
    }

    const [first, ...rest] = tokens;
    const executable = this.resolveLocalExecutable(first, extPath);
    const executableArgs = rest.map((arg) => this.resolveLocalArgPath(arg, extPath));

    return { executable, executableArgs };
  }

  private resolveLocalExecutable(token: string, extPath: string): string {
    if (token === 'node') return process.execPath;
    if (path.isAbsolute(token)) {
      const resolved = path.resolve(token);
      this.assertPathWithinExtension(resolved, extPath, 'executable');
      return resolved;
    }
    if (token.startsWith('./') || token.startsWith('../')) {
      const resolved = path.resolve(extPath, token);
      this.assertPathWithinExtension(resolved, extPath, 'executable');
      return resolved;
    }
    if (ExtensionService.SAFE_LOCAL_EXECUTABLES.has(token)) return token;
    throw new Error(`Unsafe local executable token: ${token}`);
  }

  private resolveLocalArgPath(token: string, extPath: string): string {
    if (token.startsWith('-')) return token;
    if (path.isAbsolute(token)) {
      const resolved = path.resolve(token);
      this.assertPathWithinExtension(resolved, extPath, 'argument');
      return resolved;
    }
    if (token.startsWith('./') || token.startsWith('../')) {
      const resolved = path.resolve(extPath, token);
      this.assertPathWithinExtension(resolved, extPath, 'argument');
      return resolved;
    }
    return token;
  }

  private assertPathWithinExtension(targetPath: string, extPath: string, label: string): void {
    const extRoot = path.resolve(extPath);
    const rel = path.relative(extRoot, targetPath);
    if (rel.startsWith('..') || path.isAbsolute(rel)) {
      throw new Error(`Unsafe local extension ${label} path outside extension directory: ${targetPath}`);
    }
  }

  private tokenizeCommand(command: string): string[] {
    const re = /"([^"]*)"|'([^']*)'|[^\s]+/g;
    const tokens: string[] = [];
    let match: RegExpExecArray | null = re.exec(command);
    while (match) {
      const token = match[1] ?? match[2] ?? match[0];
      if (token) tokens.push(token);
      match = re.exec(command);
    }
    return tokens;
  }
}

export const extensionService = new ExtensionService();
