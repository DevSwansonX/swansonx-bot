"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listTemplates = listTemplates;
exports.getTemplate = getTemplate;
exports.registerTemplate = registerTemplate;
const minecraft_js_1 = require("./minecraft.js");
const ai_community_js_1 = require("./ai-community.js");
const startup_js_1 = require("./startup.js");
const ALL = [minecraft_js_1.minecraftTemplate, ai_community_js_1.aiCommunityTemplate, startup_js_1.startupTemplate];
const REGISTRY = new Map(ALL.map((t) => [t.id, t]));
function listTemplates() {
    return [...REGISTRY.values()];
}
function getTemplate(id) {
    return REGISTRY.get(id);
}
/**
 * Register a runtime-generated template (e.g. an AI-generated one).
 * Returns the registered template.
 */
function registerTemplate(template) {
    REGISTRY.set(template.id, template);
    return template;
}
//# sourceMappingURL=index.js.map