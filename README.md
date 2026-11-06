# NEXBOT — Autonomous Discord Intelligence Platform & Simulator 🤖

An interactive browser-based Discord desktop client simulator and autonomous AI bot platform. Emulates a complete Discord environment featuring real-time AI assistant chat (via Google Gemini / Groq), server channels, member roles, bot slash commands, and live Counter-Strike 2 skin market lookups.

![NEXBOT Discord](https://img.shields.io/badge/Platform-Discord%20Sandbox-5865F2?style=for-the-badge&logo=discord&logoColor=white)
![AI Powered](https://img.shields.io/badge/AI%20Engine-Gemini%20%2F%20Groq%20LLM-purple?style=for-the-badge)
![Live Servers](https://img.shields.io/badge/Simulated%20Servers-14%2C820%2B-emerald?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

---

## ✨ Features

- **💬 Full Discord UI Emulation:**
  - Pixel-perfect Discord dark mode aesthetic (`#1e1f22`, `#2b2d31`, `#313338`).
  - Interactive channel sidebar: `#general-chat`, `#market-signals`, `#bot-sandbox`, `#admin-logs`.
  - Member status list with custom avatars, role colors, and bot status badges.
  - Interactive chat input with command autocomplete, mentions, and typing indicators.
- **🧠 Multi-Provider AI Assistant:**
  - Integrated with **Google Gemini 1.5 / 2.0 Flash**, **Groq (Llama 3.3 70B)**, and **OpenRouter**.
  - Context-aware responses with persona tuning for trading, market analysis, and server moderation.
- **📊 Real-Time CS2 Market Integration:**
  - Command `/price <skin_name>`: Instant multi-marketplace price lookup (*Buff163, Skinport, CSFloat, Steam*).
  - Command `/arbitrage`: Live scan for top margin spread opportunities.
  - Command `/marketcap`: Aggregate CS2 market valuation snapshot.
- **⚡ Hot-Reloading Backend (`serve.py`):**
  - Python HTTP server handling API proxies, rate limiting, and CORS.
  - Instant `.env` reload on every message without server restart.

---

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/claycxx/nexbot-discord-platform.git
cd nexbot-discord-platform
```

### 2. Configure AI API Key (Optional for offline demo)
Copy the example environment template:
```bash
cp .env.example .env
```
Open `.env` in any text editor and paste your free [Gemini API Key](https://aistudio.google.com/app/apikey) or [Groq API Key](https://console.groq.com/keys).

### 3. Install dependencies & Launch
```bash
pip install -r requirements.txt
python serve.py
```
Open `http://localhost:3000` or `http://localhost:8000` (as printed in console) in your browser.

*(Note: The client UI will also run as a static HTML file by opening `index.html` directly, with built-in mock responses if `serve.py` is offline).*

---

## 🛠️ Bot Commands in Sandbox

| Command | Description |
| :--- | :--- |
| `!help` or `/help` | Lists all interactive Nexbot commands |
| `!price <item>` | Fetches live market price and order book depth |
| `!arbitrage` | Scans live market spreads for profit opportunities |
| `!stats` | Reports simulated bot uptime, active servers, and ping |
| `@Nexbot <message>` | Engages the LLM AI assistant directly in conversation |

---

## 🏗️ Architecture

- **`index.html` / `discord.html`**: Discord client markup styled with pure CSS.
- **`discord-style.css`**: Complete Discord dark theme styles matching Discord desktop.
- **`discord-simulator.js`**: UI state machine, message DOM dispatcher, sound effects, and user presence.
- **`discord-engine.js`**: Command parser, financial math calculations, and LLM query dispatcher.
- **`discord-data.js`**: Seed databases for demo servers, member rosters, and channel history.
- **`serve.py`**: Python API proxy supporting Gemini, Groq, and upstream market feeds.

---

## 📄 License

MIT License © [claycxx](https://github.com/claycxx)
