/* ============================================================== */
/* DISCORD SIMULATOR — CORE ARCHITECTURE & DOM CONTROLLER         */
/* ============================================================== */

import { 
  DISCORD_MEMBERS, 
  CURRENT_VISITOR, 
  DISCORD_CHANNELS, 
  CHANNEL_MESSAGES, 
  SLASH_COMMANDS, 
  COMMAND_CATEGORIES,
  AI_ASSISTANT_SUGGESTIONS,
  AUTOMATION_PRESETS
} from './discord-data.js?v=10';
import { CommunityActivityEngine, discordAudio } from './discord-engine.js?v=10';

export class DiscordSimulator {
  constructor(rootContainerId = 'discord-app-root') {
    this.root = document.getElementById(rootContainerId);
    this.members = [...DISCORD_MEMBERS];
    this.visitor = CURRENT_VISITOR;
    this.channelStores = JSON.parse(JSON.stringify(CHANNEL_MESSAGES));
    this.activeChannelId = 'bot-commands'; // Channel 1 (#bot-commands) is always the default channel
    this.activeCommandCategory = 'All';
    this.inspectedCommand = null;
    this.aiPanelCollapsed = false;
    this.activeReplyMessage = null;
    this.typingUsers = new Set();
    this.slashAutocompleteOpen = false;
    this.slashSelectedIndex = 0;
    this.isMuted = false;
    this.isDeafened = false;
    this.activityEngine = new CommunityActivityEngine(this);

    if (this.root) {
      this.init();
    }
  }

  init() {
    this.renderLayout();
    this.bindEvents();
    this.activityEngine.start();
    // Start at the top of #bot-commands so the NEXBOT Introduction & Command Directory is immediately visible
    this.scrollToTop();
  }

  destroy() {
    this.activityEngine.stop();
  }

  formatDiscordTime(date) {
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    return `Today at ${formattedHours}:${minutes} ${ampm}`;
  }

  getUser(userId) {
    if (userId === this.visitor.id) return this.visitor;
    return this.members.find(m => m.id === userId) || {
      name: 'Unknown User',
      avatar: this.visitor.avatar,
      roleColor: '#949ba4'
    };
  }

  setTypingUser(name, isTyping) {
    if (isTyping) {
      this.typingUsers.add(name);
    } else {
      this.typingUsers.delete(name);
    }
    this.updateTypingIndicator();
  }

  updateTypingIndicator() {
    const typingElem = document.getElementById('discord-typing-indicator');
    if (!typingElem) return;

    if (this.typingUsers.size === 0) {
      typingElem.innerHTML = '';
      typingElem.classList.add('opacity-0');
      return;
    }

    const names = Array.from(this.typingUsers);
    let text = '';
    if (names.length === 1) {
      text = `<strong>${this.escapeHtml(names[0])}</strong> is typing...`;
    } else if (names.length === 2) {
      text = `<strong>${this.escapeHtml(names[0])}</strong> and <strong>${this.escapeHtml(names[1])}</strong> are typing...`;
    } else {
      text = `Several members are typing...`;
    }

    typingElem.innerHTML = `
      <div class="typing-dots flex items-center gap-1">
        <span></span><span></span><span></span>
      </div>
      <span class="text-xs text-[#949ba4]">${text}</span>
    `;
    typingElem.classList.remove('opacity-0');
  }

  renderLayout() {
    const activeChan = DISCORD_CHANNELS.find(c => c.id === this.activeChannelId) || DISCORD_CHANNELS[0];

    this.root.innerHTML = `
      <div class="discord-app w-full h-full flex flex-col overflow-hidden text-sm select-none relative">
        
        <!-- Top App Titlebar Window Controls (Authentic Windows Discord App Bar) -->
        <div class="h-8 bg-[#1e1f22] flex items-center justify-between pl-3 pr-0 text-[11px] text-[#949ba4] border-b border-[#111214]/80 flex-shrink-0 z-30 select-none">
          <div class="flex items-center gap-2 min-w-0">
            <svg class="w-4 h-4 text-[#5865F2] flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
            <span class="font-bold text-[#dbdee1] truncate">Discord — NEXBOT Live Interactive Showcase</span>
          </div>

          <!-- Native Windows Desktop Window Controls -->
          <div class="flex items-center h-full">
            <button id="win-btn-minimize" class="w-11 h-8 flex items-center justify-center text-[#949ba4] hover:text-[#dbdee1] hover:bg-[#35373c] transition-colors" title="Minimize">
              <svg class="w-3 h-3" viewBox="0 0 12 12" fill="currentColor"><rect y="5.5" width="12" height="1"/></svg>
            </button>
            <button id="win-btn-maximize" class="w-11 h-8 flex items-center justify-center text-[#949ba4] hover:text-[#dbdee1] hover:bg-[#35373c] transition-colors" title="Maximize">
              <svg class="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.2"><rect x="1" y="1" width="10" height="10"/></svg>
            </button>
            <button id="win-btn-close" class="w-12 h-8 flex items-center justify-center text-[#949ba4] hover:text-white hover:bg-[#e81123] transition-colors" title="Close">
              <svg class="w-3.5 h-3.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M1.5 1.5l9 9M10.5 1.5l-9 9"/></svg>
            </button>
          </div>
        </div>

        <!-- Main Body: Multi-column Discord Layout -->
        <div class="flex-1 flex overflow-hidden">
          
          <!-- Column 1: Leftmost Server Sidebar (72px) -->
          <div id="discord-server-sidebar" class="w-[72px] bg-[#1e1f22] hidden sm:flex flex-col items-center py-3 gap-2 flex-shrink-0 z-20">
            <!-- Discord Home Direct Messages Icon -->
            <div class="relative group flex items-center justify-center w-full">
              <div class="server-pill h-2 group-hover:h-5 opacity-0 group-hover:opacity-100"></div>
              <button onclick="window.discordSim.switchChannel('bot-commands')" class="w-12 h-12 rounded-[24px] group-hover:rounded-[16px] bg-[#313338] group-hover:bg-[#5865F2] flex items-center justify-center text-[#dbdee1] group-hover:text-white transition-all duration-200" title="NEXBOT Command Directory">
                <svg class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
              </button>
            </div>

            <!-- Separator -->
            <div class="w-8 h-[2px] bg-[#35363c] rounded-full my-1"></div>

            <!-- NEXBOT HQ Server Icon (Active) -->
            <div class="relative group flex items-center justify-center w-full">
              <div class="server-pill h-10 opacity-100"></div>
              <button class="w-12 h-12 rounded-[16px] bg-[#5865F2] flex items-center justify-center text-white font-bold text-base transition-all duration-200" title="NEXBOT Official Server">
                NX
              </button>
            </div>

            <!-- Add Bot Plus Icon -->
            <div class="relative group flex items-center justify-center w-full mt-auto">
              <div class="server-pill h-2 group-hover:h-5 opacity-0 group-hover:opacity-100"></div>
              <button id="btn-sidebar-add" class="w-12 h-12 rounded-[24px] group-hover:rounded-[16px] bg-[#313338] group-hover:bg-[#23a55a] flex items-center justify-center text-[#23a55a] group-hover:text-white transition-all duration-200" title="Add NEXBOT to your server">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
              </button>
            </div>

            <!-- Automation Builder Icon -->
            <div class="relative group flex items-center justify-center w-full">
              <div class="server-pill h-2 group-hover:h-5 opacity-0 group-hover:opacity-100"></div>
              <button onclick="window.discordSim.openAutomationModal()" class="w-12 h-12 rounded-[24px] group-hover:rounded-[16px] bg-[#313338] group-hover:bg-[#5865F2] flex items-center justify-center text-[#5865F2] group-hover:text-white transition-all duration-200" title="Open Visual Automation Builder (/automation)">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"></path></svg>
              </button>
            </div>
          </div>

          <!-- Column 2: Channel Sidebar (240px) -->
          <div id="discord-channel-sidebar" class="w-56 md:w-60 bg-[#2b2d31] flex flex-col flex-shrink-0 border-r border-[#1f2023] z-10">
            <!-- Server Header Banner -->
            <button class="h-12 border-b border-[#1f2023] px-4 flex items-center justify-between text-[#f2f3f5] font-bold text-sm tracking-tight hover:bg-[#35373c]/50 transition-colors">
              <div class="flex items-center gap-1.5 truncate">
                <span class="truncate">NEXBOT OFFICIAL</span>
                <span class="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#5865F2] text-white" title="Verified Bot Community">
                  <svg class="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                </span>
              </div>
              <svg class="w-4 h-4 text-[#949ba4]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>

            <!-- Channels Scroller -->
            <div id="discord-channels-list" class="flex-1 overflow-y-auto discord-scroll py-3 px-2 space-y-4">
              <!-- Rendered via renderChannels() -->
            </div>

            <!-- User Panel at Bottom -->
            <div id="discord-user-panel" class="h-[56px] bg-[#232428] px-2 flex items-center justify-between border-t border-[#1f2023]">
              <!-- Rendered via renderVisitorProfile() -->
            </div>
          </div>

          <!-- Column 3: Main Chat Area -->
          <div class="flex-1 bg-[#313338] flex flex-col min-w-0 relative">
            
            <!-- Chat Topbar (48px) -->
            <div class="h-12 border-b border-[#1f2023] px-4 flex items-center justify-between bg-[#313338] z-10 flex-shrink-0">
              <div class="flex items-center gap-2 min-w-0">
                <span class="text-xl text-[#80848e] font-bold leading-none">#</span>
                <span id="current-channel-title" class="text-[#f2f3f5] font-bold text-base tracking-tight truncate">${activeChan.name}</span>
                <span class="text-[#4e5058] mx-1 hidden md:inline">|</span>
                <span id="current-channel-topic" class="text-[#949ba4] text-xs truncate hidden md:inline">${activeChan.topic}</span>
              </div>

              <!-- Member list toggle and message search -->
              <div class="flex items-center gap-3 text-[#b5bac1] flex-shrink-0 ml-3">
                <button id="btn-toggle-members" class="hover:text-[#dbdee1] p-1 rounded cursor-pointer" title="Toggle Member List" aria-label="Toggle member list">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                </button>
                <label class="discord-search hidden md:flex items-center gap-1 h-6 w-36 focus-within:w-52 px-1.5 rounded bg-[#1e1f22] transition-all duration-150">
                  <input id="discord-search" type="text" placeholder="Search" aria-label="Search messages in this channel" class="flex-1 min-w-0 bg-transparent text-xs text-[#dbdee1] placeholder-[#949ba4] focus:outline-none select-text" />
                  <svg class="w-3.5 h-3.5 text-[#949ba4] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" stroke-width="2"></circle><path stroke-linecap="round" stroke-width="2" d="M20 20l-3.5-3.5"></path></svg>
                </label>
              </div>
            </div>

            <!-- PINNED CHANNEL TOP HEADER SLOT (Used by #ai-assistant and #cs2-arbitrage-alerts so their panels stay accessible at the top without scrolling!) -->
            <div id="channel-pinned-top-slot" class="flex-shrink-0 z-10"></div>

            <!-- Message List Scroll Area -->
            <div id="discord-messages-container" class="flex-1 overflow-y-auto discord-scroll p-4 space-y-1">
              <!-- Channel Welcome Banner -->
              <div id="channel-welcome-banner" class="py-3 border-b border-[#35373c]/50 mb-3 flex items-center justify-between gap-3">
                <div class="flex items-center gap-3 min-w-0">
                  <div class="w-10 h-10 rounded-full bg-[#383a40] flex items-center justify-center text-white flex-shrink-0">
                    <span class="text-xl font-bold">#</span>
                  </div>
                  <div class="min-w-0">
                    <h2 id="welcome-title" class="text-base sm:text-lg font-bold text-white truncate">Welcome to #${activeChan.name}!</h2>
                    <p id="welcome-desc" class="text-[#949ba4] text-xs truncate">${activeChan.topic}</p>
                  </div>
                </div>
              </div>

              <!-- Message Stream Render Target -->
              <div id="discord-messages-stream" class="space-y-1"></div>
            </div>

            <!-- Typing Indicator (Height 20px) -->
            <div id="discord-typing-indicator" class="h-5 px-4 flex items-center gap-2 transition-opacity duration-150 opacity-0 pointer-events-none"></div>

            <!-- Chat Input Area with Command Inspector, Suggestion Chips & Popovers -->
            <div class="px-4 pb-6 relative flex-shrink-0">

              <!-- Interactive Command Usage Inspector Banner (Appears when a visitor clicks/inspects a command) -->
              <div id="command-usage-inspector" class="hidden mb-2 rounded-lg bg-[#232428] border border-[#5865F2]/50 p-2.5 shadow-xl"></div>

              <!-- Quick-prompt chips, shown only in #ai-assistant -->
              <div id="channel-quick-prompts" class="hidden mb-2 flex flex-wrap items-center gap-1.5"></div>

              <!-- Attachment (+) Menu -->
              <div id="discord-attach-menu" class="slash-popover absolute bottom-full left-4 mb-1 w-56 p-1.5 rounded-lg bg-[#111214] shadow-2xl hidden z-30" role="menu">
                <button type="button" data-attach="slash" role="menuitem" class="w-full text-left px-2 py-1.5 rounded text-sm text-[#dbdee1] hover:bg-[#5865F2] hover:text-white cursor-pointer">Use slash commands</button>
                <button type="button" data-attach="automation" role="menuitem" class="w-full text-left px-2 py-1.5 rounded text-sm text-[#dbdee1] hover:bg-[#5865F2] hover:text-white cursor-pointer">Automation builder</button>
                <button type="button" data-attach="invite" role="menuitem" class="w-full text-left px-2 py-1.5 rounded text-sm text-[#dbdee1] hover:bg-[#5865F2] hover:text-white cursor-pointer">Invite NEXBOT</button>
              </div>

              <!-- Floating XP Toast Container -->
              <div id="discord-xp-toast" class="absolute right-6 -top-12 pointer-events-none z-30"></div>

              <!-- Slash Command Autocomplete Popover -->
              <div id="discord-slash-popover" class="slash-popover absolute bottom-full left-4 right-4 mb-2 bg-[#2b2d31] border border-[#1f2023] rounded-lg shadow-2xl p-2 hidden z-30 max-h-64 overflow-y-auto discord-scroll">
                <div class="px-2 py-1 text-[11px] font-bold text-[#949ba4] uppercase tracking-wider border-b border-[#35373c]/50 mb-1 flex items-center justify-between">
                  <span>NEXBOT Registered Slash Commands</span>
                  <span class="text-[10px] text-[#5865F2] font-semibold">${SLASH_COMMANDS.length} Commands across ${COMMAND_CATEGORIES.length} Categories</span>
                </div>
                <div id="slash-command-options" class="space-y-0.5"></div>
              </div>

              <!-- Quoted Reply Banner -->
              <div id="discord-reply-banner" class="reply-banner bg-[#2b2d31] rounded-t-lg px-3 py-1.5 flex items-center justify-between text-xs text-[#b5bac1] border-b border-[#1f2023] hidden">
                <div class="flex items-center gap-2 truncate">
                  <span class="text-[#949ba4]">Replying to</span>
                  <span id="reply-banner-author" class="font-bold text-[#f2f3f5]"></span>
                  <span id="reply-banner-preview" class="text-[#949ba4] truncate max-w-xs"></span>
                </div>
                <button id="btn-cancel-reply" class="text-[#949ba4] hover:text-white p-0.5" title="Cancel Reply">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>

              <!-- Input Form -->
              <div class="bg-[#383a40] rounded-lg flex items-center min-h-[44px] px-4 py-2.5 gap-3">
                <button id="btn-attach-menu" class="w-6 h-6 rounded-full bg-[#b5bac1] hover:bg-[#dbdee1] text-[#383a40] flex items-center justify-center flex-shrink-0 transition-colors cursor-pointer" title="More options" aria-label="More options" aria-haspopup="menu" aria-expanded="false">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-width="3" d="M12 5v14M5 12h14"></path></svg>
                </button>

                <textarea
                  id="discord-input"
                  rows="1"
                  placeholder="Message #${activeChan.name}"
                  class="flex-1 min-w-0 bg-transparent text-[#dbdee1] placeholder-[#6d6f78] text-sm resize-none focus:outline-none max-h-36 overflow-hidden leading-relaxed select-text"
                ></textarea>

                <div class="flex items-center gap-3 text-[#b5bac1] flex-shrink-0">
                  <button id="btn-send-gif" class="px-1 h-5 rounded border-2 border-current text-[10px] font-extrabold leading-none hover:text-[#dbdee1] cursor-pointer" title="Send a GIF" aria-label="Send a GIF">GIF</button>
                  <button id="btn-open-slash-menu" class="w-5 h-5 rounded border-2 border-current flex items-center justify-center text-[11px] font-extrabold leading-none hover:text-[#dbdee1] cursor-pointer" title="Slash commands (/)" aria-label="Open slash commands">/</button>
                  <button id="btn-quick-emoji" class="hover:text-[#dbdee1] cursor-pointer" title="Insert Emoji" aria-label="Insert emoji">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  </button>
                  <button id="btn-send-message" class="hover:text-[#5865F2] cursor-pointer" title="Send Message (Enter)" aria-label="Send message">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                  </button>
                </div>
              </div>
            </div>

          </div>

          <!-- Column 4: Rightmost Member Sidebar (240px) -->
          <div id="discord-members-sidebar" class="w-60 bg-[#2b2d31] hidden lg:flex flex-col flex-shrink-0 border-l border-[#1f2023] z-10">
            <div class="flex-1 overflow-y-auto discord-scroll px-2 pt-4 pb-2 space-y-4">
              <!-- Online Category -->
              <div>
                <div class="px-2 text-[11px] font-bold text-[#949ba4] tracking-wider uppercase mb-1">
                  ONLINE — <span id="count-online">12</span>
                </div>
                <div id="members-list-online" class="space-y-0.5"></div>
              </div>

              <!-- Offline Category -->
              <div>
                <div class="px-2 text-[11px] font-bold text-[#949ba4] tracking-wider uppercase mb-1">
                  OFFLINE — <span id="count-offline">3</span>
                </div>
                <div id="members-list-offline" class="space-y-0.5"></div>
              </div>
            </div>
          </div>

        </div>

        <!-- Add Bot to Server (OAuth Invite Modal) -->
        <div id="discord-invite-modal" class="discord-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 hidden">
          <div class="discord-modal-box bg-[#313338] border border-[#232428] rounded-lg shadow-2xl w-full max-w-md overflow-hidden text-[#dbdee1]">
            
            <!-- Modal Header -->
            <div class="p-6 text-center bg-[#2b2d31] border-b border-[#1f2023] space-y-2">
              <div class="w-16 h-16 mx-auto rounded-full bg-[#5865F2] flex items-center justify-center shadow-lg relative">
                <svg class="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
                <span class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#23a55a] border-2 border-[#2b2d31] flex items-center justify-center text-white text-xs font-bold">✓</span>
              </div>
              <h3 class="text-lg font-bold text-white flex items-center justify-center gap-1.5">
                <span>Add NEXBOT to your Server</span>
              </h3>
              <p class="text-xs text-[#949ba4]">An external application wants to access your Discord account & server</p>
            </div>

            <!-- Modal Content -->
            <div class="p-6 space-y-4">
              <div>
                <label class="block text-[11px] font-bold text-[#b5bac1] uppercase tracking-wider mb-2">ADD TO SERVER</label>
                <select id="modal-server-select" class="w-full bg-[#1e1f22] border border-[#3f4147] rounded p-2 text-sm text-[#f2f3f5] focus:outline-none focus:border-[#5865F2]">
                  <option>🌟 My Community Server (Community)</option>
                  <option>🎮 CS2 Trade & Arbitrage Squad</option>
                  <option>☕ Chill Lounge & Music Corner</option>
                </select>
              </div>

              <div>
                <label class="block text-[11px] font-bold text-[#b5bac1] uppercase tracking-wider mb-2">GRANTED PERMISSIONS</label>
                <div class="space-y-1.5 text-xs text-[#b5bac1]">
                  <div class="flex items-center gap-2 text-[#23a55a]">
                    <span>✓</span> <span class="text-[#dbdee1]">Use 36 Slash Commands (/balance, /ban, /giveaway, /skin)</span>
                  </div>
                  <div class="flex items-center gap-2 text-[#23a55a]">
                    <span>✓</span> <span class="text-[#dbdee1]">Send Messages & Real-Time CS2 Market Embeds</span>
                  </div>
                  <div class="flex items-center gap-2 text-[#23a55a]">
                    <span>✓</span> <span class="text-[#dbdee1]">Execute Visual Automation & Anti-Raid Defense</span>
                  </div>
                  <div class="flex items-center gap-2 text-[#23a55a]">
                    <span>✓</span> <span class="text-[#dbdee1]">Manage Support Tickets, Economy & Leveling</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="p-4 bg-[#2b2d31] flex items-center justify-between border-t border-[#1f2023]">
              <button id="btn-modal-cancel" class="text-xs text-[#dbdee1] hover:underline font-medium">Cancel</button>
              <button id="btn-modal-authorize" class="px-5 py-2 rounded bg-[#5865F2] hover:bg-[#4752c4] text-white font-bold text-xs shadow-md transition-colors">
                Authorize & Add Bot
              </button>
            </div>

          </div>
        </div>

        <!-- Standout Feature: Visual Custom Automation Builder Modal -->
        <div id="discord-automation-modal" class="discord-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 hidden">
          <div class="discord-modal-box bg-[#313338] border border-[#232428] rounded-xl shadow-2xl w-full max-w-xl overflow-hidden text-[#dbdee1]">
            
            <!-- Modal Header -->
            <div class="p-5 bg-[#2b2d31] border-b border-[#1f2023] flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-[#5865F2]/20 border border-[#5865F2]/50 flex items-center justify-center text-[#5865F2]">
                  <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M7 2v11h3v9l7-12h-4l4-8z"/></svg>
                </div>
                <div>
                  <h3 class="text-base font-bold text-white flex items-center gap-2">
                    <span>NEXBOT Visual Automation Engine</span>
                    <span class="text-[10px] px-2 py-0.5 rounded-full bg-[#5865F2] text-white font-semibold">V8 Edge Isolates</span>
                  </h3>
                  <p class="text-xs text-[#949ba4]">Build event-driven rules: Trigger &rarr; Condition &rarr; Action</p>
                </div>
              </div>
              <button id="btn-close-auto-modal" class="text-[#949ba4] hover:text-white p-1 cursor-pointer" title="Close Modal">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <!-- Modal Body -->
            <div class="p-5 space-y-4 max-h-[70vh] overflow-y-auto discord-scroll text-xs">
              <!-- Preset Recipes -->
              <div>
                <label class="block text-[11px] font-bold text-[#b5bac1] uppercase tracking-wider mb-2">QUICK RECIPES & PRESETS</label>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button type="button" class="auto-preset-btn p-2.5 rounded bg-[#2b2d31] hover:bg-[#35373c] border border-[#3f4147] text-left transition-all cursor-pointer" data-preset="0">
                    <div class="font-bold text-white text-xs flex items-center gap-1.5">🛡️ Anti-Raid Shield</div>
                    <div class="text-[10px] text-[#949ba4] mt-0.5">Locks channel if &gt;8 joins / 10s</div>
                  </button>
                  <button type="button" class="auto-preset-btn p-2.5 rounded bg-[#2b2d31] hover:bg-[#35373c] border border-[#3f4147] text-left transition-all cursor-pointer" data-preset="1">
                    <div class="font-bold text-white text-xs flex items-center gap-1.5">🔗 Phish Blocker</div>
                    <div class="text-[10px] text-[#949ba4] mt-0.5">Purges scam links & timeouts</div>
                  </button>
                  <button type="button" class="auto-preset-btn p-2.5 rounded bg-[#2b2d31] hover:bg-[#35373c] border border-[#3f4147] text-left transition-all cursor-pointer" data-preset="2">
                    <div class="font-bold text-white text-xs flex items-center gap-1.5">🎫 Gatekeeper Role</div>
                    <div class="text-[10px] text-[#949ba4] mt-0.5">Assigns role if account &gt;14d</div>
                  </button>
                </div>
              </div>

              <!-- Rule Name -->
              <div>
                <label class="block text-[11px] font-bold text-[#b5bac1] uppercase tracking-wider mb-1">RULE PIPELINE NAME</label>
                <input id="auto-rule-name" type="text" value="Zero-Day Spam & Raid Interceptor" class="w-full bg-[#1e1f22] border border-[#3f4147] rounded p-2 text-sm text-[#f2f3f5] focus:outline-none focus:border-[#5865F2]" />
              </div>

              <!-- Visual Flow Steps -->
              <div class="space-y-2.5 bg-[#232428] p-3.5 rounded-lg border border-[#1f2023]">
                <!-- Step 1: Trigger -->
                <div class="flex items-center gap-3">
                  <div class="w-7 h-7 rounded-full bg-[#5865F2] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">1</div>
                  <div class="flex-1">
                    <label class="block text-[10px] font-bold text-[#949ba4] uppercase">WHEN EVENT OCCURS (TRIGGER)</label>
                    <select id="auto-trigger-select" class="w-full bg-[#1e1f22] border border-[#3f4147] rounded px-2.5 py-1.5 text-xs text-[#f2f3f5] focus:outline-none focus:border-[#5865F2]">
                      <option value="GUILD_MEMBER_JOIN">Member Joins Server (GUILD_MEMBER_JOIN)</option>
                      <option value="MESSAGE_CREATE">Message Sent in Channel (MESSAGE_CREATE)</option>
                      <option value="MESSAGE_ATTACHMENT_UPLOAD">File / Image Uploaded (MESSAGE_ATTACHMENT)</option>
                      <option value="REACTION_SPIKE">Reaction Rate Exceeded (REACTION_SPIKE)</option>
                    </select>
                  </div>
                </div>

                <div class="pl-3.5 text-[#5865F2] text-xs leading-none">↓</div>

                <!-- Step 2: Condition -->
                <div class="flex items-center gap-3">
                  <div class="w-7 h-7 rounded-full bg-[#f1c40f] text-[#1e1f22] flex items-center justify-center font-bold text-xs flex-shrink-0">2</div>
                  <div class="flex-1">
                    <label class="block text-[10px] font-bold text-[#949ba4] uppercase">IF CONDITION MATCHES (FILTER)</label>
                    <select id="auto-condition-select" class="w-full bg-[#1e1f22] border border-[#3f4147] rounded px-2.5 py-1.5 text-xs text-[#f2f3f5] focus:outline-none focus:border-[#5865F2]">
                      <option value="joins_within_10s > 8">Join Velocity: &gt;8 accounts in 10 seconds</option>
                      <option value="contains_phishing_link">Message Content matches known phishing / fake Nitro regex</option>
                      <option value="account_age_days < 3">Account Age &lt; 3 days (Suspicious Burner)</option>
                      <option value="user_message_velocity > 5_per_sec">User message rate &gt; 5 msg / sec</option>
                    </select>
                  </div>
                </div>

                <div class="pl-3.5 text-[#5865F2] text-xs leading-none">↓</div>

                <!-- Step 3: Action -->
                <div class="flex items-center gap-3">
                  <div class="w-7 h-7 rounded-full bg-[#2ecc71] text-[#1e1f22] flex items-center justify-center font-bold text-xs flex-shrink-0">3</div>
                  <div class="flex-1">
                    <label class="block text-[10px] font-bold text-[#949ba4] uppercase">THEN EXECUTE ACTION</label>
                    <select id="auto-action-select" class="w-full bg-[#1e1f22] border border-[#3f4147] rounded px-2.5 py-1.5 text-xs text-[#f2f3f5] focus:outline-none focus:border-[#5865F2]">
                      <option value="LOCK_CHANNEL_AND_MASS_BAN">Auto-lock channel, purge spam, and mass-ban tokens</option>
                      <option value="TIMEOUT_MEMBER_24H">Purge message and place author in 24h timeout</option>
                      <option value="ASSIGN_VERIFIED_ROLE">Auto-grant @Verified Member role and welcome embed</option>
                      <option value="ALERT_MOD_CHANNEL">Post priority incident dispatch to #mod-logs</option>
                    </select>
                  </div>
                </div>
              </div>

              <!-- Latency Info Pill -->
              <div class="flex items-center justify-between p-2 rounded bg-[#1e1f22] text-[#949ba4] text-[11px]">
                <span class="flex items-center gap-1.5 text-[#2ecc71]">
                  <span class="w-2 h-2 rounded-full bg-[#2ecc71] animate-pulse"></span>
                  Execution Latency: &lt;1.2ms (Zero-Cold-Start)
                </span>
                <span>Active Target: 14,820 Nodes</span>
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="p-4 bg-[#2b2d31] flex items-center justify-between border-t border-[#1f2023]">
              <button id="btn-auto-cancel" class="text-xs text-[#dbdee1] hover:underline font-medium cursor-pointer">Cancel</button>
              <button id="btn-auto-deploy" class="px-5 py-2 rounded bg-[#5865F2] hover:bg-[#4752c4] text-white font-bold text-xs shadow-md transition-colors flex items-center gap-1.5 cursor-pointer">
                <span>⚡ Deploy Pipeline to Cluster</span>
              </button>
            </div>

          </div>
        </div>

      </div>
    `;

    this.renderChannels();
    this.renderChannelTopSlot();
    this.renderMessages();
    this.renderMembers();
    this.renderVisitorProfile();
  }

  renderChannels() {
    const container = document.getElementById('discord-channels-list');
    if (!container) return;

    let html = '';
    const categories = [...new Set(DISCORD_CHANNELS.map(c => c.category))];

    const channelBadgeMap = {
      'cs2-arbitrage-alerts': `<span class="block w-2 h-2 rounded-full bg-[#23a55a] animate-pulse" title="Live market data"></span>`
    };

    categories.forEach(cat => {
      const chans = DISCORD_CHANNELS.filter(c => c.category === cat);
      if (!chans.length) return;

      html += `
        <div>
          <div class="flex items-center justify-between px-2 text-[11px] font-bold text-[#949ba4] tracking-wider uppercase mb-1">
            <div class="flex items-center gap-1">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
              <span>${cat}</span>
            </div>
          </div>
          <div class="space-y-0.5">
            ${chans.map(ch => {
              const isActive = ch.id === this.activeChannelId;
              const badge = channelBadgeMap[ch.id] || (ch.unread && !isActive ? `<span class="block w-2 h-2 rounded-full bg-[#f2f3f5]" title="Unread messages"></span>` : '');
              return `
                <div 
                  class="channel-item ${isActive ? 'active' : ''} rounded-[4px] px-2 py-1.5 flex items-center justify-between cursor-pointer group gap-1"
                  onclick="window.discordSim.switchChannel('${ch.id}')"
                >
                  <div class="flex items-center gap-1.5 text-sm font-medium min-w-0">
                    <span class="text-[#80848e] group-hover:text-[#dbdee1] font-bold text-base leading-none flex-shrink-0">#</span>
                    <span class="${isActive ? 'text-white font-semibold' : 'text-[#949ba4] group-hover:text-[#dbdee1]'} truncate text-[13px]">${ch.name}</span>
                  </div>
                  <div class="flex-shrink-0">${badge}</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  switchChannel(channelId) {
    if (this.activeChannelId === channelId) return;
    this.activeChannelId = channelId;
    discordAudio.playClick();

    const targetChan = DISCORD_CHANNELS.find(c => c.id === channelId);
    if (targetChan) {
      targetChan.unread = false;
      const titleEl = document.getElementById('current-channel-title');
      const topicEl = document.getElementById('current-channel-topic');
      const welcomeTitle = document.getElementById('welcome-title');
      const welcomeDesc = document.getElementById('welcome-desc');

      if (titleEl) titleEl.innerText = targetChan.name;
      if (topicEl) topicEl.innerText = targetChan.topic;
      if (welcomeTitle) welcomeTitle.innerText = `Welcome to #${targetChan.name}!`;
      if (welcomeDesc) welcomeDesc.innerText = targetChan.topic;

      const input = document.getElementById('discord-input');
      if (input) {
        input.placeholder = `Message #${targetChan.name}`;
      }
    }

    // The command usage banner belongs to the command that was just run, not to the next channel
    const inspector = document.getElementById('command-usage-inspector');
    if (inspector) inspector.classList.add('hidden');

    // A search only applies to the channel it was typed in
    this.messageSearch = '';
    const searchInput = document.getElementById('discord-search');
    if (searchInput) searchInput.value = '';

    this.renderChannels();
    this.renderChannelTopSlot();
    this.renderMessages();

    // When switching to #bot-commands or #cs2-arbitrage-alerts, scroll to top so the directory / top cards are visible
    if (channelId === 'bot-commands' || channelId === 'cs2-arbitrage-alerts') {
      this.scrollToTop();
    } else {
      this.scrollToBottom(true);
    }
  }

  /* ============================================================== */
  /* PINNED TOP PANEL FOR CHANNEL 3 (#cs2-arbitrage-alerts)         */
  /* ============================================================== */
  renderChannelQuickPrompts() {
    const bar = document.getElementById('channel-quick-prompts');
    if (!bar) return;
    const isAiChannel = this.activeChannelId === 'ai-assistant';
    bar.classList.toggle('hidden', !isAiChannel);
    bar.innerHTML = !isAiChannel ? '' : AI_ASSISTANT_SUGGESTIONS.slice(0, 6).map(prompt => `
      <button
        type="button"
        class="ai-suggestion-pill px-3 py-1 rounded-full bg-[#2b2d31] hover:bg-[#5865F2] text-xs text-[#dbdee1] hover:text-white cursor-pointer"
        data-prompt="${this.escapeHtml(prompt)}"
        onclick="window.discordSim.sendQuickPrompt(this.dataset.prompt)"
      >${this.escapeHtml(prompt)}</button>
    `).join('');
  }

  sendQuickPrompt(prompt) {
    const input = document.getElementById('discord-input');
    if (!input || !prompt) return;
    input.value = prompt;
    this.handleSendMessage();
  }

  sendGif() {
    const gifs = [
      { emoji: '🎉', caption: 'party' },
      { emoji: '🚀', caption: 'to the moon' },
      { emoji: '🔥', caption: 'on fire' },
      { emoji: '🤖', caption: 'robot dance' },
      { emoji: '💎', caption: 'diamond hands' }
    ];
    this.addMessageToChannel(this.activeChannelId, {
      id: `user_gif_${Date.now()}`,
      userId: this.visitor.id,
      gif: gifs[Math.floor(Math.random() * gifs.length)],
      timestamp: this.formatDiscordTime(new Date()),
      rawTime: Date.now(),
      reactions: []
    });
    discordAudio.playSendChime();
  }

  renderChannelTopSlot() {
    this.renderChannelQuickPrompts();

    const slot = document.getElementById('channel-pinned-top-slot');
    if (!slot) return;

    const welcomeBanner = document.getElementById('channel-welcome-banner');

    if (this.activeChannelId === 'bot-commands') {
      if (welcomeBanner) welcomeBanner.classList.add('hidden');
      slot.innerHTML = '';
      return;
    }

    if (welcomeBanner) welcomeBanner.classList.remove('hidden');
    slot.innerHTML = '';
  }

  /* ============================================================== */
  /* CHANNEL 1: INTERACTIVE COMMAND DIRECTORY & INSPECTOR           */
  /* ============================================================== */
  buildCommandDirectoryCardHtml(msg) {
    const selectedCat = this.activeCommandCategory || msg.activeCategory || 'All';
    const categoriesToRender = selectedCat === 'All'
      ? COMMAND_CATEGORIES
      : COMMAND_CATEGORIES.filter(c => c.id.toLowerCase() === selectedCat.toLowerCase());

    const quickExamples = [
      { cmd: '/balance', label: '/balance' },
      { cmd: '/daily', label: '/daily' },
      { cmd: '/giveaway start AWP | Asiimov', label: '/giveaway' },
      { cmd: '/ban @Raider Phishing link', label: '/ban' },
      { cmd: '/rank', label: '/rank' },
      { cmd: '/antiraid simulate', label: '/antiraid' },
      { cmd: '/skin AK-47 | Asiimov', label: '/skin' }
    ];

    return `
      <div class="mt-1 rounded bg-[#2b2d31] border-l-4 border-l-[#5865F2] overflow-hidden max-w-5xl">
        <!-- Top Hero Introduction Banner -->
        <div class="p-4 sm:p-5 bg-gradient-to-r from-[#232428] via-[#2b2d31] to-[#232428] border-b border-[#1f2023]">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="space-y-1">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#5865F2] text-white uppercase tracking-wider">
                  NEXBOT v4.2 • LIVE INTERACTIVE SANDBOX
                </span>
                <span class="text-xs font-mono text-[#2ecc71] flex items-center gap-1">
                  <span class="w-2 h-2 rounded-full bg-[#2ecc71] animate-pulse"></span>
                  ${SLASH_COMMANDS.length} Commands Active across ${COMMAND_CATEGORIES.length} Categories
                </span>
              </div>
              <h3 class="text-base sm:text-lg font-extrabold text-white tracking-tight">
                🤖 Welcome to NEXBOT — Full-Stack Discord Bot & Market Engine
              </h3>
              <p class="text-xs text-[#dbdee1] leading-relaxed max-w-3xl">
                <strong>NEXBOT</strong> is a modular, production-ready Discord bot uniting <strong>Automated Moderation & Anti-Raid Defense</strong>, a stateful <strong>Virtual Economy & Shop</strong>, <strong>Provably Fair Giveaways</strong>, <strong>Member Leveling & Profiles</strong>, <strong>Private Support Ticket Channels</strong>, a <strong>Visual Event-Driven Automation Builder</strong>, and <strong>Real-Time CS2 Skin Market Arbitrage</strong>.
              </p>
            </div>
          </div>

          <!-- Instant Demo Bar -->
          <div class="mt-3 pt-3 border-t border-[#35373c]/70 flex flex-wrap items-center gap-1.5">
            <span class="text-[11px] font-mono font-bold text-[#c9cdfb] mr-1">⚡ Click to Execute Instantly:</span>
            ${quickExamples.map(ex => `
              <button
                onclick="window.discordSim.executeCommandFromUI('${this.escapeHtml(ex.cmd)}')"
                class="px-2.5 py-1 rounded bg-[#5865F2]/20 hover:bg-[#5865F2] text-[#c9cdfb] hover:text-white border border-[#5865F2]/40 text-xs font-mono font-semibold transition-all cursor-pointer"
                title="Execute ${this.escapeHtml(ex.cmd)}"
              >
                ${this.escapeHtml(ex.label)}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Category Filter Tabs -->
        <div class="px-4 py-2.5 bg-[#232428] border-b border-[#1f2023] flex flex-wrap items-center gap-1.5">
          <button
            onclick="window.discordSim.setCommandDirectoryCategory('All')"
            class="px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${selectedCat === 'All' ? 'bg-[#5865F2] text-white' : 'bg-[#2b2d31] text-[#b5bac1] hover:bg-[#35373c] hover:text-white'}"
          >
            All
          </button>
          ${COMMAND_CATEGORIES.map(cat => {
            const count = SLASH_COMMANDS.filter(c => c.category === cat.id).length;
            const isAct = selectedCat.toLowerCase() === cat.id.toLowerCase();
            return `
              <button
                onclick="window.discordSim.setCommandDirectoryCategory('${cat.id}')"
                class="px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${isAct ? 'bg-[#5865F2] text-white' : 'bg-[#2b2d31] text-[#b5bac1] hover:bg-[#35373c] hover:text-white'}"
                title="${count} command${count === 1 ? '' : 's'}"
              >
                ${this.escapeHtml(cat.id)}
              </button>
            `;
          }).join('')}
        </div>

        <!-- Categorized Commands List -->
        <div class="p-4 space-y-5">
          ${categoriesToRender.map(cat => {
            const cmds = SLASH_COMMANDS.filter(c => c.category === cat.id);
            if (!cmds.length) return '';
            return `
              <div class="space-y-2">
                <div class="flex items-center justify-between border-b border-[#35373c] pb-1.5">
                  <div class="flex items-center gap-2">
                    <span class="text-base">${cat.icon}</span>
                    <span class="font-bold text-xs sm:text-sm text-white uppercase tracking-wider">${this.escapeHtml(cat.label)}</span>
                    <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#1e1f22] text-[#949ba4]">${cmds.length} command${cmds.length === 1 ? '' : 's'}</span>
                  </div>
                  <span class="text-[11px] text-[#949ba4] hidden sm:inline">${this.escapeHtml(cat.description)}</span>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                  ${cmds.map(cmd => `
                    <div 
                      onclick="window.discordSim.onCommandCardClick('${this.escapeHtml(cmd.name)}')"
                      class="cmd-directory-card group p-2.5 rounded-lg bg-[#232428] hover:bg-[#35373c]/80 border border-[#35373c] hover:border-[#5865F2] transition-all cursor-pointer flex flex-col justify-between gap-2"
                    >
                      <div class="space-y-1">
                        <div class="flex items-center justify-between gap-2">
                          <span class="font-mono font-bold text-xs sm:text-sm text-[#5865F2] group-hover:text-[#c9cdfb]">
                            ${this.escapeHtml(cmd.syntax)}
                          </span>
                          <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1e1f22] text-[#949ba4] flex-shrink-0">
                            ${this.escapeHtml(cmd.category)}
                          </span>
                        </div>
                        <p class="text-xs text-[#dbdee1] leading-snug">
                          ${this.escapeHtml(cmd.description)}
                        </p>
                      </div>

                      <div class="pt-1.5 border-t border-[#2b2d31] flex items-center justify-between gap-2">
                        <div class="text-[10px] font-mono text-[#949ba4] truncate" title="Example: ${this.escapeHtml(cmd.example)}">
                          Ex: <code class="text-[#c9cdfb] bg-[#1e1f22] px-1 py-0.5 rounded">${this.escapeHtml(cmd.example)}</code>
                        </div>
                        <div class="flex items-center gap-1 flex-shrink-0">
                          <button
                            onclick="event.stopPropagation(); window.discordSim.previewCommandInAutocomplete('${this.escapeHtml(cmd.name)}')"
                            class="px-2 py-0.5 rounded bg-[#2b2d31] hover:bg-[#4e5058] text-[#dbdee1] text-[10px] font-mono transition-colors cursor-pointer"
                            title="Inspect in Slash Command Autocomplete"
                          >
                            ⌨️ Inspect
                          </button>
                          <button
                            onclick="event.stopPropagation(); window.discordSim.executeCommandFromUI('${this.escapeHtml(cmd.example)}', '${this.escapeHtml(cmd.name)}')"
                            class="px-2 py-0.5 rounded bg-[#5865F2] hover:bg-[#4752c4] text-white text-[10px] font-mono font-bold transition-colors cursor-pointer"
                            title="Execute ${this.escapeHtml(cmd.example)} in server"
                          >
                            ▶ Execute
                          </button>
                        </div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Footer -->
        <div class="px-4 py-2.5 bg-[#232428] border-t border-[#1f2023] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#949ba4]">
          <span>💡 Click any command card above to see its usage & execute it live, or type <code class="text-white font-mono">/</code> in the chat box for autocomplete.</span>
          <div class="flex items-center gap-2">
            <button onclick="window.discordSim.switchChannel('ai-assistant')" class="text-[#c9cdfb] hover:underline font-mono cursor-pointer">Ask #ai-assistant &rarr;</button>
            <span>•</span>
            <button onclick="window.discordSim.switchChannel('cs2-arbitrage-alerts')" class="text-[#2ecc71] hover:underline font-mono cursor-pointer">Live CS2 Market &rarr;</button>
          </div>
        </div>
      </div>
    `;
  }

  setCommandDirectoryCategory(catId) {
    discordAudio.playClick();
    this.activeCommandCategory = catId;
    this.renderMessages();
  }

  onCommandCardClick(cmdName) {
    const cmdObj = SLASH_COMMANDS.find(c => c.name === cmdName);
    if (!cmdObj) return;
    this.executeCommandFromUI(cmdObj.example, cmdObj.name);
  }

  showCommandInspector(cmdObj) {
    this.inspectedCommand = cmdObj;
    const inspector = document.getElementById('command-usage-inspector');
    if (!inspector || !cmdObj) return;

    inspector.classList.remove('hidden');
    inspector.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="px-2 py-0.5 rounded bg-[#5865F2] text-white font-mono font-bold">${this.escapeHtml(cmdObj.syntax)}</span>
          <span class="px-1.5 py-0.5 rounded bg-[#1e1f22] text-[#949ba4] font-mono text-[10px]">${this.escapeHtml(cmdObj.category)}</span>
          <span class="text-[#dbdee1]">${this.escapeHtml(cmdObj.description)}</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-[11px] font-mono text-[#949ba4]">Example: <code class="text-[#2ecc71] bg-[#1e1f22] px-1.5 py-0.5 rounded">${this.escapeHtml(cmdObj.example)}</code></span>
          <button
            onclick="window.discordSim.executeCommandFromUI('${this.escapeHtml(cmdObj.example)}', '${this.escapeHtml(cmdObj.name)}')"
            class="px-2.5 py-1 rounded bg-[#23a55a] hover:bg-[#1a6334] text-white font-mono font-bold text-[11px] cursor-pointer"
          >
            ▶ Run Again
          </button>
          <button
            onclick="document.getElementById('command-usage-inspector').classList.add('hidden')"
            class="text-[#949ba4] hover:text-white px-1 cursor-pointer"
            title="Dismiss"
          >✕</button>
        </div>
      </div>
    `;
  }

  previewCommandInAutocomplete(cmdName) {
    discordAudio.playClick();
    const cmdObj = SLASH_COMMANDS.find(c => c.name === cmdName);
    if (cmdObj) {
      this.showCommandInspector(cmdObj);
    }
    const input = document.getElementById('discord-input');
    if (input) {
      input.value = `/${cmdName}`;
      input.focus();
      this.openSlashAutocomplete(cmdName);
    }
  }

  executeCommandFromUI(commandText, cmdNameHint = null) {
    if (!commandText) return;
    const cleanCmdName = cmdNameHint || commandText.replace(/^\//, '').split(/\s+/)[0].toLowerCase();
    const cmdObj = SLASH_COMMANDS.find(c => c.name === cleanCmdName);
    if (cmdObj) {
      this.showCommandInspector(cmdObj);
    }

    const input = document.getElementById('discord-input');
    if (input) {
      input.value = commandText;
      this.handleSendMessage();
    }
  }

  /* ============================================================== */
  /* CHANNEL 3: REAL CS2 SKIN MARKET EMBED CARD RENDERER            */
  /* ============================================================== */
  buildCS2SkinEmbedCardHtml(skin) {
    const changePct = Number(skin.changePercent ?? skin.change24hPct ?? 0);
    const changeUsd = Number(skin.changeAmount ?? skin.change24hUsd ?? 0);
    const isUp = skin.changeDirection === 'up' || changePct > 0;
    const isDown = skin.changeDirection === 'down' || changePct < 0;
    const changeSign = isUp ? '+' : (isDown ? '-' : '');
    const changeArrow = isUp ? '▲' : (isDown ? '▼' : '━');
    const changeBadgeClass = isUp
      ? 'bg-[#23a55a]/20 text-[#2ecc71] border-[#23a55a]/50'
      : (isDown ? 'bg-[#f23f43]/20 text-[#f23f43] border-[#f23f43]/50' : 'bg-[#4e5058]/30 text-[#b5bac1] border-[#4e5058]');

    // StatTrak™ status badge (Requirement #4)
    let statTrakBadgeHtml = '';
    if (skin.isStatTrak) {
      statTrakBadgeHtml = `
        <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#cf6a32]/25 text-[#ff8c42] border border-[#cf6a32]/60">
          ★ StatTrak™ Equipped ${skin.normalLowestPrice ? `(Normal: $${Number(skin.normalLowestPrice).toFixed(2)})` : ''}
        </span>
      `;
    } else if (skin.statTrakSupported && skin.statTrakLowestPrice) {
      statTrakBadgeHtml = `
        <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-[#1e1f22] text-[#ff8c42] border border-[#cf6a32]/40">
          Normal • ★ StatTrak™ Ask: $${Number(skin.statTrakLowestPrice).toFixed(2)}
        </span>
      `;
    } else if (skin.statTrakSupported) {
      statTrakBadgeHtml = `
        <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-[#1e1f22] text-[#b5bac1] border border-white/10">
          Normal (StatTrak™ Available)
        </span>
      `;
    } else {
      statTrakBadgeHtml = `
        <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-[#1e1f22] text-[#80848e] border border-white/5">
          Standard (No StatTrak™ Variant)
        </span>
      `;
    }

    const marketList = Array.isArray(skin.markets)
      ? skin.markets
      : Object.entries(skin.markets || {}).map(([name, obj]) => ({ name, ...obj }));
    const bestListingUrl = skin.lowestListingUrl || skin.primaryListingUrl || (marketList[0] && marketList[0].url) || '#';

    return `
      <div class="mt-1.5 rounded bg-[#2b2d31] border-l-4 overflow-hidden max-w-4xl" style="border-left-color: ${skin.rarityColor || '#5865F2'}">
        <div class="p-3.5 sm:p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          
          <!-- Left 4 Cols: Actual CS2 Skin Image + Wear + Rarity -->
          <div class="md:col-span-4 flex flex-col items-center justify-center bg-gradient-to-b from-[#1e1f22] to-[#18191c] rounded-lg p-3 border border-white/5 relative overflow-hidden">
            <div class="w-full flex items-center justify-between gap-1 mb-1">
              <span class="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/5 text-[#dbdee1]">
                ${this.escapeHtml(skin.weapon || 'CS2 Item')}
              </span>
              <span class="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded" style="background-color: ${skin.rarityColor || '#eb4b4b'}22; color: ${skin.rarityColor || '#eb4b4b'}; border: 1px solid ${skin.rarityColor || '#eb4b4b'}55;">
                ${this.escapeHtml(skin.rarity || 'Covert')}
              </span>
            </div>

            <!-- Actual CS2 Skin Image from Official Steam Economy CDN -->
            <div class="h-28 sm:h-32 w-full flex items-center justify-center my-1">
              <img
                src="${this.escapeHtml(skin.image)}"
                alt="${this.escapeHtml(skin.fullName)}"
                referrerpolicy="no-referrer"
                loading="lazy"
                onerror="this.onerror=null; this.src='https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiFO0POlPPNSIeOaB2qf19F6ueZhW2e2wEt-t2jcytf6dymSO1JxA5oiRecLsRa5kIfkYr-241aLgotHz3-rkGoXuUp8oX57';"
                class="max-h-full max-w-full object-contain drop-shadow-[0_10px_18px_rgba(0,0,0,0.85)] hover:scale-105 transition-transform duration-200"
              />
            </div>

            <!-- Wear Condition Badge -->
            <div class="w-full flex items-center justify-between text-[11px] font-mono text-[#b5bac1] pt-1 border-t border-white/5">
              <span>Wear: <strong class="text-white">${this.escapeHtml(skin.wear)}</strong></span>
              <span class="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-[#dbdee1]">${this.escapeHtml(skin.wearShort || '')}</span>
            </div>
          </div>

          <!-- Right 8 Cols: Full Skin Name, StatTrak, Current Market Price, Movement, Markets & Links -->
          <div class="md:col-span-8 flex flex-col justify-between space-y-2.5">
            
            <!-- Title & StatTrak Row -->
            <div class="space-y-1">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <h4 class="text-sm sm:text-base font-extrabold text-white tracking-tight">
                  ${this.escapeHtml(skin.marketHashName || skin.fullName)}
                </h4>
                ${statTrakBadgeHtml}
              </div>

              <div class="flex flex-wrap items-center gap-2 text-[11px] text-[#949ba4] font-mono">
                <span>Condition: <strong class="text-[#dbdee1]">${this.escapeHtml(skin.wear)}</strong></span>
                <span>•</span>
                <span>Best Market: <strong class="text-[#2ecc71]">${this.escapeHtml(skin.lowestMarket)}</strong></span>
                ${skin.highestBid ? `<span>•</span><span>Top Buy Order: <strong class="text-[#dbdee1]">$${Number(skin.highestBid).toFixed(2)}</strong></span>` : ''}
              </div>
            </div>

            <!-- Primary Live Market Price & Movement Box -->
            <div class="p-2.5 rounded-lg bg-[#1e1f22] border border-[#35373c] flex flex-wrap items-center justify-between gap-3">
              <div>
                <div class="text-[10px] font-mono uppercase text-[#949ba4] tracking-wider">
                  Current Lowest Market Price (${this.escapeHtml(skin.lowestMarket)})
                </div>
                <div class="flex items-baseline gap-2.5 mt-0.5 flex-wrap">
                  <span class="text-xl sm:text-2xl font-black font-mono text-[#2ecc71]">
                    $${Number(skin.lowestPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span class="px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${changeBadgeClass}" title="${this.escapeHtml(skin.changePeriod || '24h Movement')}">
                    ${changeArrow} ${changeSign}$${Math.abs(changeUsd).toFixed(2)} (${changeSign}${Math.abs(changePct).toFixed(2)}%)
                  </span>
                </div>
              </div>

              <div class="text-right font-mono">
                <div class="text-[10px] text-[#949ba4] uppercase">Steam Market Reference</div>
                <div class="text-sm font-bold text-[#dbdee1]">
                  $${Number(skin.steamPrice || skin.lowestPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                ${skin.spreadUsd > 0 ? `
                  <div class="text-[10px] text-[#2ecc71] font-semibold">
                    Spread: $${Number(skin.spreadUsd).toFixed(2)} (${Number(skin.spreadPercent).toFixed(1)}%)
                  </div>
                ` : ''}
              </div>
            </div>

            <!-- Multi-Market Price & Direct Listing Links Grid -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              ${marketList.map((mObj) => {
                const mName = mObj.name || 'Market';
                const isCheapest = Boolean(mObj.isCheapest || mName === skin.lowestMarket);
                return `
                  <a
                    href="${this.escapeHtml(mObj.url || '#')}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="p-2 rounded bg-[#232428] hover:bg-[#35373c] border ${isCheapest ? 'border-[#2ecc71]/60' : 'border-[#35373c]'} transition-all flex flex-col justify-between group"
                    title="Open ${this.escapeHtml(skin.marketHashName || skin.fullName)} listing on ${this.escapeHtml(mName)}"
                  >
                    <div class="flex items-center justify-between text-[10px] font-mono text-[#949ba4] group-hover:text-white">
                      <span class="font-bold truncate">${this.escapeHtml(mName)}</span>
                      <span>↗</span>
                    </div>
                    <div class="text-xs sm:text-sm font-mono font-bold ${isCheapest ? 'text-[#2ecc71]' : 'text-[#f2f3f5]'} mt-0.5">
                      $${Number(mObj.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    ${mObj.highestBid ? `
                      <div class="text-[9px] font-mono text-[#80848e]">Bid: $${Number(mObj.highestBid).toFixed(2)}</div>
                    ` : `<div class="text-[9px] font-mono text-[#80848e]">View Listing ↗</div>`}
                  </a>
                `;
              }).join('')}
            </div>

            <!-- Footer Metadata: Data Provider & Last Successful Update Time -->
            <div class="pt-1.5 border-t border-[#35373c]/60 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-[#949ba4]">
              <div class="flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full ${skin.isLiveFeed ? 'bg-[#2ecc71]' : 'bg-[#f1c40f]'}"></span>
                <span>Source: <strong class="text-[#dbdee1]">${this.escapeHtml(skin.sourceName || 'CSGOTrader Live Multi-Market API')}</strong></span>
              </div>
              <div class="flex items-center gap-2">
                <span>Updated: <strong class="text-[#dbdee1]">${this.escapeHtml(skin.formattedUpdateTime || 'Just now')}</strong></span>
                <a
                  href="${this.escapeHtml(bestListingUrl)}"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-[#00a8fc] hover:underline font-bold"
                >
                  Open ${this.escapeHtml(skin.lowestMarket)} Listing ↗
                </a>
              </div>
            </div>

          </div>
        </div>
      </div>
    `;
  }

  renderVisitorProfile() {
    const container = document.getElementById('discord-user-panel');
    if (!container) return;

    container.innerHTML = `
      <div class="flex items-center gap-2 p-1 pl-1.5 rounded-md hover:bg-[#35373c]/70 cursor-pointer flex-1 min-w-0 mr-1 transition-colors" title="Account: ${this.visitor.name}">
        <div class="relative flex-shrink-0">
          <img src="${this.visitor.avatar}" alt="User Avatar" class="w-8 h-8 rounded-full bg-[#5865F2]" />
          <span class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#23a55a] border-2 border-[#232428]"></span>
        </div>
        <div class="min-w-0 flex-1 leading-none py-0.5">
          <div class="text-[#f2f3f5] font-semibold text-[13px] truncate leading-tight">${this.visitor.name}</div>
          <div class="text-[#949ba4] text-[11px] truncate leading-tight mt-0.5">Online</div>
        </div>
      </div>

      <!-- Real Discord Action Controls: Mic, Deafen, Settings -->
      <div class="flex items-center text-[#b5bac1] flex-shrink-0">
        <button id="discord-toggle-mic" class="w-8 h-8 flex items-center justify-center rounded hover:bg-[#35373c] hover:text-[#dbdee1] transition-colors" title="${this.isMuted ? 'Unmute' : 'Mute'}">
          ${this.isMuted ? `
            <svg class="w-4 h-4 text-[#f23f43]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
              <line x1="3" y1="3" x2="21" y2="21" stroke="#f23f43" stroke-width="2.5" stroke-linecap="round"/>
            </svg>
          ` : `
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
          `}
        </button>
        <button id="discord-toggle-deafen" class="w-8 h-8 flex items-center justify-center rounded hover:bg-[#35373c] hover:text-[#dbdee1] transition-colors" title="${this.isDeafened ? 'Undeafen' : 'Deafen'}">
          ${this.isDeafened ? `
            <svg class="w-4 h-4 text-[#f23f43]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3a9 9 0 0 0-9 9v7c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2H5v-1a7 7 0 0 1 14 0v1h-2a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-7a9 9 0 0 0-9-9z"/>
              <line x1="3" y1="3" x2="21" y2="21" stroke="#f23f43" stroke-width="2.5" stroke-linecap="round"/>
            </svg>
          ` : `
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3a9 9 0 0 0-9 9v7c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2H5v-1a7 7 0 0 1 14 0v1h-2a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-7a9 9 0 0 0-9-9z"/>
            </svg>
          `}
        </button>
        <button id="discord-open-settings" class="w-8 h-8 flex items-center justify-center rounded hover:bg-[#35373c] hover:text-[#dbdee1] transition-colors" title="Settings">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54A.484.484 0 0 0 13.9 2h-3.8c-.24 0-.45.17-.48.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.488.488 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.8c.24 0 .45-.17.48-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
          </svg>
        </button>
      </div>
    `;

    const micBtn = document.getElementById('discord-toggle-mic');
    if (micBtn) {
      micBtn.addEventListener('click', () => {
        this.isMuted = !this.isMuted;
        discordAudio.enabled = !this.isMuted;
        this.renderVisitorProfile();
      });
    }

    const deafenBtn = document.getElementById('discord-toggle-deafen');
    if (deafenBtn) {
      deafenBtn.addEventListener('click', () => {
        this.isDeafened = !this.isDeafened;
        if (this.isDeafened) {
          this.isMuted = true;
          discordAudio.enabled = false;
        }
        this.renderVisitorProfile();
      });
    }

    const settingsBtn = document.getElementById('discord-open-settings');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        this.openInviteModal();
      });
    }
  }

  showFloatingXPBadge(text) {
    return;
  }

  getCurrentMessages() {
    if (!this.channelStores[this.activeChannelId]) {
      this.channelStores[this.activeChannelId] = [];
    }
    return this.channelStores[this.activeChannelId];
  }

  renderMessages() {
    const stream = document.getElementById('discord-messages-stream');
    if (!stream) return;

    const search = (this.messageSearch || '').trim().toLowerCase();
    const messages = !search ? this.getCurrentMessages() : this.getCurrentMessages().filter(m => {
      const author = this.getUser(m.userId);
      return [m.content, author && author.name, m.embed && m.embed.title, m.embed && m.embed.description, m.skinData && m.skinData.fullName]
        .some(text => text && String(text).toLowerCase().includes(search));
    });
    let html = '';
    let lastAuthorId = null;
    let lastTime = 0;

    if (search && messages.length === 0) {
      stream.innerHTML = `<div class="py-10 text-center text-sm text-[#949ba4]">No messages in this channel match "${this.escapeHtml(this.messageSearch)}".</div>`;
      return;
    }

    if (messages.length === 0 && this.activeChannelId === 'cs2-arbitrage-alerts') {
      stream.innerHTML = `<div class="py-10 text-center text-sm text-[#949ba4]">No price alerts yet. Type a skin name below to look one up.</div>`;
      return;
    }

    messages.forEach(msg => {
      const baseAuthor = this.getUser(msg.userId);
      const author = msg.authorOverride
        ? { ...baseAuthor, ...msg.authorOverride }
        : baseAuthor;

      const isSpecialCard = Boolean(msg.isCommandDirectory || msg.isCS2SkinCard || msg.embed || msg.gif);
      const isConsecutive = !isSpecialCard && !msg.authorOverride && lastAuthorId === msg.userId && (msg.rawTime - lastTime < 300000) && !msg.replyToId;

      lastAuthorId = msg.userId;
      lastTime = msg.rawTime;

      // Reply Reference Header
      let replyHtml = '';
      if (msg.replyToId) {
        const repliedMsg = messages.find(m => m.id === msg.replyToId);
        if (repliedMsg) {
          const repliedAuthor = this.getUser(repliedMsg.userId);
          replyHtml = `
            <div class="flex items-center gap-1.5 text-xs text-[#b5bac1] mb-1 pl-4 relative before:content-[''] before:absolute before:left-0 before:top-2 before:w-3 before:h-2 before:border-l-2 before:border-t-2 before:border-[#4e5058] before:rounded-tl">
              <img src="${repliedAuthor.avatar}" class="w-3.5 h-3.5 rounded-full inline-block" />
              <span class="font-bold text-[#dbdee1]">@${this.escapeHtml(repliedAuthor.name)}</span>
              <span class="text-[#949ba4] truncate max-w-sm">${this.escapeHtml(repliedMsg.content || 'Embed Message')}</span>
            </div>
          `;
        }
      }

      // Special Card 1: Interactive Command Directory (#bot-commands)
      let specialBodyHtml = '';
      if (msg.isCommandDirectory) {
        specialBodyHtml = this.buildCommandDirectoryCardHtml(msg);
      } else if (msg.isCS2SkinCard && msg.skinData) {
        specialBodyHtml = this.buildCS2SkinEmbedCardHtml(msg.skinData);
      } else if (msg.gif) {
        specialBodyHtml = `
          <div class="discord-gif" role="img" aria-label="${this.escapeHtml(msg.gif.caption)} GIF">
            <span class="discord-gif-emoji">${msg.gif.emoji}</span>
            <span class="discord-gif-tag">GIF</span>
          </div>
        `;
      }

      // Standard Interactive Embed Card with Buttons
      let embedHtml = '';
      if (msg.embed) {
        const fieldsHtml = (msg.embed.fields || []).map(f => `
          <div class="${f.inline ? '' : 'col-span-3'} min-w-0">
            <div class="text-[11px] font-bold text-[#949ba4] uppercase tracking-wider">${this.escapeHtml(f.name)}</div>
            <div class="text-xs text-[#dbdee1] mt-0.5">${this.formatMarkdown(f.value)}</div>
          </div>
        `).join('');

        let buttonsHtml = '';
        if (msg.buttons && msg.buttons.length > 0) {
          buttonsHtml = `
            <div class="flex flex-wrap gap-2 pt-2 border-t border-[#35373c]/60">
              ${msg.buttons.map(btn => `
                <button 
                  onclick="window.discordSim.activityEngine.handleButtonClick('${btn.id}')"
                  class="discord-btn discord-btn-${btn.style || 'secondary'}"
                >
                  ${this.escapeHtml(btn.label)}
                </button>
              `).join('')}
            </div>
          `;
        }

        const statusBadgeHtml = msg.embed.statusBadge ? `
          <div class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#1e1f22] text-[#c9cdfb] border border-white/10">
            ${this.escapeHtml(msg.embed.statusBadge)}
          </div>
        ` : '';

        embedHtml = `
          <div class="mt-2 p-3.5 rounded bg-[#2b2d31] border-l-4 max-w-2xl space-y-2" style="border-left-color: ${msg.embed.color || '#5865F2'}">
            ${statusBadgeHtml}
            ${msg.embed.title ? `<div class="font-bold text-sm text-[#f2f3f5] leading-snug">${this.escapeHtml(msg.embed.title)}</div>` : ''}
            ${msg.embed.description ? `<div class="text-xs text-[#dbdee1] leading-relaxed whitespace-pre-line">${this.formatMarkdown(msg.embed.description)}</div>` : ''}
            ${fieldsHtml ? `<div class="grid grid-cols-3 gap-x-4 gap-y-2 pt-1">${fieldsHtml}</div>` : ''}
            ${buttonsHtml}
            ${msg.embed.footer ? `<div class="text-[10px] text-[#949ba4] pt-1.5 border-t border-[#35373c]/50 font-mono">${this.escapeHtml(msg.embed.footer)}</div>` : ''}
          </div>
        `;
      }

      // Reactions Pills
      let reactionsHtml = '';
      if (msg.reactions && msg.reactions.length > 0) {
        reactionsHtml = `
          <div class="flex flex-wrap gap-1 mt-1.5">
            ${msg.reactions.map(r => `
              <button 
                onclick="window.discordSim.toggleReaction('${msg.id}', '${r.emoji}')"
                class="reaction-pill ${r.userReacted ? 'reacted' : ''} px-2 py-0.5 rounded-lg bg-[#2b2d31] border border-transparent flex items-center gap-1.5 text-xs text-[#b5bac1] cursor-pointer"
                title="${r.users.length} reaction${r.users.length === 1 ? '' : 's'}"
              >
                <span>${r.emoji}</span>
                <span class="reaction-count font-semibold">${r.count}</span>
              </button>
            `).join('')}
          </div>
        `;
      }

      const hasMention = msg.content && (msg.content.includes(`@${this.visitor.name}`) || msg.content.includes('@Visitor'));

      if (isConsecutive) {
        html += `
          <div class="discord-message group relative py-0.5 px-3 sm:px-4 rounded ${hasMention ? 'has-mention' : ''}" data-msg-id="${msg.id}">
            <span class="absolute left-0 top-[5px] w-[60px] text-right text-[10px] leading-4 text-[#949ba4] opacity-0 group-hover:opacity-100 pointer-events-none">${(msg.timestamp || '').replace(/^.*\bat\s+/i, '')}</span>
            <div class="message-actions-toolbar absolute right-4 -top-3 bg-[#313338] border border-[#232428] rounded shadow-lg flex items-center z-10">
              <button onclick="window.discordSim.quickAddReaction('${msg.id}', '👍')" class="p-1 hover:bg-[#35373c] text-[#b5bac1] hover:text-white" title="Add Reaction">👍</button>
              <button onclick="window.discordSim.quickAddReaction('${msg.id}', '❤️')" class="p-1 hover:bg-[#35373c] text-[#b5bac1] hover:text-white" title="Add Reaction">❤️</button>
              <button onclick="window.discordSim.setReplyTarget('${msg.id}')" class="p-1 hover:bg-[#35373c] text-[#b5bac1] hover:text-white" title="Reply">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path></svg>
              </button>
            </div>

            <div class="pl-[52px] text-sm leading-relaxed text-[#dbdee1] break-words whitespace-pre-line">
              ${this.formatMarkdown(msg.content)}
              ${reactionsHtml}
            </div>
          </div>
        `;
      } else {
        html += `
          <div class="discord-message group relative py-1 px-3 sm:px-4 mt-2 rounded ${hasMention ? 'has-mention' : ''}" data-msg-id="${msg.id}">
            ${replyHtml}

            <div class="message-actions-toolbar absolute right-4 -top-3 bg-[#313338] border border-[#232428] rounded shadow-lg flex items-center z-10">
              <button onclick="window.discordSim.quickAddReaction('${msg.id}', '👍')" class="p-1 hover:bg-[#35373c] text-[#b5bac1] hover:text-white" title="Add Reaction">👍</button>
              <button onclick="window.discordSim.quickAddReaction('${msg.id}', '🔥')" class="p-1 hover:bg-[#35373c] text-[#b5bac1] hover:text-white" title="Add Reaction">🔥</button>
              <button onclick="window.discordSim.quickAddReaction('${msg.id}', '❤️')" class="p-1 hover:bg-[#35373c] text-[#b5bac1] hover:text-white" title="Add Reaction">❤️</button>
              <button onclick="window.discordSim.setReplyTarget('${msg.id}')" class="p-1 hover:bg-[#35373c] text-[#b5bac1] hover:text-white" title="Reply">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path></svg>
              </button>
            </div>

            <div class="flex items-start gap-3">
              <img src="${author.avatar}" alt="${this.escapeHtml(author.name)}" class="w-10 h-10 rounded-full flex-shrink-0 cursor-pointer hover:opacity-85 transition-opacity" />
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-1.5 leading-none mb-1 flex-wrap">
                  <span class="font-semibold text-sm cursor-pointer hover:underline" style="color: ${author.roleColor || '#f2f3f5'}">${this.escapeHtml(author.name)}</span>
                  ${(author.isBot || msg.isBot) ? `
                    <span class="bot-badge">
                      <svg class="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                      BOT
                    </span>
                  ` : ''}
                  <span class="text-xs text-[#949ba4] font-normal ml-1">${msg.timestamp || ''}</span>
                </div>
                <div class="text-sm leading-relaxed text-[#dbdee1] break-words">
                  ${msg.content ? `<div class="whitespace-pre-line">${this.formatMarkdown(msg.content)}</div>` : ''}
                  ${specialBodyHtml}
                  ${embedHtml}
                  ${reactionsHtml}
                </div>
              </div>
            </div>
          </div>
        `;
      }
    });

    stream.innerHTML = html;
  }

  renderMembers() {
    const onlineContainer = document.getElementById('members-list-online');
    const offlineContainer = document.getElementById('members-list-offline');
    if (!onlineContainer || !offlineContainer) return;

    const botMembers = this.members.filter(m => m.isBot);
    const onlineMembers = [...botMembers, this.visitor, ...this.members.filter(m => !m.isBot && m.status !== 'offline')];
    const offlineMembers = this.members.filter(m => !m.isBot && m.status === 'offline');

    const countOnlineEl = document.getElementById('count-online');
    const countOfflineEl = document.getElementById('count-offline');
    if (countOnlineEl) countOnlineEl.innerText = onlineMembers.length;
    if (countOfflineEl) countOfflineEl.innerText = offlineMembers.length;

    const renderUserItem = (u) => {
      let statusColor = '#23a55a';
      if (u.status === 'idle') statusColor = '#f0b232';
      if (u.status === 'dnd') statusColor = '#f23f43';
      if (u.status === 'offline') statusColor = '#80848e';

      return `
        <div class="flex items-center gap-2.5 px-2 py-1.5 rounded hover:bg-[#35373c] cursor-pointer group transition-colors">
          <div class="relative flex-shrink-0">
            <img src="${u.avatar}" class="w-8 h-8 rounded-full ${u.status === 'offline' ? 'opacity-60' : ''}" />
            <span class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#2b2d31]" style="background-color: ${statusColor}"></span>
          </div>
          <div class="min-w-0 flex-1 leading-tight">
            <div class="flex items-center gap-1 truncate">
              <span class="font-medium text-sm truncate ${u.status === 'offline' ? 'text-[#80848e]' : ''}" style="color: ${u.status !== 'offline' ? (u.roleColor || '#dbdee1') : '#80848e'}">
                ${this.escapeHtml(u.name)}
              </span>
              ${u.isBot ? `
                <span class="bot-badge text-[8px] h-3 px-1">
                  <svg class="w-2 h-2" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                  BOT
                </span>
              ` : ''}
            </div>
            ${u.customStatus ? `<div class="text-xs text-[#949ba4] truncate">${this.escapeHtml(u.customStatus)}</div>` : ''}
          </div>
        </div>
      `;
    };

    onlineContainer.innerHTML = onlineMembers.map(renderUserItem).join('');
    offlineContainer.innerHTML = offlineMembers.map(renderUserItem).join('');
  }

  formatMarkdown(text) {
    if (!text) return '';
    let escaped = this.escapeHtml(text);

    // Code blocks: ```code```
    escaped = escaped.replace(/```([\s\S]*?)```/g, '<pre class="bg-[#1e1f22] p-2.5 rounded text-xs text-[#e3e5e8] font-mono overflow-x-auto my-1.5 border border-[#35373c]/50"><code>$1</code></pre>');

    // Mentions: @User
    escaped = escaped.replace(/&lt;@(.*?)&gt;|@(\w+)/g, (match, p1, p2) => {
      const user = p1 || p2;
      return `<span class="bg-[#5865F2]/20 text-[#c9cdfb] font-semibold px-1 rounded hover:bg-[#5865F2] hover:text-white cursor-pointer transition-colors">@${user}</span>`;
    });

    // Inline code: `code`
    escaped = escaped.replace(/`([^`]+)`/g, '<code class="bg-[#1e1f22] px-1.5 py-0.5 rounded text-xs text-[#e3e5e8] font-mono border border-white/5">$1</code>');

    // Bold: **bold**
    escaped = escaped.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-white">$1</strong>');

    // Bullets: a line starting with "* " or "- "
    escaped = escaped.replace(/^[ \t]*[*-][ \t]+/gm, '• ');

    // Italic: *italic* (stays on one line, so a stray * can't slant a whole paragraph)
    escaped = escaped.replace(/\*([^*\n]+)\*/g, '<em class="italic">$1</em>');

    return escaped;
  }

  escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  addMessageToChannel(channelId, msg) {
    if (!this.channelStores[channelId]) {
      this.channelStores[channelId] = [];
    }
    this.channelStores[channelId].push(msg);

    if (channelId === this.activeChannelId) {
      this.renderMessages();
      this.scrollToBottom();
    } else {
      const ch = DISCORD_CHANNELS.find(c => c.id === channelId);
      if (ch) ch.unread = true;
      this.renderChannels();
    }
  }

  scrollToTop() {
    const container = document.getElementById('discord-messages-container');
    if (!container) return;
    container.scrollTop = 0;
  }

  scrollToBottom(instant = false) {
    const container = document.getElementById('discord-messages-container');
    if (!container) return;
    container.scrollTo({
      top: container.scrollHeight,
      behavior: instant ? 'auto' : 'smooth'
    });
  }

  setReplyTarget(msgId) {
    const messages = this.getCurrentMessages();
    const msg = messages.find(m => m.id === msgId);
    if (!msg) return;

    this.activeReplyMessage = msg;
    const author = this.getUser(msg.userId);

    const banner = document.getElementById('discord-reply-banner');
    const authorElem = document.getElementById('reply-banner-author');
    const previewElem = document.getElementById('reply-banner-preview');

    if (banner && authorElem && previewElem) {
      authorElem.innerText = `@${author.name}`;
      previewElem.innerText = msg.content ? `"${msg.content.slice(0, 50)}..."` : 'Embed Message';
      banner.classList.remove('hidden');
    }

    const input = document.getElementById('discord-input');
    if (input) input.focus();
  }

  clearReplyTarget() {
    this.activeReplyMessage = null;
    const banner = document.getElementById('discord-reply-banner');
    if (banner) banner.classList.add('hidden');
  }

  toggleReaction(msgId, emoji) {
    const messages = this.getCurrentMessages();
    const msg = messages.find(m => m.id === msgId);
    if (!msg) return;

    if (!msg.reactions) msg.reactions = [];
    let reaction = msg.reactions.find(r => r.emoji === emoji);
    if (reaction) {
      if (reaction.userReacted) {
        reaction.count--;
        reaction.userReacted = false;
        reaction.users = reaction.users.filter(u => u !== this.visitor.id);
        if (reaction.count <= 0) {
          msg.reactions = msg.reactions.filter(r => r.emoji !== emoji);
        }
      } else {
        reaction.count++;
        reaction.userReacted = true;
        reaction.users.push(this.visitor.id);
      }
    } else {
      msg.reactions.push({
        emoji: emoji,
        count: 1,
        users: [this.visitor.id],
        userReacted: true
      });
    }

    this.renderMessages();
  }

  quickAddReaction(msgId, emoji) {
    this.toggleReaction(msgId, emoji);
  }

  triggerPromptChip(commandText) {
    this.executeCommandFromUI(commandText);
  }

  openInviteModal() {
    discordAudio.playClick();
    const modal = document.getElementById('discord-invite-modal');
    if (modal) modal.classList.remove('hidden');
  }

  closeInviteModal() {
    const modal = document.getElementById('discord-invite-modal');
    if (modal) modal.classList.add('hidden');
  }

  openAutomationModal() {
    discordAudio.playClick();
    const modal = document.getElementById('discord-automation-modal');
    if (modal) modal.classList.remove('hidden');
  }

  closeAutomationModal() {
    const modal = document.getElementById('discord-automation-modal');
    if (modal) modal.classList.add('hidden');
  }

  applyAutomationPreset(index) {
    const preset = AUTOMATION_PRESETS[index];
    if (!preset) return;

    const nameInput = document.getElementById('auto-rule-name');
    const triggerSel = document.getElementById('auto-trigger-select');
    const condSel = document.getElementById('auto-condition-select');
    const actSel = document.getElementById('auto-action-select');

    if (nameInput) nameInput.value = preset.name;
    if (triggerSel) triggerSel.value = preset.trigger;
    if (condSel) condSel.value = preset.condition;
    if (actSel) actSel.value = preset.action;
    discordAudio.playClick();
  }

  bindEvents() {
    window.discordSim = this;

    const input = document.getElementById('discord-input');
    const sendBtn = document.getElementById('btn-send-message');
    const cancelReplyBtn = document.getElementById('btn-cancel-reply');
    const toggleMembersBtn = document.getElementById('btn-toggle-members');
    const btnSidebarAdd = document.getElementById('btn-sidebar-add');
    const btnOpenSlashMenu = document.getElementById('btn-open-slash-menu');

    const openSlashMenu = () => {
      if (input) {
        input.value = '/';
        input.focus();
        this.openSlashAutocomplete('');
      }
    };
    if (btnOpenSlashMenu) btnOpenSlashMenu.addEventListener('click', openSlashMenu);

    // Message search in the chat header
    const searchInput = document.getElementById('discord-search');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        this.messageSearch = searchInput.value;
        this.renderMessages();
      });
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          searchInput.value = '';
          this.messageSearch = '';
          this.renderMessages();
        }
      });
    }

    const btnSendGif = document.getElementById('btn-send-gif');
    if (btnSendGif) btnSendGif.addEventListener('click', () => this.sendGif());

    // Attachment (+) menu
    const btnAttach = document.getElementById('btn-attach-menu');
    const attachMenu = document.getElementById('discord-attach-menu');
    if (btnAttach && attachMenu) {
      const setAttachOpen = (open) => {
        attachMenu.classList.toggle('hidden', !open);
        btnAttach.setAttribute('aria-expanded', String(open));
      };
      btnAttach.addEventListener('click', (e) => {
        e.stopPropagation();
        setAttachOpen(attachMenu.classList.contains('hidden'));
      });
      attachMenu.addEventListener('click', (e) => {
        const action = e.target.closest('[data-attach]')?.dataset.attach;
        if (!action) return;
        setAttachOpen(false);
        if (action === 'slash') openSlashMenu();
        if (action === 'automation') this.openAutomationModal();
        if (action === 'invite') this.openInviteModal();
      });
      document.addEventListener('click', () => setAttachOpen(false));
    }

    // Automation Modal Buttons
    const btnAutoClose = document.getElementById('btn-close-auto-modal');
    const btnAutoCancel = document.getElementById('btn-auto-cancel');
    const btnAutoDeploy = document.getElementById('btn-auto-deploy');
    if (btnAutoClose) btnAutoClose.addEventListener('click', () => this.closeAutomationModal());
    if (btnAutoCancel) btnAutoCancel.addEventListener('click', () => this.closeAutomationModal());

    const presetBtns = document.querySelectorAll('.auto-preset-btn');
    presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-preset') || '0');
        this.applyAutomationPreset(idx);
      });
    });

    if (btnAutoDeploy) {
      btnAutoDeploy.addEventListener('click', () => {
        const name = document.getElementById('auto-rule-name')?.value || 'Custom Pipeline';
        const trigger = document.getElementById('auto-trigger-select')?.value || 'MESSAGE_CREATE';
        const condition = document.getElementById('auto-condition-select')?.value || 'spam_check';
        const action = document.getElementById('auto-action-select')?.value || 'LOG_ALERT';

        this.closeAutomationModal();
        const embed = this.activityEngine.auto.deployRule(name, trigger, condition, action);

        this.addMessageToChannel(this.activeChannelId, {
          id: `deploy_${Date.now()}`,
          userId: 'user_bot',
          isBot: true,
          embed,
          buttons: [
            { id: 'btn_top_automation', label: '⚡ Build Another Rule', style: 'secondary' }
          ],
          timestamp: this.formatDiscordTime(new Date()),
          rawTime: Date.now()
        });
      });
    }

    const btnQuickEmoji = document.getElementById('btn-quick-emoji');
    if (btnQuickEmoji) {
      btnQuickEmoji.addEventListener('click', () => {
        const emojis = ['🔥', '🚀', '✨', '💎', '🎉', '🛡️', '⚡', '🤖'];
        const chosen = emojis[Math.floor(Math.random() * emojis.length)];
        const inputElem = document.getElementById('discord-input');
        if (inputElem) {
          inputElem.value += (inputElem.value ? ' ' : '') + chosen;
          inputElem.focus();
        }
      });
    }

    // Modal buttons
    const btnModalCancel = document.getElementById('btn-modal-cancel');
    const btnModalAuthorize = document.getElementById('btn-modal-authorize');

    if (btnSidebarAdd) btnSidebarAdd.addEventListener('click', () => this.openInviteModal());

    // Windows Title Bar Controls
    const winMin = document.getElementById('win-btn-minimize');
    const winMax = document.getElementById('win-btn-maximize');
    const winClose = document.getElementById('win-btn-close');

    if (winMax) {
      winMax.addEventListener('click', () => {
        discordAudio.playClick();
        if (!document.fullscreenElement) {
          if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(() => {});
          }
        } else {
          if (document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
          }
        }
      });
    }

    if (winMin) {
      winMin.addEventListener('click', () => {
        discordAudio.playClick();
        const app = document.querySelector('.discord-app');
        if (app) {
          app.classList.toggle('opacity-30');
          setTimeout(() => app.classList.remove('opacity-30'), 700);
        }
      });
    }

    if (winClose) {
      winClose.addEventListener('click', () => {
        discordAudio.playClick();
        this.openInviteModal();
      });
    }

    if (btnModalCancel) btnModalCancel.addEventListener('click', () => this.closeInviteModal());
    if (btnModalAuthorize) {
      btnModalAuthorize.addEventListener('click', () => {
        discordAudio.playLevelUpChime();
        this.closeInviteModal();

        this.addMessageToChannel(this.activeChannelId, {
          id: `bot_added_${Date.now()}`,
          userId: 'user_bot',
          isBot: true,
          embed: {
            title: "🎉 NEXBOT Joined a New Server!",
            color: "#2ecc71",
            description: `**NEXBOT** was successfully authorized and invited to **My Community Server**!\n\nAll real-time CS2 trackers, AI commands, and economy features are ready. Type \`/help\` in your server to begin.`,
            footer: "Instant 10-second server setup • Over 14,821 servers"
          },
          timestamp: this.formatDiscordTime(new Date()),
          rawTime: Date.now(),
          reactions: [{ emoji: '🎉', count: 5, users: ['user_alex', 'user_emma', 'user_sarah'], userReacted: false }]
        });
      });
    }

    if (cancelReplyBtn) {
      cancelReplyBtn.addEventListener('click', () => this.clearReplyTarget());
    }

    if (toggleMembersBtn) {
      toggleMembersBtn.addEventListener('click', () => {
        const sidebar = document.getElementById('discord-members-sidebar');
        if (sidebar) {
          const isVisible = getComputedStyle(sidebar).display !== 'none';
          sidebar.classList.remove('hidden', 'lg:flex', 'flex');
          sidebar.classList.add(isVisible ? 'hidden' : 'flex');
        }
      });
    }

    if (sendBtn) {
      sendBtn.addEventListener('click', () => this.handleSendMessage());
    }

    if (input) {
      input.addEventListener('keydown', (e) => {
        if (this.slashAutocompleteOpen) {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.navigateSlash(1);
            return;
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            this.navigateSlash(-1);
            return;
          } else if (e.key === 'Tab') {
            e.preventDefault();
            this.selectCurrentSlashCommand(false);
            return;
          } else if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            // If user typed exact command or arguments, send; if just prefix, select and execute
            this.selectCurrentSlashCommand(true);
            return;
          } else if (e.key === 'Escape') {
            e.preventDefault();
            this.closeSlashAutocomplete();
            return;
          }
        }

        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.handleSendMessage();
        }
      });

      input.addEventListener('input', () => {
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 140) + 'px';
        input.style.overflowY = input.scrollHeight > 140 ? 'auto' : 'hidden';

        const val = input.value;
        if (val.startsWith('/')) {
          const queryPart = val.slice(1).split(/\s+/)[0];
          // Only show autocomplete while typing the command name or if explicitly opened
          if (!val.slice(1).includes(' ')) {
            this.openSlashAutocomplete(queryPart);
          } else {
            this.closeSlashAutocomplete();
          }
        } else {
          this.closeSlashAutocomplete();
        }
      });
    }
  }

  handleSendMessage() {
    const input = document.getElementById('discord-input');
    if (!input) return;

    const text = input.value.trim();
    if (!text) return;

    const replyMsg = this.activeReplyMessage;
    this.clearReplyTarget();

    // If user ran a slash command, show its usage in the inspector bar
    if (text.startsWith('/')) {
      const cmdToken = text.slice(1).trim().split(/\s+/)[0].toLowerCase();
      const matchedCmd = SLASH_COMMANDS.find(c => c.name === cmdToken);
      if (matchedCmd) {
        this.showCommandInspector(matchedCmd);
      }
    }

    const newMsg = {
      id: `user_msg_${Date.now()}`,
      userId: this.visitor.id,
      replyToId: replyMsg ? replyMsg.id : null,
      content: text,
      timestamp: this.formatDiscordTime(new Date()),
      rawTime: Date.now(),
      reactions: []
    };

    this.addMessageToChannel(this.activeChannelId, newMsg);
    discordAudio.playSendChime();

    input.value = '';
    input.style.height = 'auto';
    input.style.overflowY = 'hidden';
    this.closeSlashAutocomplete();

    // Trigger AI / Bot response pipeline
    this.activityEngine.handleVisitorMessage(text, replyMsg);
  }

  openSlashAutocomplete(filterQuery = '') {
    const popover = document.getElementById('discord-slash-popover');
    const optionsContainer = document.getElementById('slash-command-options');
    if (!popover || !optionsContainer) return;

    const query = filterQuery.toLowerCase().trim();
    const matches = SLASH_COMMANDS.filter(cmd =>
      cmd.name.toLowerCase().includes(query) ||
      cmd.category.toLowerCase().includes(query) ||
      cmd.description.toLowerCase().includes(query)
    );

    if (matches.length === 0) {
      this.closeSlashAutocomplete();
      return;
    }

    this.slashAutocompleteOpen = true;
    this.slashSelectedIndex = 0;
    popover.classList.remove('hidden');

    optionsContainer.innerHTML = matches.map((cmd, idx) => `
      <div 
        class="slash-cmd-item flex flex-col sm:flex-row sm:items-center justify-between p-2 rounded cursor-pointer transition-colors gap-1 ${idx === 0 ? 'bg-[#35373c]' : 'hover:bg-[#35373c]/50'}"
        data-index="${idx}"
        data-cmd="${this.escapeHtml(cmd.example)}"
        data-name="${this.escapeHtml(cmd.name)}"
        onclick="window.discordSim.applySlashCommand('${this.escapeHtml(cmd.example)}', '${this.escapeHtml(cmd.name)}', true)"
      >
        <div class="flex items-center gap-2 min-w-0">
          <span class="text-xs font-bold font-mono text-[#5865F2] flex-shrink-0">${this.escapeHtml(cmd.syntax)}</span>
          <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1e1f22] text-[#949ba4] flex-shrink-0">${this.escapeHtml(cmd.category)}</span>
          <span class="text-xs text-[#dbdee1] truncate">${this.escapeHtml(cmd.description)}</span>
        </div>
        <div class="flex items-center gap-2 flex-shrink-0">
          <span class="text-[10px] font-mono text-[#2ecc71]">Ex: ${this.escapeHtml(cmd.example)}</span>
        </div>
      </div>
    `).join('');
  }

  closeSlashAutocomplete() {
    this.slashAutocompleteOpen = false;
    const popover = document.getElementById('discord-slash-popover');
    if (popover) popover.classList.add('hidden');
  }

  navigateSlash(delta) {
    const items = document.querySelectorAll('.slash-cmd-item');
    if (!items.length) return;

    items[this.slashSelectedIndex]?.classList.remove('bg-[#35373c]');
    this.slashSelectedIndex = (this.slashSelectedIndex + delta + items.length) % items.length;
    items[this.slashSelectedIndex]?.classList.add('bg-[#35373c]');
    items[this.slashSelectedIndex]?.scrollIntoView({ block: 'nearest' });
  }

  selectCurrentSlashCommand(executeImmediately = false) {
    const items = document.querySelectorAll('.slash-cmd-item');
    const selected = items[this.slashSelectedIndex];
    if (selected) {
      const cmdExample = selected.getAttribute('data-cmd');
      const cmdName = selected.getAttribute('data-name');
      this.applySlashCommand(cmdExample, cmdName, executeImmediately);
    }
  }

  applySlashCommand(cmdExample, cmdName, executeImmediately = false) {
    const cmdObj = SLASH_COMMANDS.find(c => c.name === cmdName);
    if (cmdObj) {
      this.showCommandInspector(cmdObj);
    }

    const input = document.getElementById('discord-input');
    if (input) {
      input.value = cmdExample;
      input.focus();
    }
    this.closeSlashAutocomplete();

    if (executeImmediately) {
      this.handleSendMessage();
    }
  }
}
