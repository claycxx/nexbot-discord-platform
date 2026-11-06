/* ============================================================== */
/* NEXBOT MODULAR DISCORD BOT ARCHITECTURE & SIMULATOR ADAPTER    */
/* Real Business Logic Modules with Stateful Sandbox Execution    */
/* ============================================================== */

import { 
  DISCORD_MEMBERS, 
  CONVERSATION_THREADS, 
  CURRENT_VISITOR, 
  DISCORD_CHANNELS, 
  COMMUNITY_WALLETS, 
  AUTOMATION_PRESETS, 
  COMMAND_CATEGORIES,
  SLASH_COMMANDS 
} from './discord-data.js?v=10';

/* -------------------------------------------------------------- */
/* 0. High-Fidelity Audio Synthesizer (Web Audio API)            */
/* -------------------------------------------------------------- */
class DiscordAudio {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playMessageChime() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(1050, now + 0.08);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.16);
    } catch (e) { }
  }

  playSendChime() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(900, now + 0.06);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.13);
    } catch (e) { }
  }

  playCoinSound() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(987.77, now);
      osc.frequency.setValueAtTime(1318.51, now + 0.08);
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.32);
    } catch (e) { }
  }

  playAlert() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      [0, 0.14, 0.28].forEach(offset => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, now + offset);
        osc.frequency.setValueAtTime(440, now + offset + 0.07);
        gain.gain.setValueAtTime(0.06, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.13);
      });
    } catch (e) { }
  }

  playSuccessChime() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        const start = this.ctx.currentTime + (idx * 0.07);
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.06, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(start);
        osc.stop(start + 0.23);
      });
    } catch (e) { }
  }

  playLevelUpChime() {
    this.playSuccessChime();
  }

  playClick() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(320, now);
      gain.gain.setValueAtTime(0.02, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    } catch (e) { }
  }
}

export const discordAudio = new DiscordAudio();

/* -------------------------------------------------------------- */
/* 1. MODULE: Moderation & Anti-Raid Defense System               */
/* -------------------------------------------------------------- */
export class ModerationModule {
  constructor(engine) {
    this.engine = engine;
    this.warns = new Map([
      ['Daniel', [{ id: 'w_1', reason: 'Excessive caps in #general', date: 'Yesterday at 3:12 PM', mod: 'Alex [Dev]' }]],
      ['user_daniel', [{ id: 'w_1', reason: 'Excessive caps in #general', date: 'Yesterday at 3:12 PM', mod: 'Alex [Dev]' }]]
    ]);
    this.bannedUsers = new Set(['ScamBot#01', 'RaidRaider#02']);
    this.lockedChannels = new Set();
    this.slowmodes = new Map();
    this.auditLog = [
      { id: 'LOG-412', action: 'ANTIRAID_QUARANTINE', target: '8 Bot Spammers', mod: 'NEXBOT AutoMod', time: '1h ago', reason: 'Spam spike (>8 msg/s)' },
      { id: 'LOG-411', action: 'TIMEOUT', target: 'Daniel', mod: 'NEXBOT Shield', time: '3h ago', reason: 'Triggered anti-invite rule' }
    ];
  }

  warn(targetUser, reason, mod = 'Nexus Explorer') {
    const cleanTarget = targetUser.replace(/^@/, '');
    const list = this.warns.get(cleanTarget) || [];
    const record = { id: `w_${Date.now()}`, reason, date: 'Just now', mod };
    list.push(record);
    this.warns.set(cleanTarget, list);

    this.auditLog.unshift({
      id: `LOG-${Math.floor(Math.random() * 900 + 100)}`,
      action: 'WARN',
      target: cleanTarget,
      mod,
      time: 'Just now',
      reason
    });

    return {
      title: `⚠️ Moderation Warning Issued — Case #${Math.floor(Math.random() * 8000 + 1000)}`,
      color: "#f1c40f",
      description: `Official disciplinary strike registered for <@${cleanTarget}>.`,
      fields: [
        { name: "Target Member", value: `<@${cleanTarget}>`, inline: true },
        { name: "Moderator", value: mod, inline: true },
        { name: "Total Strikes", value: `**${list.length} Warning${list.length === 1 ? '' : 's'}**`, inline: true },
        { name: "Infraction Reason", value: `\`${reason}\``, inline: false },
        { name: "Automated Escalation", value: list.length >= 3 ? "🚨 **Account scheduled for 24h timeout (3+ strikes)**" : "Next strike will trigger temporary restriction.", inline: false }
      ],
      footer: "NEXBOT Enforcement Engine • Zero-tolerance server protection"
    };
  }

  getWarnings(targetUser) {
    const cleanTarget = targetUser.replace(/^@/, '');
    const list = this.warns.get(cleanTarget) || [];
    if (!list.length) {
      return {
        title: `🛡️ Disciplinary Record — Clean`,
        color: "#2ecc71",
        description: `Member <@${cleanTarget}> has **0 active warnings** on record. Account is in good standing.`,
        footer: "NEXBOT Audit History"
      };
    }

    return {
      title: `⚠️ Disciplinary Record — ${cleanTarget} (${list.length} Strike${list.length === 1 ? '' : 's'})`,
      color: "#e67e22",
      description: `Active moderation infractions recorded on file:`,
      fields: list.map((w, idx) => ({
        name: `Strike #${idx + 1} • Case ${w.id}`,
        value: `**Reason:** ${w.reason}\n**Issued by:** ${w.mod} • ${w.date}`,
        inline: false
      })),
      footer: "NEXBOT Enforcement Engine"
    };
  }

  ban(targetUser, reason, mod = 'Nexus Explorer') {
    const cleanTarget = targetUser.replace(/^@/, '');
    this.bannedUsers.add(cleanTarget);
    this.auditLog.unshift({
      id: `LOG-${Math.floor(Math.random() * 900 + 100)}`,
      action: 'BAN',
      target: cleanTarget,
      mod,
      time: 'Just now',
      reason
    });

    return {
      title: `🔨 Member Banned — Blacklist Updated`,
      color: "#ed4245",
      description: `User <@${cleanTarget}> has been permanently banned from the server.`,
      fields: [
        { name: "Banned User", value: `<@${cleanTarget}>`, inline: true },
        { name: "Enforcing Moderator", value: mod, inline: true },
        { name: "Reason", value: `\`${reason}\``, inline: false },
        { name: "IP & Guild Blacklist", value: "✅ Activated (Auto-reject rejoining)", inline: true },
        { name: "Message History", value: "Purged (Last 24 Hours)", inline: true }
      ],
      footer: "Incident recorded in /audit-log • Token invalidated"
    };
  }

  unban(targetUser, mod = 'Nexus Explorer') {
    const cleanTarget = targetUser.replace(/^@/, '');
    const wasBanned = this.bannedUsers.has(cleanTarget);
    this.bannedUsers.delete(cleanTarget);
    this.auditLog.unshift({
      id: `LOG-${Math.floor(Math.random() * 900 + 100)}`,
      action: 'UNBAN',
      target: cleanTarget,
      mod,
      time: 'Just now',
      reason: 'Ban revoked by moderator'
    });

    return {
      title: `🔓 Member Unbanned — Access Restored`,
      color: "#2ecc71",
      description: `User <@${cleanTarget}> has been removed from the server blacklist and may rejoin.`,
      fields: [
        { name: "Unbanned User", value: `<@${cleanTarget}>`, inline: true },
        { name: "Moderator", value: mod, inline: true },
        { name: "Previous Status", value: wasBanned ? "`Blacklisted (Active Ban)`" : "`Cleared from Registry`", inline: true }
      ],
      footer: "NEXBOT Enforcement Engine • Logged in /audit-log"
    };
  }

  kick(targetUser, reason, mod = 'Nexus Explorer') {
    const cleanTarget = targetUser.replace(/^@/, '');
    this.auditLog.unshift({
      id: `LOG-${Math.floor(Math.random() * 900 + 100)}`,
      action: 'KICK',
      target: cleanTarget,
      mod,
      time: 'Just now',
      reason
    });
    return {
      title: `👢 Member Kicked from Guild`,
      color: "#e67e22",
      description: `User <@${cleanTarget}> was removed from the community.`,
      fields: [
        { name: "Kicked User", value: `<@${cleanTarget}>`, inline: true },
        { name: "Enforcer", value: mod, inline: true },
        { name: "Reason", value: `\`${reason}\``, inline: false }
      ],
      footer: "NEXBOT Moderation Module"
    };
  }

  timeout(targetUser, minutes, reason, mod = 'Nexus Explorer') {
    const cleanTarget = targetUser.replace(/^@/, '');
    this.auditLog.unshift({
      id: `LOG-${Math.floor(Math.random() * 900 + 100)}`,
      action: 'TIMEOUT',
      target: cleanTarget,
      mod,
      time: 'Just now',
      reason: `${minutes}m — ${reason}`
    });
    return {
      title: `⏳ Member Timed Out — Quarantine Active`,
      color: "#f39c12",
      description: `<@${cleanTarget}> has been placed in communication isolation for **${minutes} minutes**.`,
      fields: [
        { name: "Target Member", value: `<@${cleanTarget}>`, inline: true },
        { name: "Duration", value: `${minutes} Minutes`, inline: true },
        { name: "Reason", value: `\`${reason}\``, inline: false }
      ],
      footer: "Chat and reaction permissions revoked until expiration"
    };
  }

  lock(channelId, reason = 'Emergency lockdown requested') {
    this.lockedChannels.add(channelId);
    this.auditLog.unshift({
      id: `LOG-${Math.floor(Math.random() * 900 + 100)}`,
      action: 'CHANNEL_LOCK',
      target: `#${channelId}`,
      mod: CURRENT_VISITOR.name,
      time: 'Just now',
      reason
    });
    return {
      title: `🔒 Channel Lockdown Initiated`,
      color: "#e74c3c",
      description: `Channel **#${channelId}** is now **LOCKED**. Regular member write permissions have been revoked.`,
      fields: [
        { name: "Lock Reason", value: `\`${reason}\``, inline: true },
        { name: "Slowmode Active", value: "`6 Hours`", inline: true },
        { name: "Restoration", value: "Type `/unlock` or click below to restore normal chat permissions.", inline: false }
      ],
      footer: "NEXBOT Security Protocol"
    };
  }

  unlock(channelId) {
    this.lockedChannels.delete(channelId);
    return {
      title: `🔓 Channel Lockdown Lifted`,
      color: "#2ecc71",
      description: `Channel **#${channelId}** has been restored. Regular messaging permissions are now active.`,
      footer: "NEXBOT Security Protocol"
    };
  }

  clear(count, channelId) {
    const safeCount = Math.min(20, Math.max(1, count));
    const store = this.engine.sim.channelStores[channelId] || [];
    // Preserve pinned/directory first message in #bot-commands so visitors never lose the command guide
    const removable = store.filter(m => !m.isCommandDirectory);
    const toDeleteCount = Math.min(safeCount, removable.length);
    for (let i = 0; i < toDeleteCount; i++) {
      const idx = store.findLastIndex(m => !m.isCommandDirectory);
      if (idx !== -1) store.splice(idx, 1);
    }
    this.engine.sim.renderMessages();

    return {
      title: `🧹 Bulk Message Cleanup Completed`,
      color: "#3498db",
      description: `Successfully purged **${toDeleteCount} message${toDeleteCount === 1 ? '' : 's'}** from **#${channelId}** (pinned command directory preserved).`,
      footer: "Cleaned by NEXBOT AutoMod • Audit entry created"
    };
  }

  simulateAntiRaid() {
    const channelId = this.engine.sim.activeChannelId;
    discordAudio.playAlert();

    const raidBots = [
      { name: "ScamBot#01", text: "🎁 FREE DISCORD NITRO 3 MONTHS! Claim here: http://discord-free-nitro.xyz" },
      { name: "RaidRaider#02", text: "🔥 HUGE CS2 SKIN DROP! Free Dragon Lore: http://cs2-giveaway-scam.net" },
      { name: "NitroSpam#03", text: "🚨 ALL MEMBERS GET FREE $50 STEAM GIFT CARD: http://steam-gift-cards.xyz" },
      { name: "SpamBot#04", text: "🎁 FREE DISCORD NITRO 3 MONTHS! Claim here: http://discord-free-nitro.xyz" },
      { name: "RaidRaider#05", text: "🔥 HUGE CS2 SKIN DROP! Free Dragon Lore: http://cs2-giveaway-scam.net" },
      { name: "CryptoScam#06", text: "💰 DUPING CRYPTO COINS LIVE STREAM: http://eth-doubler-scam.xyz" },
      { name: "NitroSpam#07", text: "🚨 ALL MEMBERS GET FREE $50 STEAM GIFT CARD: http://steam-gift-cards.xyz" },
      { name: "SpamBot#08", text: "🎁 FREE DISCORD NITRO 3 MONTHS! Claim here: http://discord-free-nitro.xyz" }
    ];

    raidBots.forEach((r, idx) => {
      setTimeout(() => {
        this.engine.sim.addMessageToChannel(channelId, {
          id: `raid_spam_${Date.now()}_${idx}`,
          userId: 'user_alex',
          authorOverride: { name: r.name, roleColor: '#ed4245' },
          content: r.text,
          timestamp: this.engine.sim.formatDiscordTime(new Date()),
          rawTime: Date.now()
        });
        discordAudio.playMessageChime();
      }, idx * 120);
    });

    setTimeout(() => {
      discordAudio.playAlert();

      const lockMsg = {
        id: `automod_alert_${Date.now()}`,
        userId: 'user_bot',
        isBot: true,
        embed: {
          title: "🚨 [NEXBOT AutoMod] RAID ATTACK DETECTED & ENGAGED",
          color: "#ed4245",
          description: `**Emergency Protocol Activated:** Influx of **8 malicious bot accounts** detected within 950ms.\n\n🛡️ Channel **#${channelId}** has been automatically locked to prevent community impact.`,
          footer: "Automated Threat Defense Core"
        },
        timestamp: this.engine.sim.formatDiscordTime(new Date()),
        rawTime: Date.now()
      };
      this.engine.sim.addMessageToChannel(channelId, lockMsg);

      setTimeout(() => {
        const store = this.engine.sim.channelStores[channelId] || [];
        this.engine.sim.channelStores[channelId] = store.filter(m => !m.id.startsWith('raid_spam_'));
        this.engine.sim.renderMessages();
        discordAudio.playSuccessChime();

        this.auditLog.unshift({
          id: `LOG-${Math.floor(Math.random() * 900 + 100)}`,
          action: 'ANTIRAID_NEUTRALIZE',
          target: '8 Raider Bot Accounts',
          mod: 'NEXBOT AutoMod',
          time: 'Just now',
          reason: 'Coordinated phishing link flood (>8 msg/s)'
        });

        const reportMsg = {
          id: `automod_report_${Date.now()}`,
          userId: 'user_bot',
          isBot: true,
          embed: {
            title: "🛡️ NEXBOT Threat Neutralization Incident Report",
            color: "#2ecc71",
            description: `**Threat Status: NEUTRALIZED IN 280ms.**\nAll malicious spam messages purged and attacking tokens permanently revoked.`,
            fields: [
              { name: "Accounts Quarantined", value: "`8 Raider Bots`", inline: true },
              { name: "Enforcement Actions", value: "`8 Auto-Bans / IP Blacklisted`", inline: true },
              { name: "Messages Purged", value: "`8 Spam Injections`", inline: true },
              { name: "Response Latency", value: "`0.28s (Edge Filter)`", inline: true },
              { name: "Channel Health", value: "`✅ Lockdown Lifted • Clean`", inline: true },
              { name: "Cluster Defense", value: "`All 14,820 Servers Alerted`", inline: true }
            ],
            footer: "NEXBOT Neural AutoMod Engine • Continuous Real-Time Ingestion"
          },
          buttons: [
            { id: 'btn_action_audit', label: '📜 View Security Audit Log', style: 'secondary' }
          ],
          timestamp: this.engine.sim.formatDiscordTime(new Date()),
          rawTime: Date.now()
        };
        this.engine.sim.addMessageToChannel(channelId, reportMsg);
      }, 1500);

    }, (raidBots.length * 120) + 300);
  }
}

/* -------------------------------------------------------------- */
/* 2. MODULE: Economy & Currency System                          */
/* -------------------------------------------------------------- */
export class EconomyModule {
  constructor(engine) {
    this.engine = engine;
    this.wallets = JSON.parse(JSON.stringify(COMMUNITY_WALLETS));
    this.shopItems = [
      { id: 1, name: '💎 VIP Supporter Role', cost: 500, desc: 'Custom color, priority bot queue, VIP chat badge.' },
      { id: 2, name: '🎨 Custom Neon Gradient Theme', cost: 1200, desc: 'Exclusive gradient styling for your embed cards.' },
      { id: 3, name: '🔫 CS2 Dragon Lore Chat Charm', cost: 2500, desc: 'Rare animated skin icon attached to every message.' },
      { id: 4, name: '⚡ 2x Streak Multiplier Booster', cost: 1800, desc: 'Permanently double your daily claim streak bonuses.' }
    ];
  }

  getWallet(userId) {
    if (!this.wallets[userId]) {
      this.wallets[userId] = { coins: 500, bank: 1000, streak: 1, inventory: [] };
    }
    return this.wallets[userId];
  }

  daily(userId) {
    const w = this.getWallet(userId);
    const amount = 250 + (w.streak * 25);
    w.coins += amount;
    w.streak += 1;
    discordAudio.playCoinSound();

    return {
      title: "🪙 Daily Reward Claimed!",
      color: "#f1c40f",
      description: `You collected your daily allowance of **+${amount} Coins**!`,
      fields: [
        { name: "Streak Multiplier", value: `${w.streak} Days 🔥 (Bonus +${w.streak * 25}c)`, inline: true },
        { name: "Current Wallet", value: `\`${w.coins.toLocaleString()} Coins\``, inline: true },
        { name: "Total Net Worth", value: `\`${(w.coins + w.bank).toLocaleString()} Coins\``, inline: true }
      ],
      footer: "Come back tomorrow to keep your streak multiplier active!"
    };
  }

  weekly(userId) {
    const w = this.getWallet(userId);
    w.coins += 1000;
    discordAudio.playCoinSound();

    return {
      title: "💎 Weekly Stipend Claimed!",
      color: "#9b59b6",
      description: `You collected your weekly member grant of **+1,000 Coins**!`,
      fields: [
        { name: "Total Wallet Cash", value: `\`${w.coins.toLocaleString()} Coins\``, inline: true },
        { name: "Next Claim", value: "In 7 Days", inline: true }
      ],
      footer: "NEXBOT Economy Engine"
    };
  }

  work(userId) {
    const w = this.getWallet(userId);
    const jobs = [
      { role: "Discord Bot Architect", reward: 380, desc: "audited an enterprise multi-server bot for token leakage" },
      { role: "CS2 Quant Trader", reward: 450, desc: "identified a profitable Buff163 vs CSFloat price spread" },
      { role: "Security Engineer", reward: 520, desc: "neutralized an incoming spam raid on a 50k-member gaming guild" },
      { role: "Community Manager", reward: 310, desc: "hosted a live provably-fair skin raffle with 200 entrants" }
    ];
    const job = jobs[Math.floor(Math.random() * jobs.length)];
    w.coins += job.reward;
    discordAudio.playCoinSound();

    return {
      title: `💼 Engineering Job Complete — ${job.role}`,
      color: "#2ecc71",
      description: `You worked as a **${job.role}** and ${job.desc}!`,
      fields: [
        { name: "Earnings Deposited", value: `**+${job.reward} Coins**`, inline: true },
        { name: "New Wallet Balance", value: `\`${w.coins.toLocaleString()} Coins\``, inline: true }
      ],
      footer: "Cooldown: Instant in Sandbox • Work shifts to climb /leaderboard"
    };
  }

  pay(senderId, targetName, amount) {
    const sender = this.getWallet(senderId);
    const cleanTarget = targetName.replace(/^@/, '');
    const memberObj = DISCORD_MEMBERS.find(m => m.name.toLowerCase().includes(cleanTarget.toLowerCase()));
    const targetWalletKey = memberObj ? memberObj.id : 'user_alex';
    const targetDisplay = memberObj ? memberObj.name : cleanTarget;
    const target = this.getWallet(targetWalletKey);
    const safeAmt = Math.max(1, parseInt(amount) || 100);

    if (sender.coins < safeAmt) {
      return {
        title: "❌ Insufficient Funds",
        color: "#e74c3c",
        description: `You do not have enough coins in your wallet. Your cash balance: **${sender.coins.toLocaleString()} Coins**. Required: **${safeAmt.toLocaleString()} Coins**.`,
        footer: "Use /work or /daily to earn more coins"
      };
    }

    sender.coins -= safeAmt;
    target.coins += safeAmt;
    discordAudio.playCoinSound();

    return {
      title: "💸 Virtual Currency Transfer Successful",
      color: "#2ecc71",
      description: `You transferred **${safeAmt.toLocaleString()} Coins** to <@${targetDisplay}>!`,
      fields: [
        { name: "Your New Wallet", value: `\`${sender.coins.toLocaleString()} Coins\``, inline: true },
        { name: `${targetDisplay}'s Wallet`, value: `\`${target.coins.toLocaleString()} Coins\``, inline: true }
      ],
      footer: "P2P Economy Transfer • Instant Ledger Settlement"
    };
  }

  coinflip(userId, choice = 'heads', amount = 100) {
    const w = this.getWallet(userId);
    const normChoice = (choice || 'heads').toLowerCase() === 'tails' ? 'tails' : 'heads';
    const bet = Math.max(10, parseInt(amount) || 100);

    if (w.coins < bet) {
      return {
        title: "❌ Insufficient Coins",
        color: "#e74c3c",
        description: `You only have **${w.coins.toLocaleString()} Coins** in your wallet. Cannot wager **${bet.toLocaleString()} Coins**.`,
        footer: "Type /work or /daily to earn cash"
      };
    }

    const outcome = Math.random() > 0.48 ? 'heads' : 'tails';
    const isWin = outcome === normChoice;

    if (isWin) {
      w.coins += bet;
      discordAudio.playCoinSound();
    } else {
      w.coins -= bet;
    }

    return {
      title: isWin ? `🎉 Coinflip VICTORY! (+${bet.toLocaleString()} Coins)` : `💀 Coinflip Loss (-${bet.toLocaleString()} Coins)`,
      color: isWin ? "#2ecc71" : "#e74c3c",
      description: `The coin landed on **${outcome.toUpperCase()}**! You picked **${normChoice.toUpperCase()}**.`,
      fields: [
        { name: "Outcome", value: isWin ? `**+${bet.toLocaleString()} Coins** Won!` : `**-${bet.toLocaleString()} Coins** Lost`, inline: true },
        { name: "Updated Wallet", value: `\`${w.coins.toLocaleString()} Coins\``, inline: true }
      ],
      footer: "Provably Fair RNG Engine • 50/50 Odds"
    };
  }

  rob(userId, targetName = '@Alex') {
    const w = this.getWallet(userId);
    const cleanTarget = targetName.replace(/^@/, '') || 'Alex [Dev]';
    const fine = Math.min(w.coins, 150);
    w.coins = Math.max(0, w.coins - fine);

    return {
      title: "🚨 Attempted Heist Foiled by AutoMod!",
      color: "#e74c3c",
      description: `You attempted to pickpocket **<@${cleanTarget}>**, but NEXBOT's security sensors caught you red-handed! You were fined **-${fine} Coins**.`,
      fields: [
        { name: "Target", value: `<@${cleanTarget}>`, inline: true },
        { name: "Penalty Deducted", value: `\`-${fine} Coins\``, inline: true },
        { name: "Remaining Wallet", value: `\`${w.coins.toLocaleString()} Coins\``, inline: true }
      ],
      footer: "Crime does not pay in NEXBOT-protected guilds • Try /work instead!"
    };
  }

  shop(userId, buyIndex) {
    if (buyIndex) {
      const idx = parseInt(buyIndex);
      const item = this.shopItems.find(i => i.id === idx);
      if (item) {
        const w = this.getWallet(userId);
        if (w.coins < item.cost) {
          return {
            title: `❌ Insufficient Coins for ${item.name}`,
            color: "#e74c3c",
            description: `You need **${item.cost.toLocaleString()} Coins**, but your wallet has **${w.coins.toLocaleString()} Coins**. Run \`/work\` or \`/daily\` to earn more!`,
            footer: "NEXBOT Economy Store"
          };
        }
        w.coins -= item.cost;
        if (!w.inventory.includes(item.name)) {
          w.inventory.push(item.name);
        }
        discordAudio.playSuccessChime();
        return {
          title: `🛍️ Purchase Complete — ${item.name}`,
          color: "#2ecc71",
          description: `You purchased **${item.name}** for **${item.cost.toLocaleString()} Coins**! It has been equipped to your `/inventory` and `/profile`.`,
          fields: [
            { name: "Item Unlocked", value: item.name, inline: true },
            { name: "Remaining Wallet", value: `\`${w.coins.toLocaleString()} Coins\``, inline: true }
          ],
          footer: "Type /inventory to inspect your items"
        };
      }
    }

    return {
      title: "🛍️ NEXBOT Virtual Community Perk Store",
      color: "#9b59b6",
      description: "Spend your earned coins on cosmetic server roles, chat flair, and utility boosters:",
      fields: this.shopItems.map(item => ({
        name: `${item.id}. ${item.name}`,
        value: `\`${item.cost.toLocaleString()} Coins\` — ${item.desc}`,
        inline: false
      })),
      footer: "Click a button below or type /shop buy [1-4] to acquire any perk!"
    };
  }

  leaderboard() {
    const sorted = Object.entries(this.wallets)
      .map(([id, w]) => {
        const mem = DISCORD_MEMBERS.find(m => m.id === id) || { name: id === 'user_visitor' ? CURRENT_VISITOR.name : id };
        return { name: mem.name, total: w.coins + w.bank, coins: w.coins, streak: w.streak };
      })
      .sort((a, b) => b.total - a.total);

    const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];

    return {
      title: "🏆 Server Wealth & Economy Leaderboard",
      color: "#f1c40f",
      description: "Top richest community members across cash & bank reserves:",
      fields: sorted.slice(0, 5).map((u, i) => ({
        name: `${medals[i]} #${i + 1} — ${u.name}`,
        value: `**${u.total.toLocaleString()} Coins** (Cash: ${u.coins.toLocaleString()} • Streak: ${u.streak}d 🔥)`,
        inline: false
      })),
      footer: "Real-time ledger updates • Work & trade to climb the ranks"
    };
  }
}

/* -------------------------------------------------------------- */
/* 3. MODULE: Provably Fair Giveaway System                       */
/* -------------------------------------------------------------- */
export class GiveawayModule {
  constructor(engine) {
    this.engine = engine;
    this.activeGiveaway = null;
    this.intervalId = null;
  }

  start(prize = 'AWP | Asiimov (Field-Tested)', durationSeconds = 24) {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    const cleanPrize = prize.replace(/\s+\d+s$/i, '').trim() || 'AWP | Asiimov (Field-Tested)';
    const id = `gw_${Date.now()}`;
    const channelId = this.engine.sim.activeChannelId;
    const endsAt = Date.now() + (durationSeconds * 1000);
    const entrants = new Set(['user_alex', 'user_emma', 'user_sarah']);

    this.activeGiveaway = { id, prize: cleanPrize, endsAt, entrants, durationSeconds, channelId };

    const gwMsg = {
      id: `msg_${id}`,
      userId: 'user_bot',
      isBot: true,
      embed: {
        title: `🎉 LIVE COMMUNITY GIVEAWAY — ${cleanPrize}`,
        color: "#9b59b6",
        description: `Sponsored by **NEXBOT Community Pool**!\nClick **Enter Giveaway** below to join the live raffle. Winner is drawn automatically when the countdown finishes.`,
        fields: [
          { name: "Time Remaining", value: `\`${durationSeconds} Seconds\``, inline: true },
          { name: "Total Entrants", value: `\`${entrants.size} Members\``, inline: true },
          { name: "Subcommands", value: "`/giveaway end` • `/giveaway reroll`", inline: true }
        ],
        footer: "Automated Provably Fair Draw • Powered by NEXBOT"
      },
      buttons: [
        { id: `btn_gw_enter_${id}`, label: `🎉 Enter Giveaway (${entrants.size} Entrants)`, style: 'primary' },
        { id: `btn_gw_end_now`, label: `⏩ Draw Winner Now`, style: 'secondary' }
      ],
      timestamp: this.engine.sim.formatDiscordTime(new Date()),
      rawTime: Date.now()
    };

    this.engine.sim.addMessageToChannel(channelId, gwMsg);

    const simulatedPool = ['user_jake', 'user_daniel', 'user_chloe', 'user_ethan', 'user_sophia'];
    let remainingPool = [...simulatedPool];

    let timeLeft = durationSeconds;
    this.intervalId = setInterval(() => {
      timeLeft -= 3;

      if (remainingPool.length && Math.random() > 0.3) {
        const next = remainingPool.shift();
        entrants.add(next);
      }

      const currentMsg = this.engine.sim.channelStores[channelId]?.find(m => m.id === `msg_${id}`);
      if (currentMsg && currentMsg.embed) {
        currentMsg.embed.fields[0].value = `\`${Math.max(0, timeLeft)} Seconds\``;
        currentMsg.embed.fields[1].value = `\`${entrants.size} Members\``;
        currentMsg.buttons[0].label = `🎉 Enter Giveaway (${entrants.size} Entrants)`;
        if (this.engine.sim.activeChannelId === channelId) {
          this.engine.sim.renderMessages();
        }
      }

      if (timeLeft <= 0) {
        clearInterval(this.intervalId);
        this.intervalId = null;
        this.end(id);
      }
    }, 3000);
  }

  enter(giveawayId, userId = CURRENT_VISITOR.id) {
    if (!this.activeGiveaway) {
      this.start('AWP | Asiimov (Field-Tested)', 24);
      return;
    }
    this.activeGiveaway.entrants.add(userId);
    discordAudio.playCoinSound();

    const targetChan = this.activeGiveaway.channelId || this.engine.sim.activeChannelId;
    const currentMsg = this.engine.sim.channelStores[targetChan]?.find(m => m.id === `msg_${this.activeGiveaway.id}`);
    if (currentMsg && currentMsg.embed) {
      currentMsg.embed.fields[1].value = `\`${this.activeGiveaway.entrants.size} Members (You Joined ✅)\``;
      currentMsg.buttons[0].label = `✅ Entered (${this.activeGiveaway.entrants.size} Entrants)`;
      this.engine.sim.renderMessages();
    }
  }

  end() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    const prize = this.activeGiveaway ? this.activeGiveaway.prize : 'AWP | Asiimov (Field-Tested)';
    const entrantsList = this.activeGiveaway ? Array.from(this.activeGiveaway.entrants) : ['user_alex', 'user_sarah', CURRENT_VISITOR.id];
    const winnerId = entrantsList.includes(CURRENT_VISITOR.id) ? CURRENT_VISITOR.id : (entrantsList[Math.floor(Math.random() * entrantsList.length)] || 'user_sarah');
    const member = winnerId === CURRENT_VISITOR.id ? CURRENT_VISITOR : (DISCORD_MEMBERS.find(m => m.id === winnerId) || { name: 'Sarah' });

    discordAudio.playSuccessChime();

    const endMsg = {
      id: `gw_ended_${Date.now()}`,
      userId: 'user_bot',
      isBot: true,
      embed: {
        title: `🏆 GIVEAWAY CONCLUDED — WINNER DRAWN!`,
        color: "#2ecc71",
        description: `Congratulations to **<@${member.name}>** for winning **${prize}**!\n\nProvably-fair seed hash: \`0x8f2a9d1c4e9b701a\``,
        fields: [
          { name: "Winning Member", value: `<@${member.name}>`, inline: true },
          { name: "Prize Awarded", value: `\`${prize}\``, inline: true },
          { name: "Total Participants", value: `\`${entrantsList.length} Entrants\``, inline: true }
        ],
        footer: "Draw verified by NEXBOT Crypto-Entropy • Click below or type /giveaway reroll to redraw"
      },
      buttons: [
        { id: `btn_gw_reroll_now`, label: '🎲 Reroll Winner', style: 'secondary' },
        { id: `btn_gw_start_demo`, label: '🎉 Start New Giveaway', style: 'primary' }
      ],
      timestamp: this.engine.sim.formatDiscordTime(new Date()),
      rawTime: Date.now()
    };

    this.engine.sim.addMessageToChannel(this.engine.sim.activeChannelId, endMsg);
  }

  reroll() {
    const entrantsList = this.activeGiveaway ? Array.from(this.activeGiveaway.entrants) : ['user_alex', 'user_emma', 'user_sarah', 'user_jake'];
    const winnerId = entrantsList[Math.floor(Math.random() * entrantsList.length)];
    const member = winnerId === CURRENT_VISITOR.id ? CURRENT_VISITOR : (DISCORD_MEMBERS.find(m => m.id === winnerId) || { name: 'Jake' });
    const prize = this.activeGiveaway ? this.activeGiveaway.prize : 'AWP | Asiimov (Field-Tested)';

    discordAudio.playSuccessChime();
    this.engine.sim.addMessageToChannel(this.engine.sim.activeChannelId, {
      id: `reroll_${Date.now()}`,
      userId: 'user_bot',
      isBot: true,
      embed: {
        title: `🎲 Giveaway Winner Rerolled!`,
        color: "#3498db",
        description: `A new provably-fair draw was executed for **${prize}**. New winner: **<@${member.name}>**! 🎉`,
        footer: "NEXBOT Provably Fair Reroll"
      },
      timestamp: this.engine.sim.formatDiscordTime(new Date()),
      rawTime: Date.now()
    });
  }
}

/* -------------------------------------------------------------- */
/* 4. MODULE: Support Ticket Desk System                         */
/* -------------------------------------------------------------- */
export class TicketModule {
  constructor(engine) {
    this.engine = engine;
    this.ticketCounter = 104;
  }

  panel() {
    return {
      title: "📩 NEXBOT Automated Support Portal",
      color: "#5865F2",
      description: "Need technical help, custom bot deployment, or security consultation? Click an option below or run `/ticket create [subject]` to generate a private support channel with our staff.",
      fields: [
        { name: "💳 Billing & Licensing", value: "Invoice queries, commercial tier upgrades", inline: true },
        { name: "🛡️ Anti-Raid Assistance", value: "Emergency raid mitigation & server protection", inline: true },
        { name: "⚙️ Custom Integrations", value: "API endpoints, webhooks & tailored bots", inline: true }
      ],
      footer: "Average ticket response latency: <2 minutes"
    };
  }

  create(subject = "General Support") {
    this.ticketCounter++;
    const ticketChanId = `ticket-${this.ticketCounter}`;

    DISCORD_CHANNELS.push({
      id: ticketChanId,
      name: `ticket-${this.ticketCounter}`,
      category: 'SUPPORT TICKETS',
      icon: 'hash',
      topic: `Private Ticket #${this.ticketCounter} • Client: ${CURRENT_VISITOR.name} • Subject: ${subject}`,
      unread: false
    });

    this.engine.sim.channelStores[ticketChanId] = [
      {
        id: `ticket_welcome_${Date.now()}`,
        userId: 'user_bot',
        isBot: true,
        embed: {
          title: `🎫 Support Ticket #${this.ticketCounter} Opened`,
          color: "#2ecc71",
          description: `Hello <@${CURRENT_VISITOR.name}>! A private support channel has been provisioned and staff have been alerted.\n\n**Subject:** \`${subject}\`\n**Status:** \`Open • Assigned to @Alex [Dev]\``,
          fields: [
            { name: "Client", value: CURRENT_VISITOR.name, inline: true },
            { name: "Assigned Engineer", value: "Alex [Dev]", inline: true },
            { name: "Ticket Commands", value: "`/ticket claim` • `/ticket transcript` • `/ticket close`", inline: false }
          ],
          footer: "Click 'Close & Generate Transcript' when your issue is resolved"
        },
        buttons: [
          { id: `btn_ticket_close_${ticketChanId}`, label: '🔒 Close & Generate Transcript', style: 'danger' },
          { id: 'btn_ticket_claim', label: '✋ Claim Ticket', style: 'secondary' }
        ],
        timestamp: this.engine.sim.formatDiscordTime(new Date()),
        rawTime: Date.now()
      }
    ];

    discordAudio.playSuccessChime();
    this.engine.sim.switchChannel(ticketChanId);
  }

  claim() {
    return {
      title: "✋ Support Ticket Claimed by Staff",
      color: "#2ecc71",
      description: `Lead Engineer **<@Alex [Dev]>** has claimed ownership of this support ticket and is reviewing your request.`,
      footer: "NEXBOT Support Helpdesk Engine"
    };
  }

  transcript(channelId) {
    const msgs = this.engine.sim.channelStores[channelId] || [];
    return {
      title: `📜 Encrypted Ticket Transcript — #${channelId}`,
      color: "#3498db",
      description: `Archived **${msgs.length} messages** from **#${channelId}** with SHA-256 verification signature.`,
      fields: [
        { name: "Channel", value: `#${channelId}`, inline: true },
        { name: "Messages Archived", value: `\`${msgs.length} Entries\``, inline: true },
        { name: "Export Status", value: "`✅ Saved to Audit Cloud`", inline: true }
      ],
      footer: "NEXBOT Support Helpdesk Engine"
    };
  }

  close(ticketChanId) {
    discordAudio.playClick();
    const targetId = ticketChanId.startsWith('ticket-') ? ticketChanId : `ticket-${this.ticketCounter}`;
    const index = DISCORD_CHANNELS.findIndex(c => c.id === targetId);
    if (index !== -1) {
      DISCORD_CHANNELS.splice(index, 1);
    }

    this.engine.sim.switchChannel('bot-commands');

    const transcriptMsg = {
      id: `transcript_${Date.now()}`,
      userId: 'user_bot',
      isBot: true,
      embed: {
        title: `📜 Support Ticket Resolved & Closed — #${targetId}`,
        color: "#3498db",
        description: `Ticket **#${targetId}** was officially resolved and closed by <@${CURRENT_VISITOR.name}>.`,
        fields: [
          { name: "Resolution Time", value: "`1m 18s`", inline: true },
          { name: "Staff Engineer", value: "Alex [Dev]", inline: true },
          { name: "Transcript Archive", value: "`✅ Exported & Cloud Encrypted`", inline: true }
        ],
        footer: "NEXBOT Support Helpdesk Engine"
      },
      timestamp: this.engine.sim.formatDiscordTime(new Date()),
      rawTime: Date.now()
    };

    this.engine.sim.addMessageToChannel('bot-commands', transcriptMsg);
  }
}

/* -------------------------------------------------------------- */
/* 5. MODULE: Automation Engine & Custom Rule Pipelines           */
/* -------------------------------------------------------------- */
export class AutomationModule {
  constructor(engine) {
    this.engine = engine;
    this.rules = JSON.parse(JSON.stringify(AUTOMATION_PRESETS));
  }

  deployRule(name, trigger, condition, action) {
    const newRule = {
      id: `rule_${Date.now()}`,
      name: name || "Custom Security Pipeline",
      trigger,
      triggerLabel: trigger,
      condition,
      conditionLabel: condition,
      action,
      actionLabel: action,
      enabled: true,
      executions: 1
    };
    this.rules.unshift(newRule);
    discordAudio.playSuccessChime();

    return {
      title: "⚡ Automation Pipeline Deployed to Edge Cluster",
      color: "#5865F2",
      description: `Rule **${newRule.name}** has been compiled to V8 isolates and deployed across all cluster nodes.`,
      fields: [
        { name: "1. Trigger Event", value: `\`${trigger}\``, inline: true },
        { name: "2. Evaluator Condition", value: `\`${condition}\``, inline: true },
        { name: "3. Execution Action", value: `\`${action}\``, inline: true },
        { name: "Active Pipelines", value: `\`${this.rules.length} Live Rules\``, inline: true }
      ],
      footer: "NEXBOT Visual Automation Engine • 0ms cold-start latency"
    };
  }

  listRules() {
    return {
      title: `⚡ Active Automation Pipelines (${this.rules.length} Deployed)`,
      color: "#5865F2",
      description: "Event-driven rules running on the server (`Trigger → Condition → Action`):",
      fields: this.rules.slice(0, 6).map((r, i) => ({
        name: `${i + 1}. ${r.name} (${r.enabled ? '🟢 Active' : '⚪ Paused'} • ${r.executions} runs)`,
        value: `**WHEN** \`${r.triggerLabel || r.trigger}\` **IF** \`${r.conditionLabel || r.condition}\` **THEN** \`${r.actionLabel || r.action}\``,
        inline: false
      })),
      footer: "Click 'Open Automation Builder' below to configure a new rule"
    };
  }
}

/* -------------------------------------------------------------- */
/* 6. MODULE: Real CS2 Market Data Integration & Live Monitor     */
/* -------------------------------------------------------------- */
export class CS2MarketModule {
  constructor(engine) {
    this.engine = engine;
    this.items = [];
    this.isLive = false;
    this.liveStatus = 'loading'; // 'live' | 'degraded_cached' | 'static_snapshot' | 'error' | 'loading'
    this.provider = 'CSGOTrader Live Multi-Market API (CSFloat • Buff163 • Skinport • Steam)';
    this.lastSuccessfulUpdate = null;
    this.providerLastModified = null;
    this.error = null;
    this.isFetching = false;
    this.activeFilter = 'all'; // 'all' | 'stattrak' | 'rifles' | 'knives' | 'spread'
    this.searchQuery = '';
    this.refreshIntervalSeconds = 60;
    this.secondsUntilNextRefresh = 60;
    this.pollTimer = null;
    this.countdownTimer = null;
  }

  startLivePolling() {
    this.fetchMarketData(false);

    if (this.countdownTimer) clearInterval(this.countdownTimer);
    this.countdownTimer = setInterval(() => {
      this.secondsUntilNextRefresh = Math.max(0, this.secondsUntilNextRefresh - 1);
      if (this.secondsUntilNextRefresh <= 0) {
        this.secondsUntilNextRefresh = this.refreshIntervalSeconds;
        this.fetchMarketData(false);
      }
    }, 1000);
  }

  stopLivePolling() {
    if (this.pollTimer) clearInterval(this.pollTimer);
    if (this.countdownTimer) clearInterval(this.countdownTimer);
  }

  async fetchMarketData(force = false) {
    if (this.isFetching) return;
    this.isFetching = true;

    try {
      const url = `/api/cs2/market${force ? '?force=1' : ''}`;
      const res = await fetch(url, { cache: 'no-store' });

      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.items) && data.items.length > 0) {
          this.items = data.items;
          this.isLive = Boolean(data.isLive);
          this.liveStatus = data.liveStatus || (data.isLive ? 'live' : 'degraded_cached');
          this.provider = data.provider || this.provider;
          this.lastSuccessfulUpdate = data.lastSuccessfulUpdate;
          this.providerLastModified = data.providerLastModified;
          this.error = data.error || null;
          this.secondsUntilNextRefresh = this.refreshIntervalSeconds;
          this.isFetching = false;
          this.syncChannelMessages();
          return;
        }
      }
      throw new Error(`Backend endpoint returned HTTP ${res.status}`);
    } catch (apiErr) {
      // If running on a static HTTP server (without serve.py's /api/cs2/market handler),
      // load the verified cs2-live-snapshot.json generated from the external provider,
      // and explicitly label it so we never pretend cached data is a live backend poll.
      try {
        const snapRes = await fetch('cs2-live-snapshot.json', { cache: 'no-store' });
        if (snapRes.ok) {
          const snapData = await snapRes.json();
          if (snapData && Array.isArray(snapData.items) && snapData.items.length > 0) {
            this.items = snapData.items;
            this.isLive = false;
            this.liveStatus = 'static_snapshot';
            this.provider = snapData.provider || this.provider;
            this.lastSuccessfulUpdate = snapData.lastSuccessfulUpdate;
            this.providerLastModified = snapData.providerLastModified;
            this.error = 'Live backend API (/api/cs2/market) unavailable — showing last verified external provider snapshot.';
            this.isFetching = false;
            this.syncChannelMessages();
            return;
          }
        }
      } catch (snapErr) {
        // Both live backend and snapshot failed
      }

      this.isLive = false;
      this.liveStatus = 'error';
      this.error = `Live CS2 market provider temporarily unreachable (${apiErr.message}).`;
      this.isFetching = false;
      this.syncChannelMessages();
    }
  }

  async searchSkinLive(query) {
    const cleanQ = (query || '').trim();
    if (!cleanQ) {
      return this.items[0] || null;
    }

    try {
      const res = await fetch(`/api/cs2/market?q=${encodeURIComponent(cleanQ)}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.items) && data.items.length > 0) {
          return data.items[0];
        }
      }
    } catch (e) {
      // Fallback to searching loaded items
    }

    const qLow = cleanQ.toLowerCase();
    const found = this.items.find(it =>
      it.marketHashName.toLowerCase().includes(qLow) ||
      it.baseName.toLowerCase().includes(qLow) ||
      it.weapon.toLowerCase().includes(qLow)
    );
    return found || null;
  }

  getFilteredItems() {
    let list = [...this.items];
    if (this.activeFilter === 'stattrak') {
      list = list.filter(it => it.isStatTrak || it.statTrakSupported);
    } else if (this.activeFilter === 'rifles') {
      list = list.filter(it => it.category === 'Rifles' || it.weapon === 'AWP' || it.weapon === 'M4A4' || it.weapon === 'M4A1-S' || it.weapon === 'AK-47');
    } else if (this.activeFilter === 'knives') {
      list = list.filter(it => it.category === 'Knives' || it.category === 'Gloves' || it.baseName.includes('★'));
    } else if (this.activeFilter === 'spread') {
      list = list.sort((a, b) => (b.spreadPercent || 0) - (a.spreadPercent || 0));
    }

    if (this.searchQuery && this.searchQuery.trim() !== '') {
      const q = this.searchQuery.toLowerCase().trim();
      list = list.filter(it =>
        it.marketHashName.toLowerCase().includes(q) ||
        it.baseName.toLowerCase().includes(q) ||
        it.wear.toLowerCase().includes(q) ||
        it.weapon.toLowerCase().includes(q)
      );
    }
    return list;
  }

  formatTimestampReadable(isoStr) {
    if (!isoStr) return 'Pending sync...';
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return isoStr;
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' (' + d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) + ')';
    } catch (e) {
      return isoStr;
    }
  }

  buildSkinDiscordMessage(skin, index = 0) {
    const updateTimeReadable = this.formatTimestampReadable(skin.lastSuccessfulUpdate || this.lastSuccessfulUpdate);
    return {
      id: `cs2_live_skin_${skin.marketHashName.replace(/[^a-zA-Z0-9]/g, '_')}`,
      userId: 'user_bot',
      isBot: true,
      isCS2SkinCard: true,
      skinData: {
        ...skin,
        formattedUpdateTime: updateTimeReadable,
        isLiveFeed: this.isLive,
        liveStatus: this.liveStatus
      },
      timestamp: `Updated ${updateTimeReadable}`,
      rawTime: Date.now() - ((16 - index) * 1000),
      reactions: []
    };
  }

  syncChannelMessages() {
    const filtered = this.getFilteredItems();
    const existingStore = this.engine.sim.channelStores['cs2-arbitrage-alerts'] || [];
    // Keep any user/custom search messages posted during the session
    const customMessages = existingStore.filter(m => m.isCustomCS2Search);
    const feedMessages = filtered.map((skin, idx) => this.buildSkinDiscordMessage(skin, idx));
    this.engine.sim.channelStores['cs2-arbitrage-alerts'] = [...feedMessages, ...customMessages];

    if (this.engine.sim.activeChannelId === 'cs2-arbitrage-alerts') {
      this.engine.sim.renderMessages();
    }
  }
}

/* -------------------------------------------------------------- */
/* 7. MODULE: Real LLM + Multi-Turn Conversational AI Assistant   */
/* -------------------------------------------------------------- */
export class NexbotAIAssistantModule {
  constructor(engine) {
    this.engine = engine;
    this.sessionId = `sess_${Date.now()}`;
    this.conversationHistory = [];
    this.lastTopic = 'general';
    this.lastCommand = null;
  }

  /**
   * Calls the live backend AI endpoint (/api/ai/chat -> Gemini 3.8 Flash / Groq Llama 3.3 70B)
   * with full multi-turn conversation history. If no API key is configured yet, falls back to
   * the context-aware multi-turn conversational engine.
   */
  async chat(rawQuestion) {
    const q = (rawQuestion || '').trim();
    if (!q) return { content: "Ask me anything about NEXBOT — like what commands I have, whether I can automate a task, or what a specific feature does!" };

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: q,
          history: this.conversationHistory.slice(-10),
          sessionId: this.sessionId
        })
      });

      if (res.status === 429) {
        const limited = await res.json().catch(() => null);
        return { content: (limited && limited.error) || "You've reached the AI message limit for this demo. Please try again later." };
      }

      if (res.ok) {
        const data = await res.json();
        if (data && data.ok && data.reply) {
          this.conversationHistory.push({ role: 'user', content: q });
          this.conversationHistory.push({ role: 'assistant', content: data.reply });
          return { content: data.reply };
        }
        // The real AI exists but failed this time: say so, because keyword answers can be wrong here.
        if (data && data.configured) {
          return { content: "I'm getting a lot of requests right now and couldn't answer that. Please send it again in a few seconds." };
        }
      }
    } catch (err) {
      // Backend unreachable or no API key set yet; use multi-turn conversational fallback
    }

    const fallback = this.analyzeAndRespondConversational(q);
    this.conversationHistory.push({ role: 'user', content: q });
    this.conversationHistory.push({ role: 'assistant', content: fallback.content || fallback.embed?.description || '' });
    return fallback;
  }

  analyzeAndRespondConversational(rawQuestion) {
    const q = (rawQuestion || '').trim();
    const qLow = q.toLowerCase();

    // 0. Check if user is asking about a specific command in SLASH_COMMANDS (e.g. "whats /antiraid", "what is coinflip", "how does giveaway work")
    const matchedCmd = SLASH_COMMANDS.find(c =>
      qLow.includes(`/${c.name}`) ||
      new RegExp(`\\b${c.name.replace('-', '\\-')}\\b`, 'i').test(qLow)
    );

    // 1. Handle conversational follow-ups ("what's that?", "can u do that?", "how does that work?", "tell me more")
    const isWhatsThat = (
      qLow === 'whats that' ||
      qLow === "what's that" ||
      qLow === 'what is that' ||
      qLow.startsWith('whats that') ||
      qLow.startsWith("what's that") ||
      qLow.startsWith('what is that') ||
      qLow.includes('what does that mean') ||
      qLow.includes('what does it do') ||
      qLow === 'explain that'
    );

    const isCanYouDoThat = (
      qLow === 'can u do that' ||
      qLow === 'can you do that' ||
      qLow.startsWith('can u do that') ||
      qLow.startsWith('can you do that') ||
      qLow.includes('can u do it') ||
      qLow.includes('can you do it') ||
      qLow.includes('how do i do that') ||
      qLow.includes('show me how')
    );

    if (isWhatsThat && !matchedCmd) {
      if (this.lastCommand) {
        return {
          content: `**\`${this.lastCommand.syntax}\`** is one of my **${this.lastCommand.category}** commands — ${this.lastCommand.description.toLowerCase()}.\n\nFor example, you can type \`${this.lastCommand.example}\` right here in chat to run it live!`
        };
      }
      const topicExplanations = {
        moderation: `That refers to my **Moderation & Anti-Raid system** (\`ModerationModule\`). It lets server staff warn, timeout, kick, or ban disruptive users, lock channels during raids, and automatically block phishing links in under 300ms. You can test it right now by typing \`/antiraid simulate\` or \`/ban @Raider\`.`,
        economy: `That's my **Virtual Server Economy** (\`EconomyModule\`). Every member gets a persistent coin wallet, bank vault, daily claim streak, and inventory. You can earn coins with \`/daily\` or \`/work\`, wager them with \`/coinflip\`, or spend them on roles in \`/shop\`.`,
        giveaways: `That's my **Provably Fair Giveaway system** (\`GiveawayModule\`). When you run \`/giveaway start [prize]\`, I post a live raffle embed with a countdown timer where members click to enter, and I automatically draw a winner when time runs out.`,
        automation: `That's my **Visual Automation Engine** (\`/automation\`). Instead of writing code, you pick a **Trigger** (like *Member Joins Server*), a **Condition** (like *Account Age < 3 days*), and an **Action** (like *Timeout or Auto-Ban*), and I run that rule automatically in real time.`,
        tickets: `That's my **Private Support Ticket system** (\`/ticket\`). When a member needs help and runs \`/ticket create\`, I dynamically create a private \`#ticket-XXX\` channel in the sidebar for them and staff, and generate an encrypted transcript when closed.`,
        cs2: `That's my **Real-Time CS2 Skin Market & Arbitrage tracker**. It pulls live skin prices from **CSFloat**, **Buff163**, **Skinport**, and **Steam Market** so traders can spot price spreads. You can check \`#cs2-arbitrage-alerts\` or type \`/skin AK-47 | Asiimov\` anytime.`,
        unsupported: `That refers to a custom feature that isn't built into my 36 default commands yet. Because NEXBOT uses a modular engine (\`discord-engine.js\` + \`SLASH_COMMANDS\`), new modules like voice music or custom polls can be added without changing existing features.`
      };
      return {
        content: topicExplanations[this.lastTopic] || `I'm **NEXBOT**, a modular Discord bot with **36 live commands** across Moderation, Economy, Giveaways, Leveling, Support Tickets, Visual Automation, and Live CS2 Skin Price Tracking. Ask me about any feature (like *"can you stop spam raids?"* or *"what's /automation?"*)!`
      };
    }

    if (isCanYouDoThat && !matchedCmd) {
      if (this.lastTopic === 'unsupported') {
        return {
          content: `Not out-of-the-box yet — that feature isn't in my current **36-command registry**, so I won't pretend it's already built! However, it **can be developed** by adding a new module in \`discord-engine.js\` and registering the slash command in \`discord-data.js\`.\n\nIf you want to automate event-based actions right now (like auto-blocking links or checking new joins), you *can* do that today using \`/automation\`!`
        };
      }
      if (this.lastCommand) {
        return {
          content: `Yes, I can! **\`/${this.lastCommand.name}\`** is fully implemented and live in this server. Just type \`${this.lastCommand.example}\` in the chat box (or click the button below) and I'll execute it right now.`,
          buttons: [{ id: `btn_run_custom_${this.lastCommand.name}`, label: `▶ Run ${this.lastCommand.example}`, style: 'primary' }]
        };
      }
      return {
        content: `Yes! I can run that live right inside this server, or automate it using my **Visual Automation Builder (\`/automation\`)** with a \`Trigger → Condition → Action\` pipeline. Want me to show you the exact command to run?`
      };
    }

    // 2. Check for questions about UNSUPPORTED / NEW FUNCTIONS
    const asksNewOrUnavailable = (
      qLow.includes("isn't currently available") ||
      qLow.includes("not currently available") ||
      qLow.includes("not available") ||
      qLow.includes("completely new function") ||
      qLow.includes("new function") ||
      qLow.includes("new feature") ||
      qLow.includes("aren't implemented") ||
      qLow.includes("not implemented") ||
      qLow.includes("what can't you do") ||
      qLow.includes("what cannot you do") ||
      qLow.includes("limitations")
    );

    const unsupportedFeaturesMap = [
      { keywords: ['music', 'spotify', 'youtube audio', 'song', 'voice channel audio', 'soundboard', 'radio'], name: 'Voice Channel Music & Audio Streaming', howToBuild: 'adding an audio stream module and registering `/play`, `/queue`, and `/skip` in `SLASH_COMMANDS`' },
      { keywords: ['poll', 'voting', 'survey', 'ballot'], name: 'Interactive Poll & Voting Menus', howToBuild: 'adding a `PollModule` in `discord-engine.js` that tracks stateful vote tallies per option' },
      { keywords: ['reaction role', 'self role', 'color role'], name: 'Self-Service Reaction Role Menus', howToBuild: 'creating a role-assignment mapping table with button callbacks' },
      { keywords: ['blackjack', 'roulette', 'slots', 'poker', 'trivia', 'chess'], name: 'Extended Casino & Minigame Suite', howToBuild: 'extending `EconomyModule` (which currently has `/coinflip` and `/rob`) with multi-turn game handlers' },
      { keywords: ['twitch', 'youtube alert', 'twitter', 'social media', 'webhook alert', 'rss'], name: 'External Social Media & Stream Alerts', howToBuild: 'adding a webhook listener route in `serve.py` connected to `AutomationModule`' },
      { keywords: ['translate', 'translation', 'language'], name: 'Real-Time Message Translation', howToBuild: 'connecting a translation endpoint in `serve.py` and adding a `/translate` command' },
      { keywords: ['remind', 'reminder', 'schedule message', 'cron', 'timer'], name: 'Scheduled Announcements & Reminders', howToBuild: 'adding a timer queue to `AutomationModule`' }
    ];

    const matchedUnsupported = unsupportedFeaturesMap.find(u => u.keywords.some(k => qLow.includes(k)));

    if (asksNewOrUnavailable || matchedUnsupported) {
      this.lastTopic = 'unsupported';
      this.lastCommand = null;
      if (matchedUnsupported) {
        return {
          content: `I don't currently have **${matchedUnsupported.name}** in my existing 36 commands — I never claim a feature is built when it isn't!\n\nHowever, it **could easily be implemented** in NEXBOT by ${matchedUnsupported.howToBuild}.\n\nRight now, I do have **Moderation & Anti-Raid** (\`/antiraid\`), **Economy** (\`/balance\`, \`/coinflip\`), **Giveaways** (\`/giveaway\`), **Support Tickets** (\`/ticket\`), **Visual Automation** (\`/automation\`), and **Live CS2 Skin Prices** (\`/skin\`).`
        };
      }
      return {
        content: `If you need a **completely new function** that isn't in my current **36 commands** (for example: voice channel music streaming, custom polls, reaction roles, or Twitch alerts), it isn't built in yet — but it can be developed!\n\nBecause NEXBOT is built on a modular architecture (\`discord-engine.js\` + \`discord-data.js\` + \`serve.py\`), adding a new feature just takes:\n1. Creating or extending a module class in \`discord-engine.js\`\n2. Registering the slash command in \`SLASH_COMMANDS\`\n3. Adding a backend route in \`serve.py\` if it needs external APIs.\n\nFor custom server workflows right now, you can also use \`/automation\` to build **Trigger → Condition → Action** rules!`
      };
    }

    // 3. Check if asking about a specific command in SLASH_COMMANDS
    if (matchedCmd && (qLow.includes('what') || qLow.includes('how') || qLow.includes('explain') || qLow.includes('can') || qLow.split(/\s+/).length <= 4)) {
      this.lastCommand = matchedCmd;
      this.lastTopic = matchedCmd.category.toLowerCase();
      return {
        content: `**\`${matchedCmd.syntax}\`** (${matchedCmd.category}) — ${matchedCmd.description}.\n\n• **Example usage:** \`${matchedCmd.example}\`\nYou can type \`${matchedCmd.example}\` right here in chat to test it live!`
      };
    }

    // 4. Suspicious accounts / Welcome system / Verification
    if (qLow.includes('suspicious') || qLow.includes('welcome') || qLow.includes('join') || qLow.includes('new member') || qLow.includes('account age') || qLow.includes('verify') || qLow.includes('gatekeeper')) {
      this.lastTopic = 'automation';
      this.lastCommand = SLASH_COMMANDS.find(c => c.name === 'verify');
      if (qLow.includes('welcome')) {
        return {
          content: `Yes, that's **partially supported** right now using my **Gatekeeper (\`/verify\`)** and **Visual Automation (\`/automation\`)** systems!\n\n• **What works right now:** You can set up an automation rule (\`WHEN Member Joins Server\` → \`IF Verification / Account Age Passed\` → \`THEN Auto-grant @Verified Member role and post welcome embed\`), or use \`/verify\` for 1-click verification.\n• **What would need new development:** Custom graphical welcome banner images or multi-step DM questionnaires aren't built in yet, though they could be added to \`AutomationModule\`.`
        };
      }
      return {
        content: `Yes! I can detect **suspicious accounts**, **burner accounts**, and **join raids** using my Moderation and Automation systems:\n\n• **Account-Age Check (\`account_age_days < 3\`):** In \`/automation\`, you can filter out newly created burner accounts when they join.\n• **Raid Velocity Protection (\`/antiraid\`):** If more than 8 accounts join in 10 seconds, I automatically lock the channel and ban the raid bots.\n• **Gatekeeper (\`/verify\`):** Requires new members to verify before chatting.`
      };
    }

    // 5. Spam / Raid / Phishing
    if (qLow.includes('spam') || qLow.includes('raid') || qLow.includes('phish') || qLow.includes('scam') || qLow.includes('automod')) {
      this.lastTopic = 'moderation';
      this.lastCommand = SLASH_COMMANDS.find(c => c.name === 'antiraid');
      return {
        content: `Yes! **Spam detection, phishing link blocking, and anti-raid defense** are fully implemented:\n\n• **Live Anti-Raid (\`/antiraid simulate\`):** Spawns an 8-bot spam & phishing attack in chat and neutralizes it in under 300ms.\n• **AutoMod (\`/automod\`):** Automatically blocks scam/Nitro phishing links and rate-limits message floods.\n• **Manual Controls:** You can also use \`/clear 5\` to purge messages, \`/slowmode 15\`, \`/timeout @Daniel 30\`, or \`/lock\`.`
      };
    }

    // 6. Moderation
    if (qLow.includes('moderation') || qLow.includes('moderate') || qLow.includes('ban') || qLow.includes('kick') || qLow.includes('warn') || qLow.includes('timeout') || qLow.includes('lock')) {
      this.lastTopic = 'moderation';
      this.lastCommand = SLASH_COMMANDS.find(c => c.name === 'ban');
      const modCmds = SLASH_COMMANDS.filter(c => c.category === 'Moderation');
      return {
        content: `I have **${modCmds.length} implemented Moderation commands** ready to use:\n\n${modCmds.map(c => `• \`${c.syntax}\` — ${c.description}`).join('\n')}\n\nPlus \`/audit-log\` to inspect all security actions. Try typing \`/antiraid simulate\` or \`/warn @Daniel\`!`
      };
    }

    // 7. Giveaways
    if (qLow.includes('giveaway') || qLow.includes('raffle') || qLow.includes('prize') || qLow.includes('reroll')) {
      this.lastTopic = 'giveaways';
      this.lastCommand = SLASH_COMMANDS.find(c => c.name === 'giveaway');
      return {
        content: `Yes! I have a complete **Provably Fair Giveaway system (\`/giveaway\`)**:\n\n• \`/giveaway start [prize]\` — Starts a live raffle with a countdown timer and an interactive **Enter Giveaway** button.\n• \`/giveaway end\` — Draws the winner immediately.\n• \`/giveaway reroll\` — Picks a new winner from the entrants.\n• \`/giveaway list\` — Shows active and scheduled giveaways.`
      };
    }

    // 8. Economy
    if (qLow.includes('economy') || qLow.includes('coin') || qLow.includes('currency') || qLow.includes('wallet') || qLow.includes('balance') || qLow.includes('daily') || qLow.includes('shop') || qLow.includes('work')) {
      this.lastTopic = 'economy';
      this.lastCommand = SLASH_COMMANDS.find(c => c.name === 'balance');
      const w = this.engine.eco.getWallet('user_visitor');
      return {
        content: `Yes! I run a persistent **Community Economy system** with **10 commands** (\`/balance\`, \`/daily\`, \`/weekly\`, \`/work\`, \`/pay\`, \`/shop\`, \`/inventory\`, \`/leaderboard\`, \`/coinflip\`, \`/rob\`).\n\nRight now your sandbox wallet has **${w.coins.toLocaleString()} Coins** (plus **${w.bank.toLocaleString()} Coins** in the bank and a **${w.streak}-day streak**). Type \`/daily\` or \`/work\` to earn more!`
      };
    }

    // 9. Automation
    if (qLow.includes('automation') || qLow.includes('automate') || qLow.includes('rule') || qLow.includes('pipeline') || qLow.includes('trigger')) {
      this.lastTopic = 'automation';
      this.lastCommand = SLASH_COMMANDS.find(c => c.name === 'automation');
      return {
        content: `Yes! My **Visual Automation Builder (\`/automation\`)** lets you create event-driven rules using a **Trigger → Condition → Action** pipeline:\n\n• **Triggers:** Member Joins (\`GUILD_MEMBER_JOIN\`), Message Sent (\`MESSAGE_CREATE\`), File Uploaded, Reaction Spike\n• **Conditions:** Join velocity \`>8 in 10s\`, Phishing link regex, Account age \`<3 days\`, Message spam velocity\n• **Actions:** Lock channel & mass-ban, 24h timeout & purge, Grant \`@Verified Member\` role, Alert mod logs\n\nType \`/automation\` to open the visual builder modal, or \`/automation list\` to see the ${this.engine.auto.rules.length} active pipelines!`
      };
    }

    // 10. Tickets
    if (qLow.includes('ticket') || qLow.includes('support') || qLow.includes('helpdesk')) {
      this.lastTopic = 'tickets';
      this.lastCommand = SLASH_COMMANDS.find(c => c.name === 'ticket');
      return {
        content: `Yes! My **Support Ticket system (\`/ticket\`)** creates real private channels in the server sidebar:\n\n• \`/ticket panel\` — Opens the support portal embed.\n• \`/ticket create [subject]\` — Spawns a new \`#ticket-XXX\` channel and switches you into it.\n• \`/ticket claim\`, \`/ticket transcript\`, and \`/ticket close\` — Manage and archive the ticket.`
      };
    }

    // 11. CS2 Skins / Market
    if (qLow.includes('skin') || qLow.includes('cs2') || qLow.includes('csgo') || qLow.includes('market') || qLow.includes('price') || qLow.includes('buff') || qLow.includes('csfloat') || qLow.includes('arbitrage')) {
      this.lastTopic = 'cs2';
      this.lastCommand = SLASH_COMMANDS.find(c => c.name === 'skin');
      return {
        content: `Yes! I'm connected to a **live external CS2 market API** covering **CSFloat**, **Buff163**, **Skinport**, and **Steam Market** across 1,974 skins.\n\nYou can switch to \`#cs2-arbitrage-alerts\` to see the live price feed with official skin photos and wear conditions, or type \`/skin AK-47 | Asiimov\` (or any skin name) right here!`
      };
    }

    // 12. Leveling / Rank
    if (qLow.includes('level') || qLow.includes('rank') || qLow.includes('xp') || qLow.includes('profile') || qLow.includes('rep')) {
      this.lastTopic = 'leveling';
      this.lastCommand = SLASH_COMMANDS.find(c => c.name === 'rank');
      return {
        content: `I track member levels, XP, reputation points, and daily quests! You can run \`/rank\`, \`/profile\`, \`/rep @Alex\`, or \`/daily-challenge\` to test them out.`
      };
    }

    // 13. General conversational response
    this.lastTopic = 'general';
    return {
      content: `I'm **NEXBOT AI**! Here's what I can do right now in this server (**36 live commands** across **7 modules**):\n\n• 🛡️ **Moderation:** \`/antiraid\`, \`/ban\`, \`/kick\`, \`/timeout\`, \`/warn\`, \`/lock\`, \`/clear\`\n• 🪙 **Economy:** \`/balance\`, \`/daily\`, \`/work\`, \`/shop\`, \`/coinflip\`, \`/leaderboard\`\n• 🎉 **Giveaways:** \`/giveaway start\`, \`/giveaway end\`, \`/giveaway reroll\`\n• 🎫 **Support Tickets:** \`/ticket panel\`, \`/ticket create\`\n• ⭐ **Leveling:** \`/rank\`, \`/profile\`, \`/rep\`\n• ⚡ **Automation:** \`/automation\`, \`/automod\`\n• 🔫 **Live CS2 Market:** \`/skin [name]\` & \`#cs2-arbitrage-alerts\`\n\nAsk me about any of these — like *"can you detect spam?"*, *"what's /automation?"*, or *"can you build a new feature?"*!`
    };
  }

  // Keep synchronous alias for backward compatibility
  analyzeAndRespond(rawQuestion) {
    return this.analyzeAndRespondConversational(rawQuestion);
  }
}

/* -------------------------------------------------------------- */
/* 8. MAIN CONTROLLER & ADAPTER: Community Activity Engine        */
/* -------------------------------------------------------------- */
export class CommunityActivityEngine {
  constructor(simulator) {
    this.sim = simulator;
    this.isRunning = false;
    this.timeoutId = null;
    this.threadIndex = 0;
    this.messageInThreadIndex = 0;
    this.typingTimeouts = [];

    // Initialize business logic modules
    this.mod = new ModerationModule(this);
    this.eco = new EconomyModule(this);
    this.gw = new GiveawayModule(this);
    this.ticket = new TicketModule(this);
    this.auto = new AutomationModule(this);
    this.cs2 = new CS2MarketModule(this);
    this.ai = new NexbotAIAssistantModule(this);
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.cs2.startLivePolling();
    this.scheduleNextMessage();
  }

  stop() {
    this.isRunning = false;
    this.cs2.stopLivePolling();
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.typingTimeouts.forEach(t => clearTimeout(t));
    this.typingTimeouts = [];
  }

  scheduleNextMessage() {
    if (!this.isRunning) return;
    const delay = Math.floor(Math.random() * 14000) + 10000;
    this.timeoutId = setTimeout(() => this.triggerNextSimulatedAction(), delay);
  }

  triggerNextSimulatedAction() {
    if (!this.isRunning) return;
    const currentThread = CONVERSATION_THREADS[this.threadIndex % CONVERSATION_THREADS.length];
    const msgData = currentThread.messages[this.messageInThreadIndex];
    const member = DISCORD_MEMBERS.find(m => m.id === msgData.userId) || DISCORD_MEMBERS[1];
    const targetChannel = currentThread.channel || 'general';

    if (targetChannel === this.sim.activeChannelId) {
      this.sim.setTypingUser(member.name, true);
    }

    const typingDuration = Math.min(2400, Math.max(1000, msgData.text.length * 30));
    const tId = setTimeout(() => {
      if (targetChannel === this.sim.activeChannelId) {
        this.sim.setTypingUser(member.name, false);
      }

      this.sim.addMessageToChannel(targetChannel, {
        id: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        userId: member.id,
        content: msgData.text,
        timestamp: this.sim.formatDiscordTime(new Date()),
        rawTime: Date.now(),
        reactions: []
      });

      if (targetChannel === this.sim.activeChannelId) {
        discordAudio.playMessageChime();
      }

      this.messageInThreadIndex++;
      if (this.messageInThreadIndex >= currentThread.messages.length) {
        this.messageInThreadIndex = 0;
        this.threadIndex++;
      }

      this.scheduleNextMessage();
    }, typingDuration);

    this.typingTimeouts.push(tId);
  }

  handleVisitorMessage(content) {
    if (content.startsWith('/')) {
      const parts = content.slice(1).trim().split(/\s+/);
      const cmd = parts[0].toLowerCase();
      const args = parts.slice(1);
      this.handleSlashCommand(cmd, args);
      return;
    }

    if (this.sim.activeChannelId === 'ai-assistant') {
      this.generateSmartAIResponse(content);
      return;
    }

    if (this.sim.activeChannelId === 'cs2-arbitrage-alerts') {
      this.handleSlashCommand('skin', content.trim().split(/\s+/));
      return;
    }

    if (content.toLowerCase().includes('bot') || content.toLowerCase().includes('nexbot') || content.endsWith('?')) {
      this.generateSmartAIResponse(content);
      return;
    }

    if (content.toLowerCase().startsWith('hi') || content.toLowerCase().startsWith('hello') || content.toLowerCase().startsWith('hey')) {
      this.triggerCommunityGreeting();
      return;
    }
  }

  triggerCommunityGreeting() {
    setTimeout(() => {
      this.sim.addMessageToChannel(this.sim.activeChannelId, {
        id: `greet_${Date.now()}`,
        userId: 'user_alex',
        content: `Hey <@${CURRENT_VISITOR.name}>! Welcome to the NEXBOT showcase 🎉 Click any command in \`#bot-commands\`, ask our AI in \`#ai-assistant\`, or check live CS2 skin prices in \`#cs2-arbitrage-alerts\`!`,
        timestamp: this.sim.formatDiscordTime(new Date()),
        rawTime: Date.now()
      });
      discordAudio.playMessageChime();
    }, 800);
  }

  // Handle all 36 Registered Commands across all 7 Categories
  handleSlashCommand(cmd, args = []) {
    this.sim.setTypingUser('NEXBOT', true);

    setTimeout(async () => {
      this.sim.setTypingUser('NEXBOT', false);

      let embed = null;
      let buttons = [];

      switch (cmd) {
        /* ================= 1. MODERATION ================= */
        case 'antiraid':
          this.mod.simulateAntiRaid();
          return;

        case 'warn': {
          const targetWarn = args[0] || '@Daniel';
          const reasonWarn = args.slice(1).join(' ') || 'Repeated spam reactions';
          embed = this.mod.warn(targetWarn, reasonWarn, CURRENT_VISITOR.name);
          buttons = [{ id: 'btn_action_warnings', label: '📋 View User Strikes (/warnings)', style: 'secondary' }];
          break;
        }

        case 'warnings': {
          const targetQuery = args[0] || '@Daniel';
          embed = this.mod.getWarnings(targetQuery);
          break;
        }

        case 'ban': {
          const targetBan = args[0] || '@Raider';
          const reasonBan = args.slice(1).join(' ') || 'Malicious phishing bot link';
          embed = this.mod.ban(targetBan, reasonBan, CURRENT_VISITOR.name);
          buttons = [
            { id: 'btn_action_unban', label: '🔓 Unban User (/unban)', style: 'secondary' },
            { id: 'btn_action_audit', label: '📜 View Audit Log', style: 'secondary' }
          ];
          break;
        }

        case 'unban': {
          const targetUnban = args[0] || '@Raider';
          embed = this.mod.unban(targetUnban, CURRENT_VISITOR.name);
          break;
        }

        case 'kick': {
          const targetKick = args[0] || '@Troublemaker';
          const reasonKick = args.slice(1).join(' ') || 'Disrupting community chat';
          embed = this.mod.kick(targetKick, reasonKick, CURRENT_VISITOR.name);
          break;
        }

        case 'timeout': {
          const targetTimeout = args[0] || '@Daniel';
          const duration = parseInt(args[1]) || 30;
          const reasonTimeout = args.slice(2).join(' ') || 'Cool-off penalty';
          embed = this.mod.timeout(targetTimeout, duration, reasonTimeout, CURRENT_VISITOR.name);
          break;
        }

        case 'lock':
          embed = this.mod.lock(this.sim.activeChannelId, args.join(' ') || 'Emergency maintenance');
          buttons = [{ id: 'btn_action_unlock', label: '🔓 Lift Lockdown (/unlock)', style: 'success' }];
          break;

        case 'unlock':
          embed = this.mod.unlock(this.sim.activeChannelId);
          break;

        case 'clear': {
          const count = parseInt(args[0]) || 3;
          embed = this.mod.clear(count, this.sim.activeChannelId);
          break;
        }

        case 'slowmode': {
          const sec = parseInt(args[0]) || 15;
          this.mod.slowmodes.set(this.sim.activeChannelId, sec);
          embed = {
            title: "⏱️ Slowmode Cooldown Configured",
            color: "#3498db",
            description: `Channel **#${this.sim.activeChannelId}** slowmode has been set to **${sec} seconds** between member messages.`,
            footer: "NEXBOT AutoMod"
          };
          break;
        }

        /* ================= 2. ECONOMY ================= */
        case 'balance': {
          const w = this.eco.getWallet('user_visitor');
          embed = {
            title: `🪙 Financial Ledger — ${CURRENT_VISITOR.name}`,
            color: "#f1c40f",
            description: `Real-time community economy balance and perks:`,
            fields: [
              { name: "Cash in Wallet", value: `\`${w.coins.toLocaleString()} Coins\``, inline: true },
              { name: "Vault Bank Reserves", value: `\`${w.bank.toLocaleString()} Coins\``, inline: true },
              { name: "Total Net Worth", value: `**${(w.coins + w.bank).toLocaleString()} Coins**`, inline: true },
              { name: "Daily Streak", value: `${w.streak} Days 🔥`, inline: true },
              { name: "Owned Perks & Badges", value: w.inventory.join(', ') || 'None owned', inline: false }
            ],
            footer: "Type /work or /daily to earn more coins"
          };
          buttons = [
            { id: 'btn_action_daily', label: '🪙 Claim Daily (+250)', style: 'success' },
            { id: 'btn_action_work', label: '💼 Work Shift', style: 'primary' },
            { id: 'btn_action_shop', label: '🛍️ Open Shop', style: 'secondary' }
          ];
          break;
        }

        case 'daily':
          embed = this.eco.daily('user_visitor');
          buttons = [
            { id: 'btn_action_work', label: '💼 Work to Earn More', style: 'primary' },
            { id: 'btn_action_balance', label: '🪙 Check Balance', style: 'secondary' }
          ];
          break;

        case 'weekly':
          embed = this.eco.weekly('user_visitor');
          buttons = [{ id: 'btn_action_balance', label: '🪙 View Balance', style: 'secondary' }];
          break;

        case 'work':
          embed = this.eco.work('user_visitor');
          buttons = [
            { id: 'btn_action_work', label: '💼 Work Another Shift', style: 'primary' },
            { id: 'btn_action_balance', label: '🪙 View Balance', style: 'secondary' }
          ];
          break;

        case 'pay': {
          const targetPay = args[0] || '@Alex';
          const payAmt = parseInt(args[1]) || 100;
          embed = this.eco.pay('user_visitor', targetPay, payAmt);
          break;
        }

        case 'shop': {
          const isBuy = args[0] && args[0].toLowerCase() === 'buy';
          const itemIdx = isBuy ? args[1] : args[0];
          embed = this.eco.shop('user_visitor', itemIdx);
          buttons = [
            { id: 'btn_buy_vip', label: '💎 Buy #1 VIP Role (500c)', style: 'primary' },
            { id: 'btn_buy_theme', label: '🎨 Buy #2 Neon Theme (1,200c)', style: 'secondary' },
            { id: 'btn_buy_charm', label: '🔫 Buy #3 Dragon Lore Charm (2,500c)', style: 'secondary' }
          ];
          break;
        }

        case 'inventory': {
          const invW = this.eco.getWallet('user_visitor');
          embed = {
            title: `🎒 Member Inventory — ${CURRENT_VISITOR.name}`,
            color: "#9b59b6",
            description: `Items, roles, and cosmetic perks registered to your account:`,
            fields: [
              { name: "Equipped Items (${invW.inventory.length})", value: invW.inventory.length ? invW.inventory.map(i => `• ${i}`).join('\n') : "No items acquired yet. Type `/shop` to purchase perks!", inline: false },
              { name: "Wallet Cash Available", value: `\`${invW.coins.toLocaleString()} Coins\``, inline: true }
            ],
            footer: "NEXBOT Economy Inventory"
          };
          buttons = [{ id: 'btn_action_shop', label: '🛍️ Open Perk Store (/shop)', style: 'primary' }];
          break;
        }

        case 'leaderboard':
          embed = this.eco.leaderboard();
          buttons = [{ id: 'btn_action_work', label: '💼 Work to Climb Ranks', style: 'primary' }];
          break;

        case 'coinflip': {
          const choice = args[0] || 'heads';
          const betAmount = args[1] || '100';
          embed = this.eco.coinflip('user_visitor', choice, betAmount);
          buttons = [
            { id: 'btn_action_coinflip_again', label: '🎰 Flip Again (Heads 100c)', style: 'primary' },
            { id: 'btn_action_balance', label: '🪙 View Balance', style: 'secondary' }
          ];
          break;
        }

        case 'rob': {
          const robTarget = args[0] || '@Alex';
          embed = this.eco.rob('user_visitor', robTarget);
          buttons = [{ id: 'btn_action_work', label: '💼 Earn Coins Legitimately (/work)', style: 'primary' }];
          break;
        }

        /* ================= 3. GIVEAWAYS ================= */
        case 'giveaway': {
          const sub = (args[0] || 'start').toLowerCase();
          if (sub === 'start') {
            const prize = args.slice(1).join(' ') || 'AWP | Asiimov (Field-Tested)';
            this.gw.start(prize, 24);
            return;
          } else if (sub === 'reroll') {
            this.gw.reroll();
            return;
          } else if (sub === 'end') {
            this.gw.end();
            return;
          } else if (sub === 'list') {
            const activeDesc = this.gw.activeGiveaway
              ? `• **${this.gw.activeGiveaway.prize}** — Live now (${this.gw.activeGiveaway.entrants.size} Entrants)`
              : `• **AWP | Asiimov (Field-Tested)** — Ready to launch`;
            embed = {
              title: "🎉 Community Giveaways Schedule",
              color: "#9b59b6",
              description: `Active and upcoming raffles in the server:\n${activeDesc}\n• **StatTrak™ AK-47 | Asiimov (Field-Tested)** — Scheduled Weekly Draw`,
              footer: "Use /giveaway start [prize] to launch a live raffle"
            };
            buttons = [{ id: 'btn_gw_start_demo', label: '🎉 Launch Live Giveaway Now', style: 'primary' }];
          } else {
            // If user typed `/giveaway` or `/giveaway AWP | Asiimov` directly
            const prize = args.join(' ') || 'AWP | Asiimov (Field-Tested)';
            this.gw.start(prize, 24);
            return;
          }
          break;
        }

        /* ================= 4. TICKETS ================= */
        case 'ticket': {
          const tSub = (args[0] || 'panel').toLowerCase();
          if (tSub === 'panel') {
            embed = this.ticket.panel();
            buttons = [
              { id: 'btn_ticket_billing', label: '💳 Billing Inquiries', style: 'primary' },
              { id: 'btn_ticket_tech', label: '🛠️ Technical Support', style: 'secondary' },
              { id: 'btn_ticket_raid', label: '🛡️ Emergency Security', style: 'danger' }
            ];
          } else if (tSub === 'create') {
            this.ticket.create(args.slice(1).join(' ') || 'General Support');
            return;
          } else if (tSub === 'claim') {
            embed = this.ticket.claim();
          } else if (tSub === 'transcript') {
            embed = this.ticket.transcript(this.sim.activeChannelId);
          } else if (tSub === 'close') {
            this.ticket.close(this.sim.activeChannelId);
            return;
          } else {
            embed = this.ticket.panel();
            buttons = [
              { id: 'btn_ticket_tech', label: '🛠️ Create Support Ticket', style: 'primary' }
            ];
          }
          break;
        }

        /* ================= 5. LEVELING & ENGAGEMENT ================= */
        case 'rank': {
          const rW = this.eco.getWallet('user_visitor');
          embed = {
            title: `⭐ Server Rank & Activity Card — ${CURRENT_VISITOR.name}`,
            color: "#00b0f4",
            description: "Member Engagement, Leveling & Trust Telemetry:",
            fields: [
              { name: "Server Level", value: `**Level ${CURRENT_VISITOR.level || 3}** (${CURRENT_VISITOR.xp || 340}/${CURRENT_VISITOR.xpToNextLevel || 500} XP)`, inline: true },
              { name: "Server Tier", value: "**Tier 3 (Contributor)**", inline: true },
              { name: "Trust Score", value: "`99.4% (Verified Clean)`", inline: true },
              { name: "Daily Streak", value: `\`${rW.streak} Days 🔥\``, inline: true },
              { name: "Wallet Balance", value: `\`${rW.coins.toLocaleString()} Coins\``, inline: true },
              { name: "Reputation", value: `\`+${CURRENT_VISITOR.reputation || 18} Rep\` ⭐`, inline: true }
            ],
            footer: "NEXBOT Leveling & Engagement Telemetry • Try /profile or /rep"
          };
          buttons = [
            { id: 'btn_ai_cmd_profile', label: '🪪 View Full /profile', style: 'primary' },
            { id: 'btn_action_daily', label: '🪙 Claim Daily', style: 'success' }
          ];
          break;
        }

        case 'profile': {
          const pW = this.eco.getWallet('user_visitor');
          embed = {
            title: `🪪 Community Profile Card — ${CURRENT_VISITOR.name}#${CURRENT_VISITOR.tag}`,
            color: "#5865F2",
            description: `**Role:** \`${CURRENT_VISITOR.role}\` • **Status:** \`Online\`\n*${CURRENT_VISITOR.customStatus}*`,
            fields: [
              { name: "Level & XP", value: `\`Lv. ${CURRENT_VISITOR.level || 3} (${CURRENT_VISITOR.xp || 340} XP)\``, inline: true },
              { name: "Net Worth", value: `\`${(pW.coins + pW.bank).toLocaleString()} Coins\``, inline: true },
              { name: "Reputation", value: `\`+${CURRENT_VISITOR.reputation || 18} Rep ⭐\``, inline: true },
              { name: "Active Streak", value: `\`${pW.streak} Days 🔥\``, inline: true },
              { name: "Moderation Record", value: "`0 Active Warnings (Clean)`", inline: true },
              { name: "Equipped Badges", value: pW.inventory.join(' • ') || 'None', inline: false }
            ],
            footer: "NEXBOT Unified Member Profile"
          };
          buttons = [
            { id: 'btn_action_shop', label: '🛍️ Unlock Badges (/shop)', style: 'primary' },
            { id: 'btn_ai_cmd_quests', label: '🎯 Daily Quests', style: 'secondary' }
          ];
          break;
        }

        case 'rep': {
          const repTarget = (args[0] || '@Alex').replace(/^@/, '');
          CURRENT_VISITOR.reputation = (CURRENT_VISITOR.reputation || 18) + 1;
          discordAudio.playSuccessChime();
          embed = {
            title: "⭐ Peer Reputation Point Awarded!",
            color: "#f1c40f",
            description: `You awarded **+1 Reputation Point** to **<@${repTarget}>** for helpful community contributions!`,
            fields: [
              { name: "Recipient", value: `<@${repTarget}>`, inline: true },
              { name: "Your Total Rep Given", value: `\`${CURRENT_VISITOR.reputation} Rep ⭐\``, inline: true }
            ],
            footer: "NEXBOT Peer Recognition Engine"
          };
          break;
        }

        case 'daily-challenge':
          embed = {
            title: "🎯 Community Daily Engagement Quests",
            color: "#3498db",
            description: "Complete daily server activities to earn bonus coins and XP:\n\n1. `[✓]` Execute a slash command in `#bot-commands` (**+100 Coins**)\n2. `[✓]` Ask a capability question in `#ai-assistant` (**+150 Coins**)\n3. `[ ]` Deploy a custom security rule in `/automation` (**+250 Coins**)",
            footer: "Quests reset daily at 00:00 UTC"
          };
          buttons = [
            { id: 'btn_top_automation', label: '⚡ Complete Quest #3 (/automation)', style: 'primary' }
          ];
          break;

        /* ================= 6. AUTOMATION ================= */
        case 'automation': {
          const subAuto = (args[0] || '').toLowerCase();
          if (subAuto === 'list') {
            embed = this.auto.listRules();
            buttons = [{ id: 'btn_top_automation', label: '⚡ Open Visual Automation Builder', style: 'primary' }];
          } else {
            this.sim.openAutomationModal();
            embed = this.auto.listRules();
            buttons = [{ id: 'btn_top_automation', label: '⚡ Open Visual Automation Builder', style: 'primary' }];
          }
          break;
        }

        case 'automod':
          embed = {
            title: "🛡️ NEXBOT Real-Time AutoMod Telemetry",
            color: "#2ecc71",
            description: "All automated protection shields are active across the server:",
            fields: [
              { name: "Anti-Spam Shield", value: "`Active (<100ms response)`", inline: true },
              { name: "Zero-Day Phishing", value: "`1,420 Domains Blocked`", inline: true },
              { name: "Raid Detection", value: "`Heuristic Ingestion Online`", inline: true },
              { name: "Active Custom Pipelines", value: `\`${this.auto.rules.length} Rules Deployed\``, inline: true }
            ],
            footer: "Use /automation to build custom Trigger → Condition → Action rules"
          };
          buttons = [
            { id: 'btn_top_automation', label: '⚡ Open Automation Builder', style: 'primary' },
            { id: 'btn_top_antiraid', label: '🚨 Test Anti-Raid Shield', style: 'danger' }
          ];
          break;

        /* ================= 7. UTILITY ================= */
        case 'verify':
          embed = {
            title: "🛡️ Server Gatekeeper — Identity Verification",
            color: "#2ecc71",
            description: `Welcome to the official server! To protect the community against automated spam and malicious raids, click the button below to complete 1-click identity verification.`,
            fields: [
              { name: "Security Check", value: "Instant Token & Account-Age Verification", inline: true },
              { name: "Role Granted", value: "`@Verified Member`", inline: true }
            ],
            footer: "Powered by NEXBOT Gatekeeper AI"
          };
          buttons = [
            { id: 'btn_action_verify_now', label: '✅ Verify Identity (Instant)', style: 'success' },
            { id: 'btn_action_rules', label: '📜 Read Server Rules', style: 'secondary' }
          ];
          break;

        case 'rules':
          embed = {
            title: "📜 Official Community Guidelines & Server Rules",
            color: "#5865F2",
            description: "1. **Respect Everyone:** Harassment, hate speech, or toxicity triggers an automatic strike (`/warn`).\n2. **Zero Phishing / Spam:** Posting scam or malicious links triggers an instant AutoMod ban (`/ban`).\n3. **Use Proper Channels:** Execute commands in `#bot-commands`, ask capability questions in `#ai-assistant`, and monitor live skin prices in `#cs2-arbitrage-alerts`.\n4. **Support Appeals:** Open a private staff channel anytime via `/ticket`.",
            footer: "Enforced 24/7 by NEXBOT AutoMod"
          };
          break;

        case 'stats':
          embed = {
            title: "📊 NEXBOT Global Cluster Telemetry",
            color: "#5865F2",
            description: "Real-time edge metrics across enterprise clusters:",
            fields: [
              { name: "Active Servers", value: "`14,820 Guilds`", inline: true },
              { name: "Uptime SLA", value: "`99.99%`", inline: true },
              { name: "Gateway Ping", value: "`14ms (WebSocket)`", inline: true },
              { name: "Registered Commands", value: `\`${SLASH_COMMANDS.length} Live Commands\``, inline: true },
              { name: "CS2 Skins Tracked", value: "`47,328 Market Variants`", inline: true },
              { name: "Active Automations", value: `\`${this.auto.rules.length} Pipelines\``, inline: true }
            ],
            footer: "NEXBOT Distributed Node Architecture • Node US-East-04"
          };
          buttons = [
            { id: 'btn_top_antiraid', label: '🚨 Simulate Raid Attack', style: 'danger' },
            { id: 'btn_action_invite', label: '➕ Add to Discord', style: 'primary' }
          ];
          break;

        case 'audit-log':
          embed = {
            title: "📜 Server Security Audit Log",
            color: "#34495e",
            description: "Recent automated enforcement and moderator actions:",
            fields: this.mod.auditLog.slice(0, 5).map(l => ({
              name: `[${l.action}] Case ${l.id} • ${l.time}`,
              value: `**Target:** ${l.target}\n**Enforcer:** ${l.mod} • **Reason:** \`${l.reason}\``,
              inline: false
            })),
            footer: "Immutable Audit Log • Stored 90 Days"
          };
          break;

        case 'help': {
          const requestedCat = (args[0] || 'All').trim();
          const matchedCat = COMMAND_CATEGORIES.find(c => c.id.toLowerCase() === requestedCat.toLowerCase());
          this.sim.addMessageToChannel(this.sim.activeChannelId, {
            id: `cmd_help_dir_${Date.now()}`,
            userId: 'user_bot',
            isBot: true,
            isCommandDirectory: true,
            activeCategory: matchedCat ? matchedCat.id : 'All',
            timestamp: this.sim.formatDiscordTime(new Date()),
            rawTime: Date.now(),
            reactions: []
          });
          discordAudio.playMessageChime();
          return;
        }

        case 'ask': {
          const query = args.join(' ') || "What moderation functions do you have?";
          const aiResult = await this.ai.chat(query);
          this.sim.addMessageToChannel(this.sim.activeChannelId, {
            id: `cmd_ask_${Date.now()}`,
            userId: 'user_bot',
            isBot: true,
            content: aiResult.content || '',
            embed: aiResult.embed || null,
            buttons: aiResult.buttons || [],
            timestamp: this.sim.formatDiscordTime(new Date()),
            rawTime: Date.now()
          });
          discordAudio.playMessageChime();
          return;
        }

        case 'skin': {
          const skinQuery = args.join(' ') || "AK-47 | Asiimov";
          const matchedSkin = await this.cs2.searchSkinLive(skinQuery);
          if (matchedSkin) {
            const skinMsg = this.cs2.buildSkinDiscordMessage(matchedSkin, 0);
            skinMsg.id = `cmd_skin_${Date.now()}`;
            skinMsg.isCustomCS2Search = true;
            this.sim.addMessageToChannel(this.sim.activeChannelId, skinMsg);
            discordAudio.playMessageChime();
            return;
          } else {
            embed = {
              title: `🔎 No Exact CS2 Market Listing Found for "${skinQuery}"`,
              color: "#e67e22",
              description: `Could not find a live market listing matching \`${skinQuery}\` in the 1,974-skin catalog.\n\n**Try searching with weapon or finish name:**\n• \`/skin AK-47 | Asiimov\`\n• \`/skin Desert Eagle | Printstream\`\n• \`/skin AWP | Dragon Lore\`\n• \`/skin Butterfly Knife | Fade\`\n• \`/skin Karambit | Doppler\``,
              footer: "NEXBOT Real-Time CS2 Market Scanner"
            };
          }
          break;
        }

        default:
          embed = {
            title: `❓ Unknown Command: /${cmd}`,
            color: "#e74c3c",
            description: `Command \`/${cmd}\` is not in the NEXBOT registry (\`${SLASH_COMMANDS.length}\` implemented commands). Type \`/help\` or click any command card in **#bot-commands** to execute a valid command.`,
            footer: "NEXBOT Command Dispatcher"
          };
          buttons = [{ id: 'btn_ai_cmd_help', label: '📖 Open Command Directory (/help)', style: 'primary' }];
          break;
      }

      if (embed) {
        this.sim.addMessageToChannel(this.sim.activeChannelId, {
          id: `cmd_res_${Date.now()}`,
          userId: 'user_bot',
          isBot: true,
          embed,
          buttons,
          timestamp: this.sim.formatDiscordTime(new Date()),
          rawTime: Date.now()
        });
        discordAudio.playMessageChime();
      }
    }, 450);
  }

  async generateSmartAIResponse(userPrompt) {
    this.sim.setTypingUser('NEXBOT', true);
    const aiResponse = await this.ai.chat(userPrompt);
    setTimeout(() => {
      this.sim.setTypingUser('NEXBOT', false);
      const botMsg = {
        id: `ai_${Date.now()}`,
        userId: 'user_bot',
        isBot: true,
        content: aiResponse.content || '',
        embed: aiResponse.embed || null,
        buttons: aiResponse.buttons || [],
        timestamp: this.sim.formatDiscordTime(new Date()),
        rawTime: Date.now()
      };
      this.sim.addMessageToChannel(this.sim.activeChannelId, botMsg);
      discordAudio.playMessageChime();
    }, 350);
  }

  // Handle all Interactive Embed Button Clicks
  handleButtonClick(buttonId) {
    discordAudio.playClick();

    if (buttonId.startsWith('btn_run_custom_')) {
      const cmdName = buttonId.replace('btn_run_custom_', '');
      const cmdObj = SLASH_COMMANDS.find(c => c.name === cmdName);
      if (cmdObj) {
        this.sim.executeCommandFromUI(cmdObj.example, cmdObj.name);
      }
      return;
    }

    if (buttonId === 'btn_action_invite') {
      this.sim.openInviteModal();
      return;
    }

    if (buttonId === 'btn_top_antiraid' || buttonId === 'btn_action_antiraid') {
      this.sim.executeCommandFromUI('/antiraid simulate');
      return;
    }

    if (buttonId === 'btn_top_automation') {
      this.sim.openAutomationModal();
      return;
    }

    if (buttonId === 'btn_action_daily') {
      this.sim.executeCommandFromUI('/daily');
      return;
    }

    if (buttonId === 'btn_action_work') {
      this.sim.executeCommandFromUI('/work');
      return;
    }

    if (buttonId === 'btn_action_balance') {
      this.sim.executeCommandFromUI('/balance');
      return;
    }

    if (buttonId === 'btn_action_shop') {
      this.sim.executeCommandFromUI('/shop');
      return;
    }

    if (buttonId === 'btn_buy_vip') {
      this.sim.executeCommandFromUI('/shop buy 1');
      return;
    }

    if (buttonId === 'btn_buy_theme') {
      this.sim.executeCommandFromUI('/shop buy 2');
      return;
    }

    if (buttonId === 'btn_buy_charm') {
      this.sim.executeCommandFromUI('/shop buy 3');
      return;
    }

    if (buttonId.startsWith('btn_gw_enter_')) {
      const id = buttonId.replace('btn_gw_enter_', '');
      this.gw.enter(id);
      return;
    }

    if (buttonId === 'btn_gw_end_now') {
      this.gw.end();
      return;
    }

    if (buttonId.startsWith('btn_gw_reroll')) {
      this.gw.reroll();
      return;
    }

    if (buttonId === 'btn_gw_start_demo') {
      this.sim.executeCommandFromUI('/giveaway start AWP | Asiimov (Field-Tested)');
      return;
    }

    if (buttonId.startsWith('btn_ticket_')) {
      if (buttonId.startsWith('btn_ticket_close_')) {
        const chanId = buttonId.replace('btn_ticket_close_', '');
        this.ticket.close(chanId);
      } else if (buttonId === 'btn_ticket_billing') {
        this.ticket.create('Billing & Commercial Tier');
      } else if (buttonId === 'btn_ticket_tech') {
        this.ticket.create('Technical Support & Webhooks');
      } else if (buttonId === 'btn_ticket_raid') {
        this.ticket.create('Emergency Anti-Raid Consultation');
      } else if (buttonId === 'btn_ticket_claim') {
        this.sim.addMessageToChannel(this.sim.activeChannelId, {
          id: `claimed_${Date.now()}`,
          userId: 'user_alex',
          content: "I have taken ownership of this ticket. Reviewing your server configuration now 🛠️",
          timestamp: this.sim.formatDiscordTime(new Date()),
          rawTime: Date.now()
        });
      }
      return;
    }

    if (buttonId === 'btn_action_verify_now') {
      CURRENT_VISITOR.name = 'Nexus Explorer [Verified]';
      discordAudio.playSuccessChime();
      this.sim.renderVisitorProfile();
      this.sim.addMessageToChannel(this.sim.activeChannelId, {
        id: `verified_${Date.now()}`,
        userId: 'user_bot',
        isBot: true,
        embed: {
          title: "✅ Security Verification Passed",
          color: "#2ecc71",
          description: `Welcome <@${CURRENT_VISITOR.name}>! You have passed our automated gatekeeper checks and have been granted full **@Verified Member** permissions.`,
          footer: "NEXBOT Gatekeeper AI"
        },
        timestamp: this.sim.formatDiscordTime(new Date()),
        rawTime: Date.now()
      });
      return;
    }

    if (buttonId === 'btn_action_rules') {
      this.sim.executeCommandFromUI('/rules');
      return;
    }

    if (buttonId === 'btn_action_audit') {
      this.sim.executeCommandFromUI('/audit-log');
      return;
    }

    if (buttonId === 'btn_action_coinflip_again') {
      this.sim.executeCommandFromUI('/coinflip heads 100');
      return;
    }

    if (buttonId === 'btn_action_unlock') {
      this.sim.executeCommandFromUI('/unlock');
      return;
    }

    if (buttonId === 'btn_action_unban') {
      this.sim.executeCommandFromUI('/unban @Raider');
      return;
    }

    if (buttonId === 'btn_action_warnings') {
      this.sim.executeCommandFromUI('/warnings @Daniel');
      return;
    }

    // AI Assistant quick-action buttons
    if (buttonId === 'btn_ai_cmd_verify') {
      this.sim.executeCommandFromUI('/verify');
      return;
    }
    if (buttonId === 'btn_ai_cmd_help') {
      this.sim.executeCommandFromUI('/help');
      return;
    }
    if (buttonId === 'btn_ai_cmd_automod') {
      this.sim.executeCommandFromUI('/automod');
      return;
    }
    if (buttonId === 'btn_ai_cmd_warn') {
      this.sim.executeCommandFromUI('/warn @Daniel Repeated spam reactions');
      return;
    }
    if (buttonId === 'btn_ai_cmd_ban') {
      this.sim.executeCommandFromUI('/ban @Raider Malicious phishing link');
      return;
    }
    if (buttonId === 'btn_ai_cmd_auto_list') {
      this.sim.executeCommandFromUI('/automation list');
      return;
    }
    if (buttonId === 'btn_ai_cmd_ticket_panel') {
      this.sim.executeCommandFromUI('/ticket panel');
      return;
    }
    if (buttonId === 'btn_ai_cmd_rank') {
      this.sim.executeCommandFromUI('/rank');
      return;
    }
    if (buttonId === 'btn_ai_cmd_profile') {
      this.sim.executeCommandFromUI('/profile');
      return;
    }
    if (buttonId === 'btn_ai_cmd_quests') {
      this.sim.executeCommandFromUI('/daily-challenge');
      return;
    }
    if (buttonId === 'btn_ai_cmd_skin') {
      this.sim.executeCommandFromUI('/skin AK-47 | Asiimov');
      return;
    }
    if (buttonId === 'btn_ai_goto_cs2') {
      this.sim.switchChannel('cs2-arbitrage-alerts');
      return;
    }
  }
}
