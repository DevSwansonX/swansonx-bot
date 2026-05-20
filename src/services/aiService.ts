import type { ServerTemplate } from '../types/template.js';
import type { SetupAnswers, ServerType, Vibe } from '../types/setup.js';
import { getTemplate } from '../templates/index.js';
import { applySystems } from './systemsService.js';

/**
 * AI generation layer.
 *
 * Today this is a deterministic, structured generator that combines:
 *   1. A base template chosen by ServerType
 *   2. A vibe modifier (colors, naming style)
 *   3. System overlays (tickets, verification, …)
 *
 * It is the seam where a real LLM call (Claude / OpenAI / etc.) can be
 * dropped in: replace `generateBaseTemplate` with a model call that returns
 * the same ServerTemplate shape, and the rest of the pipeline keeps working.
 */

const TYPE_TO_TEMPLATE: Record<ServerType, string> = {
  minecraft: 'minecraft',
  'ai-community': 'ai-community',
  startup: 'startup',
  creator: 'creator',
  business: 'business',
  gaming: 'gaming',
  support: 'support',
};

const VIBE_COLORS: Record<Vibe, number> = {
  minimal: 0xeeeeee,
  professional: 0x2c3e50,
  cyberpunk: 0xff00aa,
  dark: 0x1a1a1d,
  gaming: 0xff4d4d,
  startup: 0x6c5ce7,
};

function mustGet(id: string): ServerTemplate {
  const t = getTemplate(id);
  if (!t) throw new Error(`Template "${id}" not registered`);
  return t;
}

function applyVibe(template: ServerTemplate, vibe: Vibe): ServerTemplate {
  const tint = VIBE_COLORS[vibe];
  return {
    ...template,
    onboarding: template.onboarding
      ? {
          ...template.onboarding,
          welcome: { ...template.onboarding.welcome, color: tint },
          rules: template.onboarding.rules
            ? { ...template.onboarding.rules, color: tint }
            : undefined,
        }
      : undefined,
  };
}

export interface GenerationResult {
  template: ServerTemplate;
  source: 'preset+overlay' | 'llm';
  notes: string[];
}

export const aiService = {
  /**
   * Build a ServerTemplate from interactive answers.
   */
  generate(answers: SetupAnswers): GenerationResult {
    const baseId = TYPE_TO_TEMPLATE[answers.type];
    const base = mustGet(baseId);

    const vibed = applyVibe(base, answers.vibe);
    const overlaid = applySystems(vibed, answers.systems);

    const generated: ServerTemplate = {
      ...overlaid,
      id: `${base.id}-ai-${Date.now()}`,
      name: `${base.name} (AI · ${answers.vibe})`,
      description:
        answers.description ||
        `${base.description} Generated with vibe "${answers.vibe}" and ${answers.systems.length} system(s).`,
    };

    return {
      template: generated,
      source: 'preset+overlay',
      notes: [
        `Base template: ${base.id}`,
        `Vibe: ${answers.vibe}`,
        `Systems: ${answers.systems.length > 0 ? answers.systems.join(', ') : 'none'}`,
      ],
    };
  },
};
