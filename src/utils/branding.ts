/**
 * SwansonX brand surface — colors, footer text, asset references.
 * Centralized so the entire bot speaks with one voice.
 */
export const BRAND = {
  name: 'SwansonX',
  tagline: 'AI-powered Discord infrastructure',
  footer: 'SwansonX · AI Discord Infrastructure',

  colors: {
    primary: 0x6c5ce7,
    accent: 0x00d4ff,
    success: 0x2ecc71,
    warning: 0xf1c40f,
    danger: 0xe74c3c,
    neutral: 0x2f3136,
    info: 0x5865f2,
  },

  emoji: {
    spark: '✨',
    bolt: '⚡',
    shield: '🛡️',
    danger: '☢️',
    cog: '⚙️',
    rocket: '🚀',
    broom: '🧹',
    fire: '🔥',
    sparkles: '✦',
    chip: '◆',
  },
} as const;
