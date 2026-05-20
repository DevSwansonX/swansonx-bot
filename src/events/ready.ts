import { Events, type Client } from 'discord.js';
import type { BotEvent } from '../types/template.js';
import { logger } from '../utils/logger.js';

export const readyEvent: BotEvent<Events.ClientReady> = {
  name: Events.ClientReady,
  once: true,
  execute(client: Client<true>) {
    logger.info(`SwansonX online as ${client.user.tag} — serving ${client.guilds.cache.size} guild(s)`);
  },
};
