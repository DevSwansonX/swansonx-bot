import type { ServerTemplate } from '../types/template.js';

export const aiCommunityTemplate: ServerTemplate = {
  id: 'ai-community',
  name: 'AI Community',
  description: 'A server for builders, researchers, and tinkerers working with LLMs and AI tooling.',
  roles: [
    { name: 'Founder', color: '#9B59B6', hoist: true, permissions: ['Administrator'] },
    { name: 'Core Team', color: '#E91E63', hoist: true, permissions: ['ManageGuild', 'ManageChannels', 'ManageRoles'] },
    { name: 'Moderator', color: '#2ECC71', hoist: true, permissions: ['KickMembers', 'ManageMessages'] },
    { name: 'Researcher', color: '#1ABC9C', hoist: true },
    { name: 'Builder', color: '#3498DB', hoist: true },
    { name: 'Member', color: '#95A5A6' },
  ],
  categories: [
    {
      name: '👋 Start Here',
      channels: [
        { name: 'welcome', kind: 'text' },
        { name: 'rules', kind: 'text' },
        { name: 'introductions', kind: 'text', topic: 'Tell us who you are and what you\'re building.' },
        { name: 'announcements', kind: 'announcement' },
      ],
    },
    {
      name: '🤖 AI Discussion',
      channels: [
        { name: 'general', kind: 'text' },
        { name: 'llms', kind: 'text', topic: 'Anthropic, OpenAI, open-weight models, etc.' },
        { name: 'prompting', kind: 'text', topic: 'Prompt engineering, evals, system prompts.' },
        { name: 'agents', kind: 'text', topic: 'Tool use, multi-agent systems, autonomous workflows.' },
        { name: 'papers', kind: 'forum', topic: 'Share and discuss research.' },
      ],
    },
    {
      name: '🛠️ Build',
      channels: [
        { name: 'show-and-tell', kind: 'text', topic: 'Demo your projects.' },
        { name: 'feedback', kind: 'text', topic: 'Ask for review and critique.' },
        { name: 'jobs-and-collab', kind: 'text' },
        { name: 'help', kind: 'text', topic: 'Ask technical questions here.' },
      ],
    },
    {
      name: '🔊 Voice',
      channels: [
        { name: 'Coworking', kind: 'voice' },
        { name: 'Office Hours', kind: 'voice' },
        { name: 'Lounge', kind: 'voice' },
      ],
    },
    {
      name: '🛡️ Staff',
      visibleTo: ['Founder', 'Core Team', 'Moderator'],
      channels: [
        { name: 'staff-chat', kind: 'text' },
        { name: 'mod-logs', kind: 'text' },
      ],
    },
  ],
  onboarding: {
    channel: 'welcome',
    welcome: {
      title: '🤖 Welcome to the AI Community',
      description: 'A home for people building with AI. Introduce yourself, share what you\'re working on, and dive in.',
      color: 0x9b59b6,
      fields: [
        { name: 'Step 1', value: 'Read #rules.' },
        { name: 'Step 2', value: 'Drop an intro in #introductions.' },
        { name: 'Step 3', value: 'Share a project in #show-and-tell or ask in #help.' },
      ],
      footer: 'Built by SwansonX',
    },
    rules: {
      title: '📜 Community Rules',
      description: 'Be useful. Be respectful. Build cool things.',
      color: 0xe91e63,
      fields: [
        { name: '1. No spam or self-promo dumping', value: 'Share work in #show-and-tell, not every channel.' },
        { name: '2. No hate speech', value: 'Zero tolerance.' },
        { name: '3. Respect IP and confidentiality', value: 'Don\'t leak private prompts, datasets, or model weights.' },
        { name: '4. Stay on-topic per channel', value: 'Channel topics are the source of truth.' },
        { name: '5. Don\'t farm engagement', value: 'No vague "DM me" recruitment.' },
      ],
    },
  },
};
