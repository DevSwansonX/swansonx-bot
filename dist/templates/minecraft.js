"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.minecraftTemplate = void 0;
exports.minecraftTemplate = {
    id: 'minecraft',
    name: 'Minecraft Community',
    description: 'A community server geared around a Minecraft realm or SMP.',
    roles: [
        { name: 'Owner', color: '#FF4D4D', hoist: true, permissions: ['Administrator'] },
        { name: 'Admin', color: '#FF8C42', hoist: true, permissions: ['ManageGuild', 'ManageChannels', 'ManageRoles'] },
        { name: 'Moderator', color: '#3BA55D', hoist: true, permissions: ['KickMembers', 'ManageMessages', 'MuteMembers'] },
        { name: 'Builder', color: '#A47148', hoist: true },
        { name: 'Member', color: '#7289DA' },
        { name: 'Guest', color: '#99AAB5' },
    ],
    categories: [
        {
            name: '📜 Information',
            channels: [
                { name: 'welcome', kind: 'text', topic: 'Read this first.' },
                { name: 'rules', kind: 'text', topic: 'Server rules.' },
                { name: 'announcements', kind: 'announcement', topic: 'Server updates and event news.' },
                { name: 'server-status', kind: 'text', topic: 'Live MC server status.' },
            ],
        },
        {
            name: '⛏️ Gameplay',
            channels: [
                { name: 'general-chat', kind: 'text', topic: 'In-game chatter.' },
                { name: 'builds-and-bases', kind: 'text', topic: 'Show off your builds.' },
                { name: 'redstone-tech', kind: 'text', topic: 'Redstone & farm engineering.' },
                { name: 'pvp-events', kind: 'text', topic: 'Tournaments and PvP events.' },
            ],
        },
        {
            name: '🛠️ Staff',
            visibleTo: ['Owner', 'Admin', 'Moderator'],
            channels: [
                { name: 'staff-chat', kind: 'text' },
                { name: 'mod-logs', kind: 'text' },
                { name: 'staff-vc', kind: 'voice' },
            ],
        },
        {
            name: '🔊 Voice',
            channels: [
                { name: 'Lobby', kind: 'voice' },
                { name: 'Survival VC', kind: 'voice' },
                { name: 'Creative VC', kind: 'voice' },
            ],
        },
    ],
    onboarding: {
        channel: 'welcome',
        welcome: {
            title: '⛏️ Welcome to the Realm',
            description: 'Glad to have you. Read the rules, grab roles, and hop into <#general-chat>.',
            color: 0x5fbf52,
            fields: [
                { name: 'Rules', value: 'See #rules before posting.' },
                { name: 'Server IP', value: 'Posted in #server-status.' },
                { name: 'Need help?', value: 'Ping a Moderator.' },
            ],
            footer: 'Built by SwansonX',
        },
        rules: {
            title: '📜 Server Rules',
            description: 'Follow these to keep the realm fun for everyone.',
            color: 0xfaa61a,
            fields: [
                { name: '1. Respect everyone', value: 'No harassment, slurs, or hate speech.' },
                { name: '2. No griefing', value: 'No raiding or destroying others\' builds without consent.' },
                { name: '3. No cheating', value: 'No hacked clients, x-ray, or duping.' },
                { name: '4. Keep chat clean', value: 'No spam, no NSFW.' },
                { name: '5. Staff have final say', value: 'Listen to mods and admins.' },
            ],
        },
    },
};
//# sourceMappingURL=minecraft.js.map