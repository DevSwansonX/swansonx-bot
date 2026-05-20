"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BRAND_COLOR = void 0;
exports.buildEmbed = buildEmbed;
exports.brandEmbed = brandEmbed;
exports.infoEmbed = infoEmbed;
exports.successEmbed = successEmbed;
exports.warningEmbed = warningEmbed;
exports.errorEmbed = errorEmbed;
exports.dangerEmbed = dangerEmbed;
exports.progressEmbed = progressEmbed;
const discord_js_1 = require("discord.js");
const branding_js_1 = require("./branding.js");
exports.BRAND_COLOR = branding_js_1.BRAND.colors.primary;
function base() {
    return new discord_js_1.EmbedBuilder()
        .setColor(branding_js_1.BRAND.colors.primary)
        .setTimestamp(new Date())
        .setFooter({ text: branding_js_1.BRAND.footer });
}
function buildEmbed(spec) {
    const embed = base()
        .setTitle(spec.title)
        .setDescription(spec.description)
        .setColor(spec.color ?? branding_js_1.BRAND.colors.primary);
    if (spec.fields?.length) {
        embed.addFields(spec.fields.map((f) => ({ name: f.name, value: f.value, inline: f.inline ?? false })));
    }
    if (spec.footer) {
        embed.setFooter({ text: spec.footer });
    }
    return embed;
}
function brandEmbed(title, description) {
    return base()
        .setTitle(`${branding_js_1.BRAND.emoji.spark} ${title}`)
        .setDescription(description)
        .setColor(branding_js_1.BRAND.colors.primary);
}
function infoEmbed(title, description) {
    return base().setTitle(title).setDescription(description).setColor(branding_js_1.BRAND.colors.info);
}
function successEmbed(title, description) {
    return base()
        .setTitle(`✅ ${title}`)
        .setDescription(description)
        .setColor(branding_js_1.BRAND.colors.success);
}
function warningEmbed(title, description) {
    return base()
        .setTitle(`⚠️ ${title}`)
        .setDescription(description)
        .setColor(branding_js_1.BRAND.colors.warning);
}
function errorEmbed(title, description) {
    return base()
        .setTitle(`⛔ ${title}`)
        .setDescription(description)
        .setColor(branding_js_1.BRAND.colors.danger);
}
function dangerEmbed(title, description) {
    return base()
        .setTitle(`${branding_js_1.BRAND.emoji.danger} ${title}`)
        .setDescription(description)
        .setColor(branding_js_1.BRAND.colors.danger);
}
function progressEmbed(title, description) {
    return base()
        .setTitle(`${branding_js_1.BRAND.emoji.cog} ${title}`)
        .setDescription(description)
        .setColor(branding_js_1.BRAND.colors.accent);
}
//# sourceMappingURL=embeds.js.map