export type CleanupSeverity = 'info' | 'warn' | 'critical';

export type CleanupIssueKind =
  | 'empty-channel'
  | 'duplicate-channel'
  | 'bad-naming'
  | 'category-clutter'
  | 'permission-issue'
  | 'unused-role'
  | 'dead-channel'
  | 'spam-channel'
  | 'inconsistent-formatting';

export interface CleanupIssue {
  kind: CleanupIssueKind;
  severity: CleanupSeverity;
  /** Discord channel/role/category id this issue refers to (if applicable). */
  targetId?: string;
  /** Human-readable display name (e.g., #general or @Member). */
  targetName?: string;
  description: string;
  /** Suggested action a human or auto-clean should take. */
  suggestion: string;
}

export interface CleanupReport {
  guildId: string;
  guildName: string;
  scannedAt: string;
  totals: {
    channels: number;
    roles: number;
    categories: number;
  };
  issues: CleanupIssue[];
}

export interface CleanupApplyReport {
  archivedChannels: string[];
  deletedRoles: string[];
  renamedChannels: { from: string; to: string }[];
  errors: string[];
}
