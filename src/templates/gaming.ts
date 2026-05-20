import type { ServerTemplate } from '../types/template.js';

export const gamingTemplate: ServerTemplate = {
  id: 'gaming',
  name: 'Gaming Lounge',
  description: 'A multi-game community server for squads, scrims, and tournaments.',
  roles: [
    { name: 'Owner', color: '#FF4D4D', hoist: true, permissions: ['Administrator'] },
    { name: 'Admin', color: '#E67E22', hoist: true, permissions: ['ManageGuild', 'ManageChannels'] },
    { name: 'Moderator', color: '#3BA55D', hoist: true, permissions: ['KickMembers', 'ManageMessages'] },
    { name: 'Event Host', color: '#9B59B6', hoist: true },
    { name: 'Streamer', color: '#E91E63', hoist: true },
    { name: 'Member', color: '#7289DA' },
    { name: 'Guest', color: '#99AAB5' },
  ],
  categories: [
    {
      name: '🎮 Lobby',
      channels: [
        { name: 'welcome', kind: 'text' },
        { name: 'rules', kind: 'text' },
        { name: 'announcements', kind: 'announcement' },
        { name: 'lfg', kind: 'text', topic: 'Looking for group / squad.' },
      ],
    },
    {
      name: '🕹️ Games',
      channels: [
        { name: 'general', kind: 'text' },
        { name: 'fps', kind: 'text', topic: 'Shooters and tac-shooters.' },
        { name: 'mmos-rpgs', kind: 'text' },
        { name: 'indie-games', kind: 'text' },
        { name: 'clips-and-plays', kind: 'text', topic: 'Drop your best clips.' },
      ],
    },
    {
      name: '🏆 Competitive',
      channels: [
        { name: 'tournaments', kind: 'announcement' },
        { name: 'scrims', kind: 'text' },
        { name: 'team-finder', kind: 'text' },
      ],
    },
    {
      name: '🔊 Voice',
      channels: [
        { name: 'Squad 1', kind: 'voice' },
        { name: 'Squad 2', kind: 'voice' },
        { name: 'Squad 3', kind: 'voice' },
        { name: 'Streaming', kind: 'stage' },
        { name: 'AFK', kind: 'voice' },
      ],
    },
    {
      name: '🛡️ Staff',
      visibleTo: ['Owner', 'Admin', 'Moderator'],
      channels: [
        { name: 'staff-chat', kind: 'text' },
        { name: 'mod-logs', kind: 'text' },
      ],
    },
  ],
  onboarding: {
    channel: 'welcome',
    welcome: {
      title: '🎮 Welcome to the Lounge',
      description: 'Grab roles, find a squad in #lfg, and hop into voice.',
      fields: [
        { name: 'Find players', value: '#lfg and #team-finder.' },
        { name: 'Compete', value: '#tournaments and #scrims.' },
        { name: 'Share', value: '#clips-and-plays.' },
      ],
    },
    rules: {
      title: '📜 House Rules',
      description: 'GG, no toxicity.',
      fields: [
        { name: '1. No toxicity', value: 'No slurs, no flaming.' },
        { name: '2. No cheating', value: 'Hackers get banned.' },
        { name: '3. No spam', value: 'Don\'t flood chat or VC.' },
        { name: '4. Respect mods', value: 'Their word is final.' },
      ],
    },
  },
};
