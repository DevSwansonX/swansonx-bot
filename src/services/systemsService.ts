import type {
  CategorySpec,
  ChannelSpec,
  RoleSpec,
  ServerTemplate,
} from '../types/template.js';
import type { SystemKind } from '../types/setup.js';

/**
 * Each system is a structured overlay that adds roles, channels, categories,
 * and pinned embeds to a base ServerTemplate. Overlays are pure functions —
 * they return a new template rather than mutating the input.
 */

type Overlay = (template: ServerTemplate) => ServerTemplate;

function mergeUnique<T>(existing: T[], incoming: T[], key: (t: T) => string): T[] {
  const seen = new Set(existing.map(key));
  const out = [...existing];
  for (const item of incoming) {
    if (!seen.has(key(item))) {
      out.push(item);
      seen.add(key(item));
    }
  }
  return out;
}

function withRoles(template: ServerTemplate, roles: RoleSpec[]): ServerTemplate {
  return { ...template, roles: mergeUnique(template.roles, roles, (r) => r.name.toLowerCase()) };
}

function withCategory(template: ServerTemplate, cat: CategorySpec): ServerTemplate {
  const existingIdx = template.categories.findIndex((c) => c.name === cat.name);
  if (existingIdx >= 0) {
    const merged: CategorySpec = {
      ...template.categories[existingIdx]!,
      channels: mergeUnique(
        template.categories[existingIdx]!.channels,
        cat.channels,
        (c) => c.name.toLowerCase(),
      ),
    };
    const categories = [...template.categories];
    categories[existingIdx] = merged;
    return { ...template, categories };
  }
  return { ...template, categories: [...template.categories, cat] };
}

function withChannel(
  template: ServerTemplate,
  categoryName: string,
  channel: ChannelSpec,
): ServerTemplate {
  const idx = template.categories.findIndex((c) => c.name === categoryName);
  if (idx < 0) {
    return withCategory(template, { name: categoryName, channels: [channel] });
  }
  const cat = template.categories[idx]!;
  if (cat.channels.some((c) => c.name === channel.name)) return template;
  const updated: CategorySpec = { ...cat, channels: [...cat.channels, channel] };
  const categories = [...template.categories];
  categories[idx] = updated;
  return { ...template, categories };
}

const OVERLAYS: Record<SystemKind, Overlay> = {
  tickets: (t) =>
    withCategory(
      withRoles(t, [
        { name: 'Support Team', color: '#3498DB', hoist: true, permissions: ['ManageMessages'] },
      ]),
      {
        name: '🎫 Tickets',
        visibleTo: undefined,
        channels: [
          {
            name: 'open-ticket',
            kind: 'text',
            topic: 'Open a private support ticket here.',
            embeds: [
              {
                title: '🎫 Need help?',
                description:
                  'Open a support ticket and a member of the Support Team will respond. Provide as much detail as possible.',
              },
            ],
          },
          {
            name: 'ticket-logs',
            kind: 'text',
            topic: 'Closed-ticket transcripts.',
            visibleTo: ['Support Team'],
          },
        ],
      },
    ),

  verification: (t) =>
    withCategory(
      withRoles(t, [
        { name: 'Unverified', color: '#95A5A6' },
        { name: 'Verified', color: '#2ECC71', hoist: true },
      ]),
      {
        name: '🛂 Verification',
        channels: [
          {
            name: 'verify',
            kind: 'text',
            topic: 'Verify yourself to unlock the rest of the server.',
            embeds: [
              {
                title: '🛂 Verification Required',
                description:
                  'Click the **Verify** button to gain access. This keeps the server safe from raids and bots.',
              },
            ],
          },
        ],
      },
    ),

  suggestions: (t) =>
    withChannel(t, '💬 Community', {
      name: 'suggestions',
      kind: 'text',
      topic: 'Suggest features or ideas — vote with reactions.',
      embeds: [
        {
          title: '💡 Suggestions',
          description: 'Post your idea here. React 👍 / 👎 to vote. Staff review top suggestions weekly.',
        },
      ],
    }),

  applications: (t) =>
    withCategory(t, {
      name: '📝 Applications',
      channels: [
        {
          name: 'apply-here',
          kind: 'text',
          topic: 'Apply for staff or special roles.',
          embeds: [
            {
              title: '📝 Applications Open',
              description: 'Click below to open an application form.',
            },
          ],
        },
        {
          name: 'application-logs',
          kind: 'text',
          visibleTo: ['Admin', 'Moderator', 'Owner', 'Founder', 'Leadership', 'Creator'],
        },
      ],
    }),

  giveaways: (t) =>
    withChannel(t, '🎉 Events', {
      name: 'giveaways',
      kind: 'text',
      topic: 'Active giveaways. React to enter.',
      embeds: [
        {
          title: '🎉 Giveaways',
          description: 'Active giveaways post here. React with the listed emoji to enter.',
        },
      ],
    }),

  'dev-logs': (t) =>
    withCategory(t, {
      name: '🛠️ Dev Logs',
      channels: [
        { name: 'changelog', kind: 'announcement', topic: 'Shipped updates.' },
        { name: 'roadmap', kind: 'text', topic: 'What\'s coming next.' },
        { name: 'incidents', kind: 'text', topic: 'Production incidents and post-mortems.' },
      ],
    }),

  economy: (t) =>
    withCategory(t, {
      name: '💰 Economy',
      channels: [
        { name: 'shop', kind: 'text', topic: 'Buy server perks with currency.' },
        { name: 'leaderboard', kind: 'text', topic: 'Top earners.' },
        { name: 'gamble', kind: 'text', topic: 'Coin-flip and slot games.' },
      ],
    }),

  'voice-channels': (t) =>
    withCategory(t, {
      name: '🔊 Voice',
      channels: [
        { name: 'Lounge', kind: 'voice' },
        { name: 'Music', kind: 'voice' },
        { name: 'Focus', kind: 'voice' },
        { name: 'AFK', kind: 'voice' },
      ],
    }),

  'ai-chat': (t) =>
    withCategory(t, {
      name: '🤖 AI',
      channels: [
        {
          name: 'ai-chat',
          kind: 'text',
          topic: 'Chat with the AI assistant.',
          embeds: [
            {
              title: '🤖 AI Assistant',
              description: 'Mention the bot or use the slash command to chat with the AI.',
            },
          ],
        },
        { name: 'ai-prompts', kind: 'text', topic: 'Share prompts and outputs.' },
      ],
    }),

  announcements: (t) =>
    withChannel(t, '📣 Announcements', {
      name: 'announcements',
      kind: 'announcement',
      topic: 'Official server updates.',
    }),
};

export function applySystems(template: ServerTemplate, systems: SystemKind[]): ServerTemplate {
  return systems.reduce<ServerTemplate>((acc, sys) => OVERLAYS[sys](acc), template);
}
