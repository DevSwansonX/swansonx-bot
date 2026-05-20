import type { ServerTemplate } from '../types/template.js';

export const businessTemplate: ServerTemplate = {
  id: 'business',
  name: 'Business HQ',
  description: 'A professional Discord HQ for an established business, agency, or consultancy.',
  roles: [
    { name: 'CEO', color: '#FF4D4D', hoist: true, permissions: ['Administrator'] },
    { name: 'Leadership', color: '#8E44AD', hoist: true, permissions: ['ManageGuild', 'ManageChannels', 'ManageRoles'] },
    { name: 'Operations', color: '#3498DB', hoist: true, permissions: ['ManageMessages'] },
    { name: 'Team', color: '#1ABC9C', hoist: true },
    { name: 'Client', color: '#F39C12' },
    { name: 'Partner', color: '#2ECC71' },
    { name: 'Guest', color: '#95A5A6' },
  ],
  categories: [
    {
      name: '🏢 Company',
      channels: [
        { name: 'welcome', kind: 'text', topic: 'Start here.' },
        { name: 'announcements', kind: 'announcement', topic: 'Official company updates.' },
        { name: 'rules', kind: 'text', topic: 'Code of conduct.' },
      ],
    },
    {
      name: '💼 Operations',
      visibleTo: ['CEO', 'Leadership', 'Operations', 'Team'],
      channels: [
        { name: 'general', kind: 'text' },
        { name: 'projects', kind: 'text' },
        { name: 'meetings', kind: 'text' },
        { name: 'standups', kind: 'text' },
      ],
    },
    {
      name: '🤝 Clients',
      visibleTo: ['CEO', 'Leadership', 'Operations', 'Team', 'Client'],
      channels: [
        { name: 'client-lounge', kind: 'text', topic: 'Open conversation with clients.' },
        { name: 'requests', kind: 'text', topic: 'Submit work requests.' },
        { name: 'deliverables', kind: 'text', topic: 'Final deliverables and approvals.' },
      ],
    },
    {
      name: '🛡️ Leadership',
      visibleTo: ['CEO', 'Leadership'],
      channels: [
        { name: 'strategy', kind: 'text' },
        { name: 'finance', kind: 'text' },
        { name: 'hr', kind: 'text' },
      ],
    },
    {
      name: '🔊 Voice',
      channels: [
        { name: 'Boardroom', kind: 'voice' },
        { name: 'Huddle', kind: 'voice' },
        { name: 'Client Calls', kind: 'voice' },
      ],
    },
  ],
  onboarding: {
    channel: 'welcome',
    welcome: {
      title: '🏢 Welcome to the Company',
      description: 'You are now connected to our internal-meets-client operations hub.',
      fields: [
        { name: 'Team members', value: 'Start in #general and #projects.' },
        { name: 'Clients', value: 'Use #client-lounge and #requests.' },
        { name: 'Need help?', value: 'Ping anyone in Operations.' },
      ],
    },
    rules: {
      title: '📜 Code of Conduct',
      description: 'Professionalism, discretion, accountability.',
      fields: [
        { name: '1. Confidentiality', value: 'No external sharing of internal channels.' },
        { name: '2. Respect', value: 'Treat teammates and clients with respect.' },
        { name: '3. Stay on-topic', value: 'Use the correct channel.' },
        { name: '4. Escalate', value: 'Flag issues to Operations early.' },
      ],
    },
  },
};
