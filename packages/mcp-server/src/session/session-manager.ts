import fs from 'node:fs';
import path from 'node:path';
import { log } from '../util/logger.js';

const WORKSPACE_DIR = process.env.WORKSPACE_DIR || './workspace';

export interface Session {
  name: string;
  path: string;
  slidesDir: string;
  snapshotsDir: string;
  createdAt: string;
}

export class SessionManager {
  private current: Session | null = null;

  start(name?: string): Session {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const sessionName = name || 'default';
    const dirName = `session-${sessionName}-${timestamp}`;
    const sessionPath = path.resolve(WORKSPACE_DIR, dirName);
    const slidesDir = path.join(sessionPath, 'slides');
    const snapshotsDir = path.join(sessionPath, 'snapshots');

    fs.mkdirSync(slidesDir, { recursive: true });
    fs.mkdirSync(snapshotsDir, { recursive: true });

    this.current = {
      name: sessionName,
      path: sessionPath,
      slidesDir,
      snapshotsDir,
      createdAt: new Date().toISOString(),
    };

    log.info(`Session started: ${sessionPath}`);
    return this.current;
  }

  getCurrent(): Session | null {
    return this.current;
  }

  requireCurrent(): Session {
    if (!this.current) {
      throw new Error('No active session. Call start_session first.');
    }
    return this.current;
  }

  /**
   * Resolve a file path that may be relative to the session or absolute.
   */
  resolveFilePath(filePath: string): string {
    if (path.isAbsolute(filePath)) {
      return filePath;
    }
    if (this.current) {
      return path.resolve(this.current.path, filePath);
    }
    return path.resolve(filePath);
  }
}
