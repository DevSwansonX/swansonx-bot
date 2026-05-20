import type { ServerTemplate } from '../types/template.js';
import { minecraftTemplate } from './minecraft.js';
import { aiCommunityTemplate } from './ai-community.js';
import { startupTemplate } from './startup.js';
import { businessTemplate } from './business.js';
import { supportTemplate } from './support.js';
import { gamingTemplate } from './gaming.js';
import { creatorTemplate } from './creator.js';

const ALL: ServerTemplate[] = [
  minecraftTemplate,
  aiCommunityTemplate,
  startupTemplate,
  businessTemplate,
  supportTemplate,
  gamingTemplate,
  creatorTemplate,
];

const REGISTRY: Map<string, ServerTemplate> = new Map(ALL.map((t) => [t.id, t]));

export function listTemplates(): ServerTemplate[] {
  return [...REGISTRY.values()];
}

export function getTemplate(id: string): ServerTemplate | undefined {
  return REGISTRY.get(id);
}

/**
 * Register a runtime-generated template (e.g. an AI-generated one).
 * Returns the registered template.
 */
export function registerTemplate(template: ServerTemplate): ServerTemplate {
  REGISTRY.set(template.id, template);
  return template;
}
