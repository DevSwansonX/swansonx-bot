import 'dotenv/config';

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function optional(name: string, fallback = ''): string {
  return process.env[name]?.trim() || fallback;
}

export const config = {
  token: required('DISCORD_TOKEN'),
  clientId: required('DISCORD_CLIENT_ID'),
  guildId: optional('DISCORD_GUILD_ID'),
  ownerId: optional('OWNER_ID'),
  env: optional('NODE_ENV', 'development'),
  logLevel: optional('LOG_LEVEL', 'info'),
} as const;

export type Config = typeof config;
