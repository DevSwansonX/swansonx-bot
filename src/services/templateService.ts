import type { ServerTemplate } from '../types/template.js';
import { getTemplate, listTemplates, registerTemplate } from '../templates/index.js';

/**
 * Service surface for retrieving templates. Future work: this is the seam where
 * an AI-generated template (e.g. via Claude) can be slotted in.
 */
export const templateService = {
  list: listTemplates,
  get: getTemplate,
  register: registerTemplate,

  /**
   * Placeholder for an AI-generated template flow. The real implementation
   * would call a model with the user's answers and parse the result into a
   * ServerTemplate. For now it picks the closest preset.
   */
  async generateFromAnswers(answers: {
    topic: string;
    audience?: string;
    vibe?: string;
  }): Promise<ServerTemplate> {
    const haystack = `${answers.topic} ${answers.audience ?? ''} ${answers.vibe ?? ''}`.toLowerCase();
    if (/mine|smp|realm|craft/.test(haystack)) return mustGet('minecraft');
    if (/startup|saas|founder|product/.test(haystack)) return mustGet('startup');
    return mustGet('ai-community');
  },
};

function mustGet(id: string): ServerTemplate {
  const t = getTemplate(id);
  if (!t) throw new Error(`Template "${id}" not registered`);
  return t;
}
