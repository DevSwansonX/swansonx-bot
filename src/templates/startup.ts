import type { ServerTemplate } from '../types/template.js';

export const startupTemplate: ServerTemplate = {
  id: 'startup',
  name: 'Startup HQ',
  description: 'Internal-style Discord for an early-stage startup or small team.',
  roles: [
    { name: 'Founder', color: '#FF4D4D', hoist: true, permissions: ['Administrator'] },
    { name: 'Team', color: '#5865F2', hoist: true, permissions: ['ManageMessages'] },
    { name: 'Advisor', color: '#FAA61A', hoist: true },
    { name: 'Investor', color: '#1F8B4C', hoist: true },
    { name: 'Customer', color: '#3498DB' },
    { name: 'Guest', color: '#99AAB5' },
  ],
  categories: [
    {
      name: '📣 Public',
      channels: [
        { name: 'welcome', kind: 'text' },
        { name: 'changelog', kind: 'announcement', topic: 'Product updates and shipped features.' },
        { name: 'community', kind: 'text', topic: 'General chat for users and supporters.' },
        { name: 'support', kind: 'text', topic: 'Customer questions and bug reports.' },
      ],
    },
    {
      name: '🏗️ Product',
      visibleTo: ['Founder', 'Team', 'Advisor'],
      channels: [
        { name: 'eng', kind: 'text', topic: 'Engineering discussion.' },
        { name: 'design', kind: 'text', topic: 'Design and UX.' },
        { name: 'launches', kind: 'text', topic: 'Launch planning and post-mortems.' },
        { name: 'incidents', kind: 'text', topic: 'Production incidents and on-call.' },
      ],
    },
    {
      name: '📈 Business',
      visibleTo: ['Founder', 'Team', 'Advisor', 'Investor'],
      channels: [
        { name: 'metrics', kind: 'text' },
        { name: 'gtm', kind: 'text', topic: 'Go-to-market, sales, marketing.' },
        { name: 'fundraising', kind: 'text', visibleTo: ['Founder', 'Investor'] },
      ],
    },
    {
      name: '🔊 Voice',
      channels: [
        { name: 'Standup', kind: 'voice' },
        { name: 'Pairing', kind: 'voice' },
        { name: 'All-Hands', kind: 'stage' },
      ],
    },
  ],
  onboarding: {
    channel: 'welcome',
    welcome: {
      title: '🚀 Welcome to Startup HQ',
      description: 'This is the internal-meets-community Discord. Public channels are open; team channels are gated.',
      color: 0x5865f2,
      fields: [
        { name: 'Customers', value: 'Use #support and #community.' },
        { name: 'Team', value: 'See #eng, #design, #launches.' },
        { name: 'Investors / Advisors', value: 'Check #metrics and #gtm.' },
      ],
      footer: 'Built by SwansonX',
    },
    rules: {
      title: '📜 Guidelines',
      description: 'Keep it useful and discreet.',
      color: 0xfaa61a,
      fields: [
        { name: '1. Respect confidentiality', value: 'No leaking roadmap, metrics, or fundraising details.' },
        { name: '2. Be direct', value: 'Short, clear messages beat long monologues.' },
        { name: '3. Use the right channel', value: 'Channel topics are the source of truth.' },
        { name: '4. Be kind to customers', value: 'They\'re the reason we\'re here.' },
      ],
    },
  },
};
