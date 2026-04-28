import { AuditEntry } from '../../types/derailment';

export interface DerailmentLogger {
  log(entry: AuditEntry): void;
  getEntries(): AuditEntry[];
  getEntriesByLayer(layer: number): AuditEntry[];
  getEntriesByCategory(category: string): AuditEntry[];
  clear(): void;
}

const LOG_FILE_PATH = '/home/leviathan/OPENCODE_WORKSPACE/DEBUG LOGS/derailment-audit.json';

let entries: AuditEntry[] = [];

export function createDerailmentLogger(): DerailmentLogger {
  return {
    log(entry: AuditEntry): void {
      entries.push(entry);
      persistToFile(entry);
    },
    getEntries(): AuditEntry[] {
      return [...entries];
    },
    getEntriesByLayer(layer: number): AuditEntry[] {
      return entries.filter(e => e.layer === layer);
    },
    getEntriesByCategory(category: string): AuditEntry[] {
      return entries.filter(e => e.category === category);
    },
    clear(): void {
      entries = [];
    },
  };
}

function persistToFile(entry: AuditEntry): void {
  try {
    const fs = require('fs');
    let existing: AuditEntry[] = [];
    
    if (fs.existsSync(LOG_FILE_PATH)) {
      const content = fs.readFileSync(LOG_FILE_PATH, 'utf-8');
      existing = JSON.parse(content);
    }
    
    existing.push(entry);
    fs.writeFileSync(LOG_FILE_PATH, JSON.stringify(existing, null, 2));
  } catch (err) {
    console.error('[L5 AUDIT] Failed to persist entry:', err);
  }
}

export function getAuditEntries(): AuditEntry[] {
  return [...entries];
}

export function clearAuditEntries(): void {
  entries = [];
}
