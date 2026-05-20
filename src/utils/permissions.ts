import { PermissionFlagsBits } from 'discord.js';

/**
 * Resolve a list of permission inputs (bigints or PermissionFlagsBits keys)
 * into a single permission bitfield.
 */
export function resolvePermissions(input?: (bigint | string)[]): bigint {
  if (!input?.length) return 0n;
  let bits = 0n;
  for (const entry of input) {
    if (typeof entry === 'bigint') {
      bits |= entry;
      continue;
    }
    const flag = (PermissionFlagsBits as Record<string, bigint>)[entry];
    if (flag) bits |= flag;
  }
  return bits;
}

/**
 * Convert "#hex" or numeric color hint into a Discord-compatible int.
 */
export function resolveColor(color: number | string | undefined): number | undefined {
  if (color === undefined) return undefined;
  if (typeof color === 'number') return color;
  const clean = color.startsWith('#') ? color.slice(1) : color;
  const parsed = parseInt(clean, 16);
  return Number.isNaN(parsed) ? undefined : parsed;
}
