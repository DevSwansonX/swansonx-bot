import { EmbedBuilder, Colors } from 'discord.js';
import type { EmbedSpec } from '../types/template.js';

export const BRAND_COLOR = 0x5865f2;

export function buildEmbed(spec: EmbedSpec): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(spec.title)
    .setDescription(spec.description)
    .setColor(spec.color ?? BRAND_COLOR)
    .setTimestamp(new Date());

  if (spec.fields?.length) {
    embed.addFields(spec.fields.map((f) => ({ name: f.name, value: f.value, inline: f.inline ?? false })));
  }
  if (spec.footer) {
    embed.setFooter({ text: spec.footer });
  }
  return embed;
}

export function infoEmbed(title: string, description: string): EmbedBuilder {
  return new EmbedBuilder().setTitle(title).setDescription(description).setColor(Colors.Blurple);
}

export function successEmbed(title: string, description: string): EmbedBuilder {
  return new EmbedBuilder().setTitle(`✅ ${title}`).setDescription(description).setColor(Colors.Green);
}

export function errorEmbed(title: string, description: string): EmbedBuilder {
  return new EmbedBuilder().setTitle(`⚠️ ${title}`).setDescription(description).setColor(Colors.Red);
}
