/* ============================================================== */
/* DISCORD DATA STORE — BOT PROMOTION & INTERACTIVE PLAYGROUND    */
/* ============================================================== */

// Discord SVG Avatars Generator (Authentic styled avatars with Base64 encoding)
function createAvatarSvg(bg, initials, iconType = 'initials') {
  let svg = '';
  if (iconType === 'bot') {
    svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="${bg}"><rect width="100" height="100" rx="50"/><path d="M25 40h50v26a10 10 0 01-10 10H35a10 10 0 01-10-10V40z" fill="#ffffff"/><circle cx="40" cy="52" r="5" fill="${bg}"/><circle cx="60" cy="52" r="5" fill="${bg}"/><path d="M42 26h16v10H42z" fill="#ffffff"/><circle cx="50" cy="22" r="4" fill="#ffffff"/></svg>`;
  } else {
    svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="${bg}"><rect width="100" height="100" rx="50"/><text x="50" y="62" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif" font-weight="700" font-size="38" fill="#ffffff" text-anchor="middle" dominant-baseline="central">${initials}</text></svg>`;
  }
  const base64 = typeof btoa !== 'undefined' ? btoa(svg) : Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

export const DISCORD_MEMBERS = [
  // Verified Bot
  {
    id: 'user_bot',
    name: 'NEXBOT',
    tag: '0001',
    avatar: createAvatarSvg('#5865F2', 'BOT', 'bot'),
    role: 'Verified Bot',
    roleColor: '#5865F2',
    isBot: true,
    isVerified: true,
    status: 'online',
    customStatus: 'Listening to /help | in 14,820 servers 🚀',
    personality: 'bot'
  },
  // Core Team & Admins
  {
    id: 'user_alex',
    name: 'Alex [Dev]',
    tag: '4491',
    avatar: createAvatarSvg('#3498db', 'AL'),
    role: 'Lead Bot Developer',
    roleColor: '#3498db',
    isBot: false,
    status: 'online',
    customStatus: 'building NEXBOT v3.2 ⚡',
    personality: 'tech'
  },
  {
    id: 'user_emma',
    name: 'Emma',
    tag: '1024',
    avatar: createAvatarSvg('#e91e63', 'EM'),
    role: 'Server Admin',
    roleColor: '#f1c40f',
    isBot: false,
    status: 'online',
    customStatus: 'Loving the new bot updates ✨',
    personality: 'moderator'
  },
  // Active Community
  {
    id: 'user_sarah',
    name: 'Sarah',
    tag: '8820',
    avatar: createAvatarSvg('#9b59b6', 'SA'),
    role: 'VIP Member',
    roleColor: '#e91e63',
    isBot: false,
    status: 'online',
    customStatus: 'just won a skin giveaway! 🎁',
    personality: 'helpful'
  },
  {
    id: 'user_jake',
    name: 'Jake',
    tag: '7731',
    avatar: createAvatarSvg('#2ecc71', 'JK'),
    role: 'CS2 Arbitrage Trader',
    roleColor: '#2ecc71',
    isBot: false,
    status: 'online',
    customStatus: 'Buff163 vs CSFloat scanning 📈',
    personality: 'economy'
  },
  {
    id: 'user_chloe',
    name: 'Chloe',
    tag: '8119',
    avatar: createAvatarSvg('#fd79a8', 'CH'),
    role: 'UI Designer',
    roleColor: '#fd79a8',
    isBot: false,
    status: 'dnd',
    customStatus: 'designing bot embed components',
    personality: 'designer'
  },
  {
    id: 'user_ethan',
    name: 'Ethan',
    tag: '6143',
    avatar: createAvatarSvg('#34495e', 'ET'),
    role: 'Member',
    roleColor: '#949ba4',
    isBot: false,
    status: 'online',
    customStatus: 'testing /ask prompt engine',
    personality: 'tech'
  },
  {
    id: 'user_daniel',
    name: 'Daniel',
    tag: '3319',
    avatar: createAvatarSvg('#f39c12', 'DA'),
    role: 'Member',
    roleColor: '#949ba4',
    isBot: false,
    status: 'online',
    customStatus: 'spinning coinflip 🪙',
    personality: 'giveaway'
  },
  {
    id: 'user_sophia',
    name: 'Sophia',
    tag: '5512',
    avatar: createAvatarSvg('#1abc9c', 'SO'),
    role: 'Member',
    roleColor: '#949ba4',
    isBot: false,
    status: 'online',
    customStatus: 'lofi radio 24/7 🎧',
    personality: 'friendly'
  },
  {
    id: 'user_mike',
    name: 'Mike',
    tag: '9902',
    avatar: createAvatarSvg('#e67e22', 'MK'),
    role: 'Member',
    roleColor: '#949ba4',
    isBot: false,
    status: 'idle',
    customStatus: 'afk claiming daily streak',
    personality: 'casual'
  },
  {
    id: 'user_liam',
    name: 'Liam',
    tag: '2981',
    avatar: createAvatarSvg('#00cec9', 'LM'),
    role: 'Member',
    roleColor: '#949ba4',
    isBot: false,
    status: 'online',
    customStatus: 'ranking up to Level 50',
    personality: 'gamer'
  },
  // Offline Members
  {
    id: 'user_noah',
    name: 'Noah',
    tag: '4021',
    avatar: createAvatarSvg('#7f8c8d', 'NO'),
    role: 'Member',
    roleColor: '#949ba4',
    isBot: false,
    status: 'offline',
    customStatus: '',
    personality: 'casual'
  },
  {
    id: 'user_ava',
    name: 'Ava',
    tag: '8832',
    avatar: createAvatarSvg('#95a5a6', 'AV'),
    role: 'Member',
    roleColor: '#949ba4',
    isBot: false,
    status: 'offline',
    customStatus: '',
    personality: 'casual'
  },
  {
    id: 'user_isabella',
    name: 'Isabella',
    tag: '7112',
    avatar: createAvatarSvg('#7f8c8d', 'IS'),
    role: 'Member',
    roleColor: '#949ba4',
    isBot: false,
    status: 'offline',
    customStatus: '',
    personality: 'casual'
  },
  // Additional community members (shown in the member list only)
  ...[
    ['maya', 'Maya', '#e91e63', 'MY', 'afk grabbing lunch', 'online'],
    ['lucas', 'Lucas', '#1abc9c', 'LU', 'listening to lofi 🎧', 'online'],
    ['zoe', 'Zoe', '#e67e22', 'ZO', 'playing CS2', 'online'],
    ['oliver', 'Oliver', '#7f8c8d', 'OL'],
    ['mia', 'Mia', '#7f8c8d', 'MI'],
    ['henry', 'Henry', '#7f8c8d', 'HE'],
    ['grace', 'Grace', '#7f8c8d', 'GR'],
    ['leo', 'Leo', '#7f8c8d', 'LE'],
    ['nora', 'Nora', '#7f8c8d', 'NO'],
    ['owen', 'Owen', '#7f8c8d', 'OW'],
    ['ella', 'Ella', '#7f8c8d', 'EL'],
    ['ryan', 'Ryan', '#7f8c8d', 'RY'],
    ['ivy', 'Ivy', '#7f8c8d', 'IV']
  ].map(([key, name, color, initials, customStatus = '', status = 'offline'], index) => ({
    id: `user_${key}`,
    name,
    tag: String(2300 + index * 37),
    avatar: createAvatarSvg(color, initials),
    role: 'Member',
    roleColor: status === 'online' ? '#dbdee1' : '#949ba4',
    isBot: false,
    status,
    customStatus,
    personality: 'casual'
  }))
];

// Current visitor profile
export const CURRENT_VISITOR = {
  id: 'visitor_user',
  name: 'Nexus Explorer',
  tag: '2026',
  avatar: createAvatarSvg('#00b0f4', 'YOU'),
  role: 'Beta Tester',
  roleColor: '#00b0f4',
  isBot: false,
  status: 'online',
  customStatus: 'Testing NEXBOT features 🚀',
  isUser: true,
  level: 3,
  xp: 340,
  xpToNextLevel: 500,
  coins: 850,
  streak: 3,
  reputation: 18
};

// Discord Channel Definitions
export const DISCORD_CHANNELS = [
  {
    id: 'bot-commands',
    name: 'bot-commands',
    category: 'BOT SHOWCASE',
    icon: 'hash',
    topic: 'Interactive Command Sandbox • Click any command in the NEXBOT directory or type / to execute live',
    badge: 'DEFAULT',
    unread: false
  },
  {
    id: 'ai-assistant',
    name: 'ai-assistant',
    category: 'BOT SHOWCASE',
    icon: 'sparkles',
    topic: 'NEXBOT AI Assistant • Ask natural-language questions about NEXBOT functions, commands & capabilities',
    badge: 'AI Q&A',
    unread: false
  },
  {
    id: 'cs2-arbitrage-alerts',
    name: 'cs2-arbitrage-alerts',
    category: 'BOT SHOWCASE',
    icon: 'chart',
    topic: 'Live Real-Time CS2 Skin Market Monitor • CSFloat, Buff163, Skinport & Steam live data feed',
    badge: 'LIVE API',
    unread: true
  },
  {
    id: 'general',
    name: 'general',
    category: 'COMMUNITY',
    icon: 'hash',
    topic: 'Community discussion • Share bot feedback and chill',
    unread: false
  }
];

// Initial simulated member wallets for Economy & Leaderboards
export const COMMUNITY_WALLETS = {
  'user_alex': { coins: 8450, bank: 15000, streak: 14, inventory: ['👑 Admin Shield', '💎 VIP Patron'] },
  'user_sarah': { coins: 5200, bank: 8200, streak: 9, inventory: ['🎨 Neon Theme', '💎 VIP Patron'] },
  'user_jake': { coins: 3850, bank: 4100, streak: 6, inventory: ['🔫 CS2 Case Charm'] },
  'user_emma': { coins: 2900, bank: 3500, streak: 4, inventory: ['⭐ VIP Badge'] },
  'user_daniel': { coins: 1450, bank: 1000, streak: 2, inventory: [] },
  'user_chloe': { coins: 2100, bank: 2500, streak: 3, inventory: ['🎨 Neon Theme'] },
  'user_ethan': { coins: 1800, bank: 1200, streak: 1, inventory: [] },
  'user_sophia': { coins: 2600, bank: 3100, streak: 5, inventory: ['💎 VIP Patron'] },
  'user_visitor': { coins: 850, bank: 2000, streak: 3, inventory: ['💎 Verified Member'] }
};

// Automation presets for the Visual Automation Builder
export const AUTOMATION_PRESETS = [
  {
    id: 'rule_anti_raid',
    name: 'Anti-Raid Dynamic Shield',
    trigger: 'GUILD_MEMBER_JOIN',
    triggerLabel: 'Member Join Spike (>8/10s)',
    condition: 'joins_within_10s > 8',
    conditionLabel: 'Join Velocity: >8 accounts in 10s',
    action: 'LOCK_CHANNEL_AND_MASS_BAN',
    actionLabel: 'Auto-Lockdown Channel & Mass-Ban Raiders',
    enabled: true,
    executions: 42
  },
  {
    id: 'rule_phishing',
    name: 'Zero-Tolerance Phishing Blocker',
    trigger: 'MESSAGE_CREATE',
    triggerLabel: 'Message Sent in Any Channel',
    condition: 'contains_phishing_link',
    conditionLabel: 'Contains Discord Scam / Fake Nitro Link',
    action: 'TIMEOUT_MEMBER_24H',
    actionLabel: 'Purge Message & Auto-Timeout 24h',
    enabled: true,
    executions: 128
  },
  {
    id: 'rule_welcome_verify',
    name: 'Gatekeeper Auto-Role & Account-Age Shield',
    trigger: 'GUILD_MEMBER_JOIN',
    triggerLabel: 'On Member Join / Verification',
    condition: 'account_age_days < 3',
    conditionLabel: 'Account Age Check & Captcha Shield',
    action: 'ASSIGN_VERIFIED_ROLE',
    actionLabel: 'Assign @Verified Role + Send Welcome Card',
    enabled: true,
    executions: 1420
  }
];

// Command Categories Metadata (Only categories that exist in SLASH_COMMANDS)
export const COMMAND_CATEGORIES = [
  { id: 'Moderation', label: 'Moderation', icon: '🛡️', color: '#ed4245', description: 'Server protection, raid simulation, bans, timeouts, warnings, and channel locks.' },
  { id: 'Economy', label: 'Economy', icon: '🪙', color: '#f1c40f', description: 'Stateful virtual currency wallets, daily streaks, jobs, P2P transfers, shop, and wagering.' },
  { id: 'Giveaways', label: 'Giveaways', icon: '🎉', color: '#9b59b6', description: 'Live provably-fair community raffles with countdowns, entrant tracking, and rerolls.' },
  { id: 'Leveling', label: 'Leveling', icon: '⭐', color: '#00b0f4', description: 'Member tier cards, community profiles, peer reputation points, and daily quests.' },
  { id: 'Tickets', label: 'Tickets', icon: '🎫', color: '#2ecc71', description: 'Private support desk channel provisioning, staff claiming, and encrypted transcripts.' },
  { id: 'Automation', label: 'Automation', icon: '⚡', color: '#5865f2', description: 'Visual event-driven rule builder (Trigger → Condition → Action) and AutoMod telemetry.' },
  { id: 'Utility', label: 'Utility', icon: '🔧', color: '#1abc9c', description: 'Gatekeeper verification, server rules, cluster telemetry, AI Q&A, and live CS2 skin scanner.' }
];

// Available Slash Commands (Complete Actual Command Registry)
export const SLASH_COMMANDS = [
  // 1. Moderation
  {
    name: 'antiraid',
    category: 'Moderation',
    description: 'Trigger a live simulated 8-bot spam raid & watch NEXBOT neutralize it in real time',
    syntax: '/antiraid simulate',
    example: '/antiraid simulate',
    featured: true
  },
  {
    name: 'ban',
    category: 'Moderation',
    description: 'Permanently ban a malicious member and record an audit log strike',
    syntax: '/ban @member [reason]',
    example: '/ban @Raider Malicious phishing bot link',
    featured: true
  },
  {
    name: 'unban',
    category: 'Moderation',
    description: 'Revoke a member ban from the server blacklist and restore access',
    syntax: '/unban @member',
    example: '/unban @Raider'
  },
  {
    name: 'kick',
    category: 'Moderation',
    description: 'Remove a disruptive member from the server with moderation notice',
    syntax: '/kick @member [reason]',
    example: '/kick @Troublemaker Disrupting community chat'
  },
  {
    name: 'timeout',
    category: 'Moderation',
    description: 'Temporarily mute and restrict a member from sending messages or reactions',
    syntax: '/timeout @member [minutes] [reason]',
    example: '/timeout @Daniel 30 Spamming emotes'
  },
  {
    name: 'warn',
    category: 'Moderation',
    description: 'Issue an official disciplinary moderation strike to a member',
    syntax: '/warn @member [reason]',
    example: '/warn @Daniel Repeated spam reactions'
  },
  {
    name: 'warnings',
    category: 'Moderation',
    description: 'View active disciplinary warnings history for a server member',
    syntax: '/warnings @member',
    example: '/warnings @Daniel'
  },
  {
    name: 'clear',
    category: 'Moderation',
    description: 'Bulk-delete a specified number of recent messages in the active channel',
    syntax: '/clear [amount]',
    example: '/clear 3'
  },
  {
    name: 'lock',
    category: 'Moderation',
    description: 'Engage emergency lockdown on the current channel to halt member messages',
    syntax: '/lock [reason]',
    example: '/lock Emergency raid containment'
  },
  {
    name: 'unlock',
    category: 'Moderation',
    description: 'Lift channel lockdown and restore normal messaging permissions',
    syntax: '/unlock',
    example: '/unlock'
  },
  {
    name: 'slowmode',
    category: 'Moderation',
    description: 'Configure per-user message cooldown timer for the current channel',
    syntax: '/slowmode [seconds]',
    example: '/slowmode 15'
  },

  // 2. Economy
  {
    name: 'balance',
    category: 'Economy',
    description: 'Check your wallet cash, vault bank reserves, daily streak, and net worth',
    syntax: '/balance [@member]',
    example: '/balance',
    featured: true
  },
  {
    name: 'daily',
    category: 'Economy',
    description: 'Claim your daily coin reward and increment your streak bonus multiplier',
    syntax: '/daily',
    example: '/daily',
    featured: true
  },
  {
    name: 'weekly',
    category: 'Economy',
    description: 'Claim your weekly +1,000 coin community member stipend',
    syntax: '/weekly',
    example: '/weekly'
  },
  {
    name: 'work',
    category: 'Economy',
    description: 'Complete a simulated software engineering or quant trading shift to earn coins',
    syntax: '/work',
    example: '/work',
    featured: true
  },
  {
    name: 'pay',
    category: 'Economy',
    description: 'Transfer virtual currency from your wallet to another server member',
    syntax: '/pay @member [amount]',
    example: '/pay @Alex 100'
  },
  {
    name: 'shop',
    category: 'Economy',
    description: 'Browse and purchase cosmetic server roles, badges, and streak boosters',
    syntax: '/shop [buy] [item_number]',
    example: '/shop'
  },
  {
    name: 'inventory',
    category: 'Economy',
    description: 'Inspect all badges, roles, and cosmetic items owned in your account',
    syntax: '/inventory',
    example: '/inventory'
  },
  {
    name: 'leaderboard',
    category: 'Economy',
    description: 'Display the top richest server members ranked by total net worth',
    syntax: '/leaderboard',
    example: '/leaderboard'
  },
  {
    name: 'coinflip',
    category: 'Economy',
    description: 'Wager coins in a provably-fair 50/50 heads or tails flip game',
    syntax: '/coinflip [heads/tails] [amount]',
    example: '/coinflip heads 100'
  },
  {
    name: 'rob',
    category: 'Economy',
    description: 'Attempt a high-risk coin heist against another community member',
    syntax: '/rob @member',
    example: '/rob @Alex'
  },

  // 3. Giveaways
  {
    name: 'giveaway',
    category: 'Giveaways',
    description: 'Start, end, reroll, or list live community giveaways with automated winner drawing',
    syntax: '/giveaway [start/end/reroll/list] [prize]',
    example: '/giveaway start AWP | Asiimov (Field-Tested)',
    featured: true
  },

  // 4. Leveling
  {
    name: 'rank',
    category: 'Leveling',
    description: 'View your server activity tier, trust score, streak, and reputation points',
    syntax: '/rank [@member]',
    example: '/rank',
    featured: true
  },
  {
    name: 'profile',
    category: 'Leveling',
    description: 'Display a comprehensive community profile card with badges, wallet, and stats',
    syntax: '/profile [@member]',
    example: '/profile'
  },
  {
    name: 'rep',
    category: 'Leveling',
    description: 'Award +1 peer reputation point to a helpful community member',
    syntax: '/rep @member',
    example: '/rep @Alex'
  },
  {
    name: 'daily-challenge',
    category: 'Leveling',
    description: 'Check active daily server engagement quests and coin bounties',
    syntax: '/daily-challenge',
    example: '/daily-challenge'
  },

  // 5. Tickets
  {
    name: 'ticket',
    category: 'Tickets',
    description: 'Open the support ticket portal, create a private ticket channel, claim, or generate transcripts',
    syntax: '/ticket [panel/create/claim/close/transcript]',
    example: '/ticket panel',
    featured: true
  },

  // 6. Automation
  {
    name: 'automation',
    category: 'Automation',
    description: 'Open the Visual Automation Builder (Trigger → Condition → Action) or list active pipelines',
    syntax: '/automation [builder/list]',
    example: '/automation',
    featured: true
  },
  {
    name: 'automod',
    category: 'Automation',
    description: 'Inspect real-time anti-spam, phishing domain blocker, and raid shield status',
    syntax: '/automod',
    example: '/automod'
  },

  // 7. Utility
  {
    name: 'verify',
    category: 'Utility',
    description: 'Run the Gatekeeper 1-click identity verification check to unlock @Verified role',
    syntax: '/verify',
    example: '/verify'
  },
  {
    name: 'rules',
    category: 'Utility',
    description: 'Display official community guidelines and automated enforcement policies',
    syntax: '/rules',
    example: '/rules'
  },
  {
    name: 'stats',
    category: 'Utility',
    description: 'View NEXBOT cluster health, gateway ping, uptime, and security metrics',
    syntax: '/stats',
    example: '/stats'
  },
  {
    name: 'audit-log',
    category: 'Utility',
    description: 'Inspect recent moderation actions, bans, warnings, and anti-raid logs',
    syntax: '/audit-log',
    example: '/audit-log'
  },
  {
    name: 'help',
    category: 'Utility',
    description: 'Display the interactive categorized NEXBOT command directory and usage guide',
    syntax: '/help [category]',
    example: '/help'
  },
  {
    name: 'ask',
    category: 'Utility',
    description: 'Ask the NEXBOT AI Assistant any natural-language question about bot capabilities',
    syntax: '/ask [question]',
    example: '/ask What moderation functions do you have?'
  },
  {
    name: 'skin',
    category: 'Utility',
    description: 'Fetch real live CS2 skin prices, wear, StatTrak™ status & listing links from external markets',
    syntax: '/skin [weapon | finish]',
    example: '/skin AK-47 | Asiimov',
    featured: true
  }
];

// Quick Clickable Suggestion Chips in the Chat Input Bar
export const PROMPT_CHIPS = [
  { label: '🪙 /balance', cmd: '/balance' },
  { label: '🎁 /daily', cmd: '/daily' },
  { label: '🎉 /giveaway', cmd: '/giveaway start AWP | Asiimov (Field-Tested)' },
  { label: '🔨 /ban', cmd: '/ban @Raider Malicious phishing bot link' },
  { label: '⭐ /rank', cmd: '/rank' },
  { label: '🚨 /antiraid', cmd: '/antiraid simulate' },
  { label: '🎫 /ticket panel', cmd: '/ticket panel' },
  { label: '⚡ /automation', cmd: '/automation' },
  { label: '🔫 /skin AK-47 | Asiimov', cmd: '/skin AK-47 | Asiimov' },
  { label: '💼 /work', cmd: '/work' },
  { label: '🏆 /leaderboard', cmd: '/leaderboard' },
  { label: '📊 /stats', cmd: '/stats' }
];

// Suggested natural-language questions for Channel 2 (#ai-assistant)
export const AI_ASSISTANT_SUGGESTIONS = [
  "How does auto-mod work?",
  "Can you run giveaways?",
  "What moderation functions do you have?",
  "Can you detect spam?",
  "Can you create an automatic welcome system?",
  "Can you manage an economy system?",
  "Can you build custom automation?",
  "Can you do something that isn't currently available?"
];

// Multi-Channel Initial Message Stores
export const CHANNEL_MESSAGES = {
  'bot-commands': [
    {
      id: 'msg_welcome_bot',
      userId: 'user_bot',
      isBot: true,
      isCommandDirectory: true,
      activeCategory: 'All',
      timestamp: 'Today at 4:10 PM',
      rawTime: Date.now() - 3600000,
      reactions: [
        { emoji: '🚀', count: 14, users: ['user_alex', 'user_emma', 'user_sarah', 'user_jake'], userReacted: false },
        { emoji: '⚡', count: 9, users: ['user_ethan', 'user_daniel', 'user_sophia'], userReacted: false }
      ]
    }
  ],

  'ai-assistant': [
    {
      id: 'msg_ai_welcome_natural',
      userId: 'user_bot',
      isBot: true,
      content: "Hey! 👋 I'm **NEXBOT AI**. You can chat with me naturally right here — ask me anything like *\"what moderation tools do you have?\"*, *\"can you do that automatically?\"*, *\"what's that command?\"*, or *\"can you build a new feature?\"* and I'll answer directly.",
      timestamp: 'Today at 3:12 PM',
      rawTime: Date.now() - 6500000,
      reactions: []
    }
  ],

  'cs2-arbitrage-alerts': [],

  'general': [
    {
      id: 'msg_gen_1',
      userId: 'user_emma',
      content: "Hey everyone! We just hit **14,820 active servers** on NEXBOT! 🚀 Huge thanks to everyone testing the interactive command sandbox and live CS2 market feed.",
      timestamp: 'Today at 2:20 PM',
      rawTime: Date.now() - 9600000,
      reactions: [
        { emoji: '🎉', count: 9, users: ['user_alex', 'user_sarah', 'user_jake', 'user_chloe'], userReacted: false },
        { emoji: '❤️', count: 7, users: ['user_sophia', 'user_daniel'], userReacted: false }
      ]
    },
    {
      id: 'msg_gen_2',
      userId: 'user_alex',
      replyToId: 'msg_gen_1',
      content: "All 7 command modules in `#bot-commands`, the capability Q&A assistant in `#ai-assistant`, and the real-time multi-market CS2 feed in `#cs2-arbitrage-alerts` are live!",
      timestamp: 'Today at 2:24 PM',
      rawTime: Date.now() - 9360000,
      reactions: [
        { emoji: '🙌', count: 4, users: ['user_emma', 'user_sarah'], userReacted: false }
      ]
    },
    {
      id: 'msg_gen_3',
      userId: 'user_sarah',
      content: "Friendly reminder to new visitors: click any command in `#bot-commands` or ask the AI assistant in `#ai-assistant` what NEXBOT can build! 🚀",
      timestamp: 'Today at 3:45 PM',
      rawTime: Date.now() - 4500000,
      reactions: [
        { emoji: '⭐', count: 3, users: ['user_emma', 'user_alex'], userReacted: false }
      ]
    }
  ]
};

// Dynamic Conversational pool for autonomous community chat (kept in #general so showcase channels stay clean)
export const CONVERSATION_THREADS = [
  {
    id: 't_general_1',
    channel: 'general',
    messages: [
      { userId: 'user_daniel', text: "Just tested `/coinflip` and `/daily` in #bot-commands, the economy ledger updates instantly." },
      { userId: 'user_alex', text: "Glad to hear Daniel! Let me know if you want to test any custom `/automation` pipelines too." },
      { userId: 'user_jake', text: "The live CSFloat vs Buff163 price feed in #cs2-arbitrage-alerts is super accurate 🔥" }
    ]
  },
  {
    id: 't_general_2',
    channel: 'general',
    messages: [
      { userId: 'user_chloe', text: "Working on the new embed badge icons for the Discord desktop client right now ✨" },
      { userId: 'user_emma', text: "Looking forward to seeing them Chloe! The category tabs in #bot-commands look super clean." }
    ]
  }
];
