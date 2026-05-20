"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BRAND_COLOR = void 0;
exports.buildEmbed = buildEmbed;
exports.infoEmbed = infoEmbed;
exports.successEmbed = successEmbed;
exports.errorEmbed = errorEmbed;
const discord_js_1 = require("discord.js");
exports.BRAND_COLOR = 0x5865f2;
function buildEmbed(spec) {
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle(spec.title)
        .setDescription(spec.description)
        .setColor(spec.color ?? exports.BRAND_COLOR)
        .setTimestamp(new Date());
    if (spec.fields?.length) {
        embed.addFields(spec.fields.map((f) => ({ name: f.name, value: f.value, inline: f.inline ?? false })));
    }
    if (spec.footer) {
        embed.setFooter({ text: spec.footer });
    }
    return embed;
}
function infoEmbed(title, description) {
    return new discord_js_1.EmbedBuilder().setTitle(title).setDescription(description).setColor(discord_js_1.Colors.Blurple);
}
function successEmbed(title, description) {
    return new discord_js_1.EmbedBuilder().setTitle(`✅ ${title}`).setDescription(description).setColor(discord_js_1.Colors.Green);
}
function errorEmbed(title, description) {
    return new discord_js_1.EmbedBuilder().setTitle(`⚠️ ${title}`).setDescription(description).setColor(discord_js_1.Colors.Red);
}
//# sourceMappingURL=embeds.js.map