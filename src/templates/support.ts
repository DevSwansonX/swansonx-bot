import type { ServerTemplate } from '../types/template.js';

export const supportTemplate: ServerTemplate = {
  id: 'support',
  name: 'Support Hub',
  description: 'A customer-support focused server with ticket flow, FAQs, and a knowledge base.',
  roles: [
    { name: 'Owner', color: '#FF4D4D', hoist: true, permissions: ['Administrator'] },
    { name: 'Support Lead', color: '#E67E22', hoist: true, permissions: ['ManageChannels', 'ManageMessages'] },
    { name: 'Support Agent', color: '#3498DB', hoist: true, permissions: ['ManageMessages'] },
    { name: 'Verified Customer', color: '#2ECC71' },
    { name: 'Member', color: '#95A5A6' },
  ],
  categories: [
    {
      name: '🚪 Start Here',
      channels: [
        { name: 'welcome', kind: 'text' },
        { name: 'rules', kind: 'text' },
        { name: 'status', kind: 'announcement', topic: 'Live service and incident status.' },
      ],
    },
    {
      name: '📚 Knowledge Base',
      channels: [
        { name: 'faq', kind: 'text', topic: 'Frequently asked questions.' },
        { name: 'guides', kind: 'forum', topic: 'How-to guides and tutorials.' },
        { name: 'changelog', kind: 'announcement', topic: 'Release notes.' },
      ],
    },
    {
      name: '🎫 Support',
      channels: [
        { name: 'open-ticket', kind: 'text', topic: 'Click the button below to open a support ticket.' },
        { name: 'general-help', kind: 'text', topic: 'Quick questions that don\'t need a private ticket.' },
        { name: 'feature-requests', kind: 'text', topic: 'Suggest a feature.' },
        { name: 'bug-reports', kind: 'text', topic: 'Report a bug.' },
      ],
    },
    {
      name: '🛡️ Staff',
      visibleTo: ['Owner', 'Support Lead', 'Support Agent'],
      channels: [
        { name: 'staff-chat', kind: 'text' },
        { name: 'ticket-logs', kind: 'text' },
        { name: 'escalations', kind: 'text' },
      ],
    },
  ],
  onboarding: {
    channel: 'welcome',
    welcome: {
      title: '🎧 Welcome to Support',
      description: 'We\'re here to help. Open a ticket, browse the FAQ, or check the status channel.',
      fields: [
        { name: 'Need help fast?', value: 'Open a ticket in #open-ticket.' },
        { name: 'Have a question?', value: 'Check #faq first.' },
        { name: 'Found a bug?', value: 'Post in #bug-reports.' },
      ],
    },
    rules: {
      title: '📜 Support Rules',
      description: 'Keep it clean so we can help you faster.',
      fields: [
        { name: '1. One ticket per issue', value: 'Don\'t open duplicates.' },
        { name: '2. No DMs to staff', value: 'Use tickets — staff rotate shifts.' },
        { name: '3. Be specific', value: 'Include error messages and steps to reproduce.' },
        { name: '4. Respect agents', value: 'They\'re here to help.' },
      ],
    },
  },
};
