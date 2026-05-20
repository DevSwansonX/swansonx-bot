"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvePermissions = resolvePermissions;
exports.resolveColor = resolveColor;
const discord_js_1 = require("discord.js");
/**
 * Resolve a list of permission inputs (bigints or PermissionFlagsBits keys)
 * into a single permission bitfield.
 */
function resolvePermissions(input) {
    if (!input?.length)
        return 0n;
    let bits = 0n;
    for (const entry of input) {
        if (typeof entry === 'bigint') {
            bits |= entry;
            continue;
        }
        const flag = discord_js_1.PermissionFlagsBits[entry];
        if (flag)
            bits |= flag;
    }
    return bits;
}
/**
 * Convert "#hex" or numeric color hint into a Discord-compatible int.
 */
function resolveColor(color) {
    if (color === undefined)
        return undefined;
    if (typeof color === 'number')
        return color;
    const clean = color.startsWith('#') ? color.slice(1) : color;
    const parsed = parseInt(clean, 16);
    return Number.isNaN(parsed) ? undefined : parsed;
}
//# sourceMappingURL=permissions.js.map