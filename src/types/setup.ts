/**
 * The user-facing dimensions of the interactive /setup-ai flow.
 * Each value maps to a base template and/or a set of overlays applied by
 * the AI service layer.
 */

export const SERVER_TYPES = [
  'minecraft',
  'ai-community',
  'startup',
  'creator',
  'business',
  'gaming',
  'support',
] as const;
export type ServerType = (typeof SERVER_TYPES)[number];

export const VIBES = [
  'minimal',
  'professional',
  'cyberpunk',
  'dark',
  'gaming',
  'startup',
] as const;
export type Vibe = (typeof VIBES)[number];

export const SYSTEMS = [
  'tickets',
  'verification',
  'suggestions',
  'applications',
  'giveaways',
  'dev-logs',
  'economy',
  'voice-channels',
  'ai-chat',
  'announcements',
] as const;
export type SystemKind = (typeof SYSTEMS)[number];

export interface SetupAnswers {
  type: ServerType;
  vibe: Vibe;
  systems: SystemKind[];
  /** Optional free-form description from the user (for future LLM use). */
  description?: string;
}

export const SERVER_TYPE_LABELS: Record<ServerType, string> = {
  minecraft: 'Minecraft',
  'ai-community': 'AI Community',
  startup: 'Startup',
  creator: 'Creator',
  business: 'Business',
  gaming: 'Gaming',
  support: 'Support',
};

export const VIBE_LABELS: Record<Vibe, string> = {
  minimal: 'Minimal',
  professional: 'Professional',
  cyberpunk: 'Cyberpunk',
  dark: 'Dark',
  gaming: 'Gaming',
  startup: 'Startup',
};

export const SYSTEM_LABELS: Record<SystemKind, string> = {
  tickets: 'Tickets',
  verification: 'Verification',
  suggestions: 'Suggestions',
  applications: 'Applications',
  giveaways: 'Giveaways',
  'dev-logs': 'Dev Logs',
  economy: 'Economy',
  'voice-channels': 'Voice Channels',
  'ai-chat': 'AI Chat',
  announcements: 'Announcement System',
};
