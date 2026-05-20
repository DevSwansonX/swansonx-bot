import type { ServerTemplate } from '../types/template.js';

export const creatorTemplate: ServerTemplate = {
  id: 'creator',
  name: 'Creator HQ',
  description: 'A community server for a content creator, streamer, or artist.',
  roles: [
    { name: 'Creator', color: '#FF4D9D', hoist: true, permissions: ['Administrator'] },
    { name: 'Editor', color: '#9B59B6', hoist: true, permissions: ['ManageMessages'] },
    { name: 'Moderator', color: '#3BA55D', hoist: true, permissions: ['KickMembers', 'ManageMessages'] },
    { name: 'Subscriber', color: '#F1C40F', hoist: true },
    { name: 'Member', color: '#7289DA' },
  ],
  categories: [
    {
      name: '🌟 Start Here',
      channels: [
        { name: 'welcome', kind: 'text' },
        { name: 'rules', kind: 'text' },
        { name: 'announcements', kind: 'announcement' },
        { name: 'links', kind: 'text', topic: 'All my socials and platforms.' },
      ],
    },
    {
      name: '💬 Community',
      channels: [
        { name: 'general', kind: 'text' },
        { name: 'memes', kind: 'text' },
        { name: 'fanart', kind: 'text', topic: 'Share fanart and creations.' },
        { name: 'suggestions', kind: 'text', topic: 'Suggest content ideas.' },
      ],
    },
    {
      name: '🎥 Content',
      channels: [
        { name: 'latest-upload', kind: 'announcement' },
        { name: 'live-now', kind: 'announcement' },
        { name: 'behind-the-scenes', kind: 'text', visibleTo: ['Creator', 'Editor', 'Subscriber'] },
      ],
    },
    {
      name: '⭐ Subscribers',
      visibleTo: ['Creator', 'Editor', 'Moderator', 'Subscriber'],
      channels: [
        { name: 'subs-only', kind: 'text' },
        { name: 'sub-vc', kind: 'voice' },
      ],
    },
    {
      name: '🔊 Voice',
      channels: [
        { name: 'Hangout', kind: 'voice' },
        { name: 'Watch Party', kind: 'voice' },
      ],
    },
    {
      name: '🛡️ Staff',
      visibleTo: ['Creator', 'Editor', 'Moderator'],
      channels: [
        { name: 'staff-chat', kind: 'text' },
        { name: 'mod-logs', kind: 'text' },
      ],
    },
  ],
  onboarding: {
    channel: 'welcome',
    welcome: {
      title: '🌟 Welcome to the Community',
      description: 'Thanks for being here — say hi, share what you love, and stick around.',
      fields: [
        { name: 'Get the latest', value: '#announcements and #latest-upload.' },
        { name: 'Hang out', value: '#general, #memes, voice channels.' },
        { name: 'Support', value: 'Subscribe to unlock #subs-only.' },
      ],
    },
    rules: {
      title: '📜 Community Rules',
      description: 'Keep it kind and creative.',
      fields: [
        { name: '1. Be kind', value: 'No harassment or hate.' },
        { name: '2. Credit creators', value: 'Don\'t repost art without credit.' },
        { name: '3. No spam', value: 'No self-promo dumping.' },
        { name: '4. Respect mods', value: 'They volunteer their time.' },
      ],
    },
  },
};
