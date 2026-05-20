import { EmbedBuilder } from 'discord.js';
import type { EmbedSpec } from '../types/template.js';
import { BRAND } from './branding.js';

export const BRAND_COLOR = BRAND.colors.primary;

function base(): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(BRAND.colors.primary)
    .setTimestamp(new Date())
    .setFooter({ text: BRAND.footer });
}

export function buildEmbed(spec: EmbedSpec): EmbedBuilder {
  const embed = base()
    .setTitle(spec.title)
    .setDescription(spec.description)
    .setColor(spec.color ?? BRAND.colors.primary);

  if (spec.fields?.length) {
    embed.addFields(
      spec.fields.map((f) => ({ name: f.name, value: f.value, inline: f.inline ?? false })),
    );
  }
  if (spec.footer) {
    embed.setFooter({ text: spec.footer });
  }
  return embed;
}

export function brandEmbed(title: string, description: string): EmbedBuilder {
  return base()
    .setTitle(`${BRAND.emoji.spark} ${title}`)
    .setDescription(description)
    .setColor(BRAND.colors.primary);
}

export function infoEmbed(title: string, description: string): EmbedBuilder {
  return base().setTitle(title).setDescription(description).setColor(BRAND.colors.info);
}

export function successEmbed(title: string, description: string): EmbedBuilder {
  return base()
    .setTitle(`✅ ${title}`)
    .setDescription(description)
    .setColor(BRAND.colors.success);
}

export function warningEmbed(title: string, description: string): EmbedBuilder {
  return base()
    .setTitle(`⚠️ ${title}`)
    .setDescription(description)
    .setColor(BRAND.colors.warning);
}

export function errorEmbed(title: string, description: string): EmbedBuilder {
  return base()
    .setTitle(`⛔ ${title}`)
    .setDescription(description)
    .setColor(BRAND.colors.danger);
}

export function dangerEmbed(title: string, description: string): EmbedBuilder {
  return base()
    .setTitle(`${BRAND.emoji.danger} ${title}`)
    .setDescription(description)
    .setColor(BRAND.colors.danger);
}

export function progressEmbed(title: string, description: string): EmbedBuilder {
  return base()
    .setTitle(`${BRAND.emoji.cog} ${title}`)
    .setDescription(description)
    .setColor(BRAND.colors.accent);
}
