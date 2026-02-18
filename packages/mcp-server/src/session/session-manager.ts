import fs from 'node:fs';
import path from 'node:path';
import { log } from '../util/logger.js';

export interface Session {
  name: string;
  slidesDir: string;
  snapshotsDir: string;
  createdAt: string;
}

export class SessionManager {
  private current: Session | null = null;
  private readonly projectRoot: string;

  constructor() {
    this.projectRoot = this.detectProjectRoot();
    log.info(`Project root: ${this.projectRoot}`);
  }

  private detectProjectRoot(): string {
    // 1. Explicit env var
    if (process.env.PROJECT_ROOT) {
      return path.resolve(process.env.PROJECT_ROOT);
    }

    // 2. Walk up from cwd looking for .git/
    let dir = process.cwd();
    while (true) {
      if (fs.existsSync(path.join(dir, '.git'))) {
        return dir;
      }
      const parent = path.dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }

    // 3. Fall back to cwd
    return process.cwd();
  }

  start(name?: string): Session {
    const sessionName = name || 'default';
    const slidesDir = path.join(this.projectRoot, 'design', 'slides');
    const snapshotsDir = path.join(this.projectRoot, 'design', 'screenshots');

    fs.mkdirSync(slidesDir, { recursive: true });
    fs.mkdirSync(snapshotsDir, { recursive: true });

    this.current = {
      name: sessionName,
      slidesDir,
      snapshotsDir,
      createdAt: new Date().toISOString(),
    };

    log.info(`Session started: ${sessionName} (project root: ${this.projectRoot})`);
    return this.current;
  }

  getCurrent(): Session | null {
    return this.current;
  }

  getProjectRoot(): string {
    return this.projectRoot;
  }

  /**
   * Resolve a file path. Absolute paths pass through.
   * Relative paths resolve against the project root.
   */
  resolveFilePath(filePath: string): string {
    if (path.isAbsolute(filePath)) {
      return filePath;
    }
    return path.resolve(this.projectRoot, filePath);
  }

  /**
   * Convert an absolute path to a project-relative path.
   */
  toProjectRelative(absolutePath: string): string {
    return path.relative(this.projectRoot, absolutePath);
  }
}
