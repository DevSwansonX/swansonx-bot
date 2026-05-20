import type { Client, ClientEvents } from 'discord.js';
import type { BotEvent } from '../types/template.js';
import { readyEvent } from '../events/ready.js';
import { interactionCreateEvent } from '../events/interactionCreate.js';
import { logger } from '../utils/logger.js';

const ALL_EVENTS: BotEvent<keyof ClientEvents>[] = [
  readyEvent as BotEvent<keyof ClientEvents>,
  interactionCreateEvent as BotEvent<keyof ClientEvents>,
];

export function loadEvents(client: Client): void {
  for (const evt of ALL_EVENTS) {
    if (evt.once) {
      client.once(evt.name, (...args) => Promise.resolve(evt.execute(...args)).catch((err) => logger.error(`Event ${evt.name} threw`, err)));
    } else {
      client.on(evt.name, (...args) => Promise.resolve(evt.execute(...args)).catch((err) => logger.error(`Event ${evt.name} threw`, err)));
    }
    logger.debug(`Bound event: ${String(evt.name)}`);
  }
  logger.info(`Bound ${ALL_EVENTS.length} events`);
}
