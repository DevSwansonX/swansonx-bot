import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { config } from './config/config.js';
import { loadCommands } from './handlers/commandHandler.js';
import { loadEvents } from './handlers/eventHandler.js';
import { logger } from './utils/logger.js';

async function main(): Promise<void> {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
    ],
    partials: [Partials.Channel],
  });

  loadCommands(client);
  loadEvents(client);

  process.on('unhandledRejection', (err) => logger.error('Unhandled rejection', err));
  process.on('uncaughtException', (err) => logger.error('Uncaught exception', err));
  const shutdown = (signal: NodeJS.Signals) => {
    logger.info(`Received ${signal} — shutting down`);
    client.destroy().finally(() => process.exit(0));
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  logger.info(`Starting SwansonX in ${config.env} mode`);
  await client.login(config.token);
}

main().catch((err) => {
  logger.error('Fatal startup error', err);
  process.exit(1);
});
