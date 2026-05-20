import { REST, Routes } from 'discord.js';
import { config } from '../config/config.js';
import { getCommandJSON } from '../handlers/commandHandler.js';
import { logger } from '../utils/logger.js';

async function main(): Promise<void> {
  const rest = new REST({ version: '10' }).setToken(config.token);
  const body = getCommandJSON();

  if (config.guildId) {
    logger.info(`Registering ${body.length} guild commands for ${config.guildId}…`);
    await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), { body });
    logger.info('Guild commands registered.');
  } else {
    logger.info(`Registering ${body.length} global commands…`);
    await rest.put(Routes.applicationCommands(config.clientId), { body });
    logger.info('Global commands registered (may take up to an hour to propagate).');
  }
}

main().catch((err) => {
  logger.error('Command registration failed', err);
  process.exit(1);
});
