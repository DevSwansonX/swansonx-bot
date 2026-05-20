"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.templateService = void 0;
const index_js_1 = require("../templates/index.js");
/**
 * Service surface for retrieving templates. Future work: this is the seam where
 * an AI-generated template (e.g. via Claude) can be slotted in.
 */
exports.templateService = {
    list: index_js_1.listTemplates,
    get: index_js_1.getTemplate,
    register: index_js_1.registerTemplate,
    /**
     * Placeholder for an AI-generated template flow. The real implementation
     * would call a model with the user's answers and parse the result into a
     * ServerTemplate. For now it picks the closest preset.
     */
    async generateFromAnswers(answers) {
        const haystack = `${answers.topic} ${answers.audience ?? ''} ${answers.vibe ?? ''}`.toLowerCase();
        if (/mine|smp|realm|craft/.test(haystack))
            return mustGet('minecraft');
        if (/startup|saas|founder|product/.test(haystack))
            return mustGet('startup');
        return mustGet('ai-community');
    },
};
function mustGet(id) {
    const t = (0, index_js_1.getTemplate)(id);
    if (!t)
        throw new Error(`Template "${id}" not registered`);
    return t;
}
//# sourceMappingURL=templateService.js.map