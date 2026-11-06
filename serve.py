import http.server
import ssl
import os
import threading
import sys
import json
import gzip
import time
import urllib.request
import urllib.parse
from datetime import datetime, timezone

PORTFOLIO_DIR = os.path.dirname(os.path.abspath(__file__))
os.chdir(PORTFOLIO_DIR)

SKINS_JSON_PATH = os.path.join(PORTFOLIO_DIR, 'skins.json')
SNAPSHOT_JSON_PATH = os.path.join(PORTFOLIO_DIR, 'cs2-live-snapshot.json')

# Optional server-side API keys via environment variables (never exposed to client)
PRICEMPIRE_API_KEY = os.environ.get('PRICEMPIRE_API_KEY', '').strip()
CSFLOAT_API_KEY = os.environ.get('CSFLOAT_API_KEY', '').strip()

# Upstream live CS2 market endpoints (CSGOTrader Multi-Market Live Price Feed)
UPSTREAM_ENDPOINTS = {
    'steam': 'https://prices.csgotrader.app/latest/steam.json',
    'buff163': 'https://prices.csgotrader.app/latest/buff163.json',
    'csfloat': 'https://prices.csgotrader.app/latest/csfloat.json',
    'skinport': 'https://prices.csgotrader.app/latest/skinport.json',
}

WATCHLIST_SPECS = [
    ('AK-47 | Asiimov', 'Field-Tested', False),
    ('Desert Eagle | Printstream', 'Minimal Wear', False),
    ('AWP | Asiimov', 'Field-Tested', True),
    ('AK-47 | Case Hardened', 'Field-Tested', False),
    ('★ Butterfly Knife | Fade', 'Factory New', False),
    ('M4A1-S | Printstream', 'Field-Tested', True),
    ('★ Sport Gloves | Hedge Maze', 'Field-Tested', False),
    ('AWP | Dragon Lore', 'Field-Tested', False),
    ('USP-S | Kill Confirmed', 'Field-Tested', True),
    ('M4A4 | Neo-Noir', 'Factory New', False),
    ('★ Karambit | Doppler', 'Factory New', False),
    ('AWP | Hyper Beast', 'Minimal Wear', True),
    ('AK-47 | Vulcan', 'Minimal Wear', False),
    ('Glock-18 | Fade', 'Factory New', False),
    ('Glock-18 | Vogue', 'Factory New', True),
    ("★ Sport Gloves | Pandora's Box", 'Field-Tested', False),
]

WEAR_ABBR = {
    'Factory New': 'FN',
    'Minimal Wear': 'MW',
    'Field-Tested': 'FT',
    'Well-Worn': 'WW',
    'Battle-Scarred': 'BS',
}

ALL_WEARS = ['Factory New', 'Minimal Wear', 'Field-Tested', 'Well-Worn', 'Battle-Scarred']


class CS2MarketBackend:
    def __init__(self):
        self.lock = threading.Lock()
        self.skins_catalog = []
        self.skins_by_name = {}
        self.raw_tables = {}
        self.previous_prices = {}
        self.last_fetch_epoch = 0.0
        self.last_successful_iso = None
        self.provider_last_modified = None
        self.last_error = None
        self.cache_ttl = 120  # 2 minutes standard cache TTL
        self.min_force_interval = 20  # 20s rate-limit protection for manual refresh
        self._load_skins_catalog()
        self._load_disk_snapshot()

    def _load_skins_catalog(self):
        try:
            if os.path.exists(SKINS_JSON_PATH):
                with open(SKINS_JSON_PATH, 'r', encoding='utf-8-sig') as f:
                    data = json.load(f)
                    if isinstance(data, list):
                        self.skins_catalog = data
                        for s in data:
                            name = s.get('name')
                            if name and name not in self.skins_by_name:
                                self.skins_by_name[name] = s
                print(f"[CS2-Backend] Loaded {len(self.skins_by_name)} exact skin image records from skins.json")
        except Exception as e:
            print(f"[CS2-Backend] Failed to load skins.json: {e}", file=sys.stderr)

    def _load_disk_snapshot(self):
        try:
            if os.path.exists(SNAPSHOT_JSON_PATH):
                with open(SNAPSHOT_JSON_PATH, 'r', encoding='utf-8') as f:
                    snap = json.load(f)
                    self.last_successful_iso = snap.get('lastSuccessfulUpdate')
                    self.provider_last_modified = snap.get('providerLastModified')
                    for item in snap.get('items', []):
                        if item.get('marketHashName') and item.get('lowestPrice'):
                            self.previous_prices[item['marketHashName']] = item['lowestPrice']
        except Exception:
            pass

    def _fetch_upstream_table(self, url):
        req = urllib.request.Request(
            url,
            headers={
                'User-Agent': 'NEXBOT-CS2-Market-Monitor/3.2 (Portfolio Live Data Integration)',
                'Accept': 'application/json',
            }
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            raw = resp.read()
            if raw[:2] == b'\x1f\x8b':
                raw = gzip.decompress(raw)
            data = json.loads(raw.decode('utf-8'))
            last_mod = resp.headers.get('Last-Modified')
            return data, last_mod

    def refresh_if_needed(self, force=False):
        now = time.time()
        with self.lock:
            has_tables = bool(self.raw_tables.get('buff163') and self.raw_tables.get('csfloat'))
            if has_tables:
                elapsed = now - self.last_fetch_epoch
                if not force and elapsed < self.cache_ttl:
                    return True, False  # (ok, fetched_now)
                if force and elapsed < self.min_force_interval:
                    return True, False

            try:
                new_tables = {}
                latest_mod = None
                for key, url in UPSTREAM_ENDPOINTS.items():
                    tbl, mod = self._fetch_upstream_table(url)
                    new_tables[key] = tbl
                    if mod:
                        latest_mod = mod

                self.raw_tables = new_tables
                self.last_fetch_epoch = time.time()
                self.last_successful_iso = datetime.now(timezone.utc).isoformat()
                if latest_mod:
                    self.provider_last_modified = latest_mod
                self.last_error = None
                return True, True
            except Exception as err:
                self.last_error = str(err)
                print(f"[CS2-Backend] Upstream fetch error: {err}", file=sys.stderr)
                return has_tables, False

    def _extract_doppler_or_price(self, entry, market_key):
        if entry is None:
            return None, None
        if isinstance(entry, (int, float)):
            return float(entry), None
        if not isinstance(entry, dict):
            return None, None

        if market_key in ('buff163', 'csfloat'):
            starting = entry.get('starting_at')
            ask = None
            if isinstance(starting, dict):
                ask = starting.get('price')
                if ask is None and isinstance(starting.get('doppler'), dict):
                    vals = [v for v in starting['doppler'].values() if isinstance(v, (int, float)) and v > 0]
                    if vals:
                        ask = min(vals)
            elif isinstance(starting, (int, float)):
                ask = float(starting)
            if ask is None and isinstance(entry.get('price'), (int, float)):
                ask = float(entry['price'])

            buy_order = None
            highest = entry.get('highest_order')
            if isinstance(highest, dict):
                buy_order = highest.get('price')
                if buy_order is None and isinstance(highest.get('doppler'), dict):
                    vals = [v for v in highest['doppler'].values() if isinstance(v, (int, float)) and v > 0]
                    if vals:
                        buy_order = max(vals)
            elif isinstance(highest, (int, float)):
                buy_order = float(highest)
            return (round(float(ask), 2) if ask and ask > 0 else None), (round(float(buy_order), 2) if buy_order and buy_order > 0 else None)

        if market_key == 'skinport':
            ask = entry.get('starting_at') or entry.get('suggested_price')
            return (round(float(ask), 2) if isinstance(ask, (int, float)) and ask > 0 else None), None

        if market_key == 'steam':
            for field in ('last_24h', 'last_7d', 'last_30d', 'last_90d'):
                val = entry.get(field)
                if isinstance(val, (int, float)) and val > 0:
                    return round(float(val), 2), None
            return None, None

        return None, None

    def _build_listing_urls(self, base_name, full_hash_name):
        clean_search = base_name.replace('★ ', '').strip()
        q_clean = urllib.parse.quote(clean_search)
        q_hash = urllib.parse.quote(full_hash_name)
        return {
            'CSFloat': f'https://csfloat.com/search?market_hash_name={q_hash}',
            'Buff163': f'https://buff.163.com/market/csgo#tab=selling&page_num=1&search={q_clean}',
            'Skinport': f'https://skinport.com/market?search={q_clean}',
            'Steam Market': f'https://steamcommunity.com/market/listings/730/{q_hash}',
        }

    def build_skin_item(self, base_name, wear, is_stattrak=False):
        meta = self.skins_by_name.get(base_name, {})
        image_url = meta.get('image')
        weapon = meta.get('weapon') or (base_name.split('|')[0].replace('★', '').strip())
        category = meta.get('category') or ('Knives' if '★' in base_name and 'Gloves' not in base_name and 'Wraps' not in base_name else ('Gloves' if 'Gloves' in base_name or 'Wraps' in base_name else 'Weapons'))
        rarity = meta.get('rarity') or ('Extraordinary' if category in ('Knives', 'Gloves') else 'Covert')
        rarity_color = meta.get('rarityColor') or ('#e4ae39' if category in ('Knives', 'Gloves') else '#eb4b4b')

        if is_stattrak:
            if base_name.startswith('★ '):
                market_hash_name = f"★ StatTrak\u2122 {base_name[2:]} ({wear})"
            else:
                market_hash_name = f"StatTrak\u2122 {base_name} ({wear})"
        else:
            market_hash_name = f"{base_name} ({wear})"

        if base_name.startswith('★ '):
            st_hash_name = f"★ StatTrak\u2122 {base_name[2:]} ({wear})"
        else:
            st_hash_name = f"StatTrak\u2122 {base_name} ({wear})"
        normal_hash_name = f"{base_name} ({wear})"

        steam_tbl = self.raw_tables.get('steam', {})
        buff_tbl = self.raw_tables.get('buff163', {})
        float_tbl = self.raw_tables.get('csfloat', {})
        port_tbl = self.raw_tables.get('skinport', {})

        buff_ask, buff_bid = self._extract_doppler_or_price(buff_tbl.get(market_hash_name), 'buff163')
        float_ask, float_bid = self._extract_doppler_or_price(float_tbl.get(market_hash_name), 'csfloat')
        port_ask, _ = self._extract_doppler_or_price(port_tbl.get(market_hash_name), 'skinport')
        steam_ask, _ = self._extract_doppler_or_price(steam_tbl.get(market_hash_name), 'steam')

        # Check StatTrak counterpart availability and price
        st_buff, _ = self._extract_doppler_or_price(buff_tbl.get(st_hash_name), 'buff163')
        st_float, _ = self._extract_doppler_or_price(float_tbl.get(st_hash_name), 'csfloat')
        st_port, _ = self._extract_doppler_or_price(port_tbl.get(st_hash_name), 'skinport')
        st_prices = [p for p in (st_float, st_buff, st_port) if p is not None]
        stattrak_lowest_price = min(st_prices) if st_prices else None
        stattrak_supported = bool(stattrak_lowest_price is not None or is_stattrak)

        # Normal counterpart price when viewing StatTrak item
        norm_buff, _ = self._extract_doppler_or_price(buff_tbl.get(normal_hash_name), 'buff163')
        norm_float, _ = self._extract_doppler_or_price(float_tbl.get(normal_hash_name), 'csfloat')
        norm_prices = [p for p in (norm_float, norm_buff) if p is not None]
        normal_lowest_price = min(norm_prices) if norm_prices else None

        urls = self._build_listing_urls(base_name, market_hash_name)
        markets = []
        if float_ask is not None:
            markets.append({
                'name': 'CSFloat',
                'price': float_ask,
                'highestBid': float_bid,
                'fee': '2.0%',
                'url': urls['CSFloat']
            })
        if buff_ask is not None:
            markets.append({
                'name': 'Buff163',
                'price': buff_ask,
                'highestBid': buff_bid,
                'fee': '2.5%',
                'url': urls['Buff163']
            })
        if port_ask is not None:
            markets.append({
                'name': 'Skinport',
                'price': port_ask,
                'highestBid': None,
                'fee': '0% buyer',
                'url': urls['Skinport']
            })
        if steam_ask is not None:
            markets.append({
                'name': 'Steam Market',
                'price': steam_ask,
                'highestBid': None,
                'fee': '15.0%',
                'url': urls['Steam Market']
            })

        if not markets:
            return None

        markets_sorted = sorted(markets, key=lambda m: m['price'])
        cheapest = markets_sorted[0]
        highest_market = markets_sorted[-1]
        for m in markets:
            m['isCheapest'] = (m['name'] == cheapest['name'])

        # Calculate real historical price movement from Steam time-series or market bid/ask depth
        steam_entry = steam_tbl.get(market_hash_name) or {}
        s_24h = steam_entry.get('last_24h')
        s_7d = steam_entry.get('last_7d')
        s_30d = steam_entry.get('last_30d')
        s_90d = steam_entry.get('last_90d')

        change_amount = 0.0
        change_pct = 0.0
        change_period = '24h vs 7d'
        current_ref = cheapest['price']

        # Check if price changed since previous server snapshot first
        prev_live = self.previous_prices.get(market_hash_name)
        if prev_live is not None and abs(current_ref - prev_live) >= 0.01:
            change_amount = round(current_ref - prev_live, 2)
            change_pct = round((change_amount / prev_live) * 100, 2)
            change_period = 'Since Last Poll'
        elif isinstance(s_24h, (int, float)) and s_24h > 0 and isinstance(s_7d, (int, float)) and s_7d > 0:
            change_amount = round(float(s_24h) - float(s_7d), 2)
            change_pct = round((change_amount / float(s_7d)) * 100, 2)
            change_period = '24h vs 7d Avg'
        elif isinstance(s_7d, (int, float)) and s_7d > 0 and isinstance(s_30d, (int, float)) and s_30d > 0:
            change_amount = round(float(s_7d) - float(s_30d), 2)
            change_pct = round((change_amount / float(s_30d)) * 100, 2)
            change_period = '7d vs 30d Avg'
        elif isinstance(s_30d, (int, float)) and s_30d > 0 and isinstance(s_90d, (int, float)) and s_90d > 0:
            change_amount = round(float(s_30d) - float(s_90d), 2)
            change_pct = round((change_amount / float(s_90d)) * 100, 2)
            change_period = '30d vs 90d Avg'
        elif float_ask and buff_ask:
            change_amount = round(float_ask - buff_ask, 2)
            change_pct = round((change_amount / buff_ask) * 100, 2)
            change_period = 'CSFloat vs Buff163'

        self.previous_prices[market_hash_name] = current_ref

        # Calculate real cross-market spread between lowest cash market and highest market
        cash_markets = [m for m in markets if m['name'] != 'Steam Market']
        spread_pct = 0.0
        spread_usd = 0.0
        spread_pair = ''
        if len(cash_markets) >= 2:
            c_sorted = sorted(cash_markets, key=lambda x: x['price'])
            low_m = c_sorted[0]
            high_m = c_sorted[-1]
            spread_usd = round(high_m['price'] - low_m['price'], 2)
            spread_pct = round((spread_usd / low_m['price']) * 100, 2) if low_m['price'] > 0 else 0.0
            spread_pair = f"Buy {low_m['name']} (${low_m['price']:.2f}) -> {high_m['name']} (${high_m['price']:.2f})"

        return {
            'id': meta.get('id') or market_hash_name,
            'marketHashName': market_hash_name,
            'baseName': base_name,
            'fullName': f"{'StatTrak™ ' if is_stattrak and 'StatTrak' not in base_name else ''}{base_name}",
            'weapon': weapon,
            'category': category,
            'rarity': rarity,
            'rarityColor': rarity_color,
            'wear': wear,
            'wearShort': WEAR_ABBR.get(wear, 'FT'),
            'isStatTrak': is_stattrak,
            'statTrakSupported': stattrak_supported,
            'statTrakLowestPrice': stattrak_lowest_price,
            'normalLowestPrice': normal_lowest_price,
            'image': image_url,
            'lowestPrice': cheapest['price'],
            'lowestMarket': cheapest['name'],
            'lowestListingUrl': cheapest['url'],
            'highestBid': cheapest.get('highestBid') or buff_bid or float_bid,
            'steamPrice': steam_ask,
            'buffPrice': buff_ask,
            'csfloatPrice': float_ask,
            'skinportPrice': port_ask,
            'changeAmount': change_amount,
            'changePercent': change_pct,
            'changeDirection': 'up' if change_amount > 0 else ('down' if change_amount < 0 else 'flat'),
            'changePeriod': change_period,
            'spreadUsd': spread_usd,
            'spreadPercent': spread_pct,
            'spreadRoute': spread_pair,
            'markets': markets,
            'steamHistory': {
                'last_24h': s_24h,
                'last_7d': s_7d,
                'last_30d': s_30d,
                'last_90d': s_90d,
            },
            'sourceName': 'CSGOTrader Multi-Market API (CSFloat • Buff163 • Skinport • Steam)',
            'lastSuccessfulUpdate': self.last_successful_iso,
            'providerLastModified': self.provider_last_modified,
        }

    def get_watchlist_payload(self, force=False):
        ok, fetched_now = self.refresh_if_needed(force=force)
        if not ok and os.path.exists(SNAPSHOT_JSON_PATH):
            try:
                with open(SNAPSHOT_JSON_PATH, 'r', encoding='utf-8') as f:
                    cached = json.load(f)
                cached['isLive'] = False
                cached['liveStatus'] = 'degraded_cached'
                cached['error'] = f"Live provider temporarily unavailable ({self.last_error or 'network error'}). Showing last verified update."
                return cached
            except Exception:
                pass

        items = []
        for base_name, wear, is_st in WATCHLIST_SPECS:
            built = self.build_skin_item(base_name, wear, is_st)
            if built:
                items.append(built)

        is_live = (self.last_error is None) and bool(items)
        payload = {
            'ok': bool(items),
            'isLive': is_live,
            'liveStatus': 'live' if is_live else 'degraded_cached',
            'fetchedFreshNow': fetched_now,
            'provider': 'CSGOTrader Live Multi-Market API (Buff163, CSFloat, Skinport, Steam) + Official Steam Economy CDN Assets',
            'providerUrl': 'https://prices.csgotrader.app/latest/',
            'apiKeyConfigured': {
                'PRICEMPIRE_API_KEY': bool(PRICEMPIRE_API_KEY),
                'CSFLOAT_API_KEY': bool(CSFLOAT_API_KEY),
            },
            'lastSuccessfulUpdate': self.last_successful_iso,
            'providerLastModified': self.provider_last_modified,
            'refreshIntervalSeconds': 60,
            'serverCacheTtlSeconds': self.cache_ttl,
            'totalCatalogSkins': len(self.skins_by_name),
            'totalPricedVariants': len(self.raw_tables.get('buff163', {})),
            'error': self.last_error if not is_live else None,
            'items': items,
        }

        if is_live and items:
            try:
                with open(SNAPSHOT_JSON_PATH, 'w', encoding='utf-8') as f:
                    json.dump(payload, f, ensure_ascii=False, indent=2)
            except Exception as e:
                print(f"[CS2-Backend] Warning saving snapshot: {e}", file=sys.stderr)

        return payload

    def search_skins(self, query_str, limit=8):
        self.refresh_if_needed(force=False)
        q = (query_str or '').strip()
        if not q:
            return self.get_watchlist_payload(force=False)

        q_lower = q.lower()
        want_st = 'stattrak' in q_lower or 'st ' in q_lower or q_lower.startswith('st')
        clean_q = q_lower.replace('stattrak™', '').replace('stattrak', '').replace('★', '').strip()

        # Check if user specified a wear condition in query
        requested_wear = None
        for w_full, w_short in WEAR_ABBR.items():
            if w_full.lower() in clean_q or f"({w_short.lower()})" in clean_q or f" {w_short.lower()}" in clean_q:
                requested_wear = w_full
                clean_q = clean_q.replace(w_full.lower(), '').replace(f"({w_short.lower()})", '').strip()
                break

        clean_tokens = [t for t in clean_q.replace('|', ' ').replace('-', ' ').split() if t]

        matched_bases = []
        for base_name in self.skins_by_name.keys():
            b_norm = base_name.lower().replace('|', ' ').replace('-', ' ')
            if all(tok in b_norm for tok in clean_tokens):
                matched_bases.append(base_name)

        # Sort exact/shorter matches first
        matched_bases.sort(key=lambda n: (0 if clean_q in n.lower() else 1, len(n)))

        results = []
        wear_order = [requested_wear] if requested_wear else ['Field-Tested', 'Minimal Wear', 'Factory New', 'Well-Worn', 'Battle-Scarred']
        for base_name in matched_bases[:limit * 2]:
            for w in wear_order:
                item = self.build_skin_item(base_name, w, is_stattrak=want_st)
                if not item and want_st:
                    item = self.build_skin_item(base_name, w, is_stattrak=False)
                if item:
                    results.append(item)
                    break
            if len(results) >= limit:
                break

        return {
            'ok': True,
            'isLive': self.last_error is None,
            'liveStatus': 'live' if self.last_error is None else 'degraded_cached',
            'query': q,
            'lastSuccessfulUpdate': self.last_successful_iso,
            'providerLastModified': self.provider_last_modified,
            'provider': 'CSGOTrader Live Multi-Market API (Buff163, CSFloat, Skinport, Steam)',
            'error': self.last_error,
            'items': results,
        }


cs2_backend = CS2MarketBackend()


def load_dotenv_vars():
    """Reloads .env from the portfolio directory so API keys work immediately without server restart."""
    env_path = os.path.join(PORTFOLIO_DIR, '.env')
    if os.path.exists(env_path):
        try:
            with open(env_path, 'r', encoding='utf-8-sig') as f:
                for raw_line in f:
                    line = raw_line.strip()
                    if not line or line.startswith('#') or '=' not in line:
                        continue
                    k, v = line.split('=', 1)
                    k = k.strip()
                    v = v.strip().strip('"').strip("'")
                    if k and v:
                        os.environ[k] = v
        except Exception as e:
            print(f"[Env] Warning reading .env: {e}", file=sys.stderr)


NEXBOT_SYSTEM_INSTRUCTION = """You are NEXBOT AI, the official Discord bot architect and server automation assistant in this NEXBOT Discord simulator.
Talk like a friendly, sharp Discord bot developer chatting with someone, not like a sales page.

HOW TO ANSWER:
- Answer the exact question in your first sentence. Start with the answer, never with an introduction.
- Do not say who you are unless asked. Never open with "I am NEXBOT AI".
- Keep it short: usually 2-5 sentences, or a few bullets when listing things. Give more detail only when asked how to build something.
- Be specific to what the person said. If they ask for one random idea, give exactly one concrete, fun idea.
- Use Discord markdown: **bold**, `inline code`, and bullets that start with "- ". Never start a bullet with "*".
- Do not end every reply with a question. Ask one only when you truly need the answer.

1. TOPIC:
   - Discord, bots, servers, communities, gaming, and CS2 are all fine. Treat "random", "fun", or vague requests about bots as real questions and answer them.
   - Only if someone clearly wants something unrelated to all of these (e.g. homework, gossip, ordering food), say so in one short, friendly sentence and offer a related bot idea.

2. "IS THIS POSSIBLE?" AND BUILD QUESTIONS:
   - Say yes or no first, then explain how that exact feature would work.
   - Example: for a dice minigame with an economy, cover the bet, the roll, the payout, and how the wallet balance is saved. Mention real pieces such as Buttons, Select Menus, Modals, Embeds, a database, and a cooldown only when relevant.
   - Do not answer a feature idea with a list of existing commands. Mention an existing command only if it really helps.
   - Give a short code or command example only when asked how to code it.

3. KNOWLEDGE OF NEXBOT'S 36 IMPLEMENTED COMMANDS:
   - Moderation (11): `/antiraid simulate` (spawns 8-bot spam raid & auto-neutralizes in <300ms), `/ban`, `/unban`, `/kick`, `/timeout`, `/warn`, `/warnings`, `/lock`, `/unlock`, `/clear`, `/slowmode`.
   - Economy (10): `/balance`, `/daily`, `/weekly`, `/work`, `/pay`, `/shop`, `/inventory`, `/leaderboard`, `/coinflip`, `/rob`.
   - Giveaways (1): `/giveaway start [prize]`, `/giveaway end`, `/giveaway reroll`, `/giveaway list`.
   - Leveling & Profiles (4): `/rank`, `/profile`, `/rep`, `/daily-challenge`.
   - Support Tickets (1): `/ticket panel`, `/ticket create`, `/ticket claim`, `/ticket transcript`, `/ticket close`.
   - Visual Automation (2): `/automation` (interactive Trigger -> Condition -> Action builder), `/automod`.
   - Utility & Live CS2 Market (7): `/help`, `/ask`, `/skin [name]` (live multi-market prices across Buff163, CSFloat, Skinport, Steam), `/verify`, `/rules`, `/stats`, `/audit-log`.

4. HONESTY ABOUT EXISTING VS NEW DEVELOPMENT:
   - Be clear about what exists right now in this simulator and what would be new work. For example, `/coinflip` exists but a dice game does not yet. Never claim an unbuilt feature exists.
   - Do not invent wallet balances or live data; you cannot see them.
   - Use the conversation so far to understand follow-ups (e.g. "can u do that?", "what's that?", "how?")."""


class NexbotAIBackend:
    def __init__(self):
        self.sessions = {}

    def get_active_provider(self):
        load_dotenv_vars()
        gemini_key = os.environ.get('GEMINI_API_KEY') or os.environ.get('GOOGLE_API_KEY')
        groq_key = os.environ.get('GROQ_API_KEY')
        openrouter_key = os.environ.get('OPENROUTER_API_KEY')
        if gemini_key:
            return ('gemini', gemini_key, 'Google Gemini API (gemini-flash-lite-latest)')
        if groq_key:
            return ('groq', groq_key, 'Groq Cloud API (llama-3.3-70b-versatile)')
        if openrouter_key:
            return ('openrouter', openrouter_key, 'OpenRouter API (meta-llama/llama-3.3-70b-instruct:free)')
        return (None, None, None)

    def chat(self, message, history=None, session_id='default'):
        history = history or []
        provider, api_key, provider_label = self.get_active_provider()
        if not provider or not api_key:
            return {
                'ok': False,
                'configured': False,
                'error': 'No AI API key configured yet. Add GEMINI_API_KEY to .env.',
            }

        try:
            if provider == 'gemini':
                from google import genai
                from google.genai import types
                client = genai.Client(api_key=api_key)

                # Format multi-turn conversation history
                formatted_turns = []
                for turn in history[-8:]:
                    role_label = "Visitor" if turn.get("role") == "user" else "NEXBOT"
                    formatted_turns.append(f"{role_label}: {turn.get('content', '')}")
                formatted_turns.append(f"Visitor: {message}")
                combined_input = "\n\n".join(formatted_turns) if len(formatted_turns) > 1 else message

                cfg = types.GenerateContentConfig(
                    system_instruction=NEXBOT_SYSTEM_INSTRUCTION,
                    temperature=0.6,
                )

                # Try candidate models with graceful fallback if a model experiences high demand
                candidate_models = ['gemini-flash-lite-latest', 'gemini-flash-latest', 'gemini-3.5-flash-lite']
                last_err = None
                for attempt in range(2):
                    if attempt:
                        time.sleep(1.5)  # brief pause in case the failure was a short demand spike
                    for model_name in candidate_models:
                        try:
                            resp = client.models.generate_content(
                                model=model_name,
                                contents=combined_input,
                                config=cfg
                            )
                            reply_text = resp.text or ""
                            if reply_text.strip():
                                return {
                                    'ok': True,
                                    'configured': True,
                                    'provider': f'Google Gemini API ({model_name})',
                                    'reply': reply_text.strip(),
                                }
                        except Exception as me:
                            print(f"[AI] {model_name} failed: {str(me)[:200]}", file=sys.stderr)
                            last_err = me

                raise last_err or RuntimeError("No Gemini response received")

            elif provider in ('groq', 'openrouter'):
                endpoint = (
                    'https://api.groq.com/openai/v1/chat/completions'
                    if provider == 'groq'
                    else 'https://openrouter.ai/api/v1/chat/completions'
                )
                model_name = (
                    'llama-3.3-70b-versatile'
                    if provider == 'groq'
                    else 'meta-llama/llama-3.3-70b-instruct:free'
                )
                msgs = [{'role': 'system', 'content': NEXBOT_SYSTEM_INSTRUCTION}]
                for turn in history[-8:]:
                    r = 'user' if turn.get('role') == 'user' else 'assistant'
                    msgs.append({'role': r, 'content': str(turn.get('content', ''))})
                msgs.append({'role': 'user', 'content': message})

                req_body = json.dumps({
                    'model': model_name,
                    'messages': msgs,
                    'temperature': 0.6,
                    'max_tokens': 600,
                }).encode('utf-8')

                req = urllib.request.Request(
                    endpoint,
                    data=req_body,
                    headers={
                        'Authorization': f'Bearer {api_key}',
                        'Content-Type': 'application/json',
                        'User-Agent': 'NEXBOT-Discord-Simulator/4.2',
                    },
                    method='POST'
                )
                with urllib.request.urlopen(req, timeout=20) as resp:
                    resp_data = json.loads(resp.read().decode('utf-8'))
                    reply_text = resp_data['choices'][0]['message']['content']
                    return {
                        'ok': True,
                        'configured': True,
                        'provider': provider_label,
                        'reply': reply_text.strip(),
                    }

        except Exception as e:
            return {
                'ok': False,
                'configured': True,
                'provider': provider_label,
                'error': str(e),
            }


ai_backend = NexbotAIBackend()


class AIRateLimiter:
    """Sliding-window limits: per visitor per hour, plus a daily total so the free AI quota survives."""

    HOUR = 3600
    DAY = 86400

    def __init__(self, per_visitor_hourly, daily_total, clock=time.time):
        self.per_visitor_hourly = per_visitor_hourly
        self.daily_total = daily_total
        self.clock = clock
        self.lock = threading.Lock()
        self.visitors = {}
        self.all_requests = []

    def check(self, visitor):
        """Records the request if allowed. Returns (allowed, retry_after_seconds)."""
        now = self.clock()
        with self.lock:
            self.all_requests = [t for t in self.all_requests if now - t < self.DAY]
            for key in list(self.visitors):
                self.visitors[key] = [t for t in self.visitors[key] if now - t < self.HOUR]
                if not self.visitors[key]:
                    del self.visitors[key]

            mine = self.visitors.get(visitor, [])
            if len(mine) >= self.per_visitor_hourly:
                return False, int(self.HOUR - (now - mine[0])) + 1 if mine else self.HOUR
            if len(self.all_requests) >= self.daily_total:
                return False, int(self.DAY - (now - self.all_requests[0])) + 1 if self.all_requests else self.DAY

            self.visitors.setdefault(visitor, []).append(now)
            self.all_requests.append(now)
            return True, 0


load_dotenv_vars()
ai_rate_limiter = AIRateLimiter(
    per_visitor_hourly=int(os.environ.get('AI_RATE_LIMIT', '15')),
    daily_total=int(os.environ.get('AI_DAILY_LIMIT', '500')),
)

# Extra sites allowed to call the API, e.g. "https://myportfolio.com". The site's own pages always can.
ALLOWED_ORIGINS = {o.strip().rstrip('/') for o in os.environ.get('ALLOWED_ORIGINS', '').split(',') if o.strip()}
# Set on a host that sits behind a proxy, so visitors are told apart by their real address.
TRUST_PROXY = os.environ.get('TRUST_PROXY', '') == '1'

MAX_BODY_BYTES = 32 * 1024
MAX_MESSAGE_CHARS = 1000
MAX_HISTORY_TURNS = 10


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        origin = self.headers.get('Origin')
        if origin in ALLOWED_ORIGINS:
            self.send_header('Access-Control-Allow-Origin', origin)
            self.send_header('Vary', 'Origin')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def origin_allowed(self):
        origin = self.headers.get('Origin')
        if not origin or origin in ALLOWED_ORIGINS:
            return True
        return urllib.parse.urlparse(origin).netloc.lower() == (self.headers.get('Host') or '').lower()

    def visitor_address(self):
        forwarded = self.headers.get('X-Forwarded-For', '')
        if TRUST_PROXY and forwarded:
            return forwarded.split(',')[-1].strip()
        return self.client_address[0]

    def send_json(self, status, payload, extra_headers=None):
        body = json.dumps(payload, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        for name, value in (extra_headers or {}).items():
            self.send_header(name, value)
        self.end_headers()
        self.wfile.write(body)

    def handle_ai_chat(self):
        try:
            content_len = int(self.headers.get('Content-Length', 0))
        except ValueError:
            content_len = -1
        if content_len < 0 or content_len > MAX_BODY_BYTES:
            self.close_connection = True
            self.send_json(413, {'ok': False, 'error': 'Message is too large.'})
            return

        try:
            payload = json.loads(self.rfile.read(content_len).decode('utf-8') or '{}')
            user_message = (payload.get('message') or '').strip()
            history = payload.get('history') or []
            if not isinstance(user_message, str) or not isinstance(history, list):
                raise ValueError
        except (ValueError, AttributeError):
            self.send_json(400, {'ok': False, 'error': 'Invalid request.'})
            return

        if not user_message:
            self.send_json(400, {'ok': False, 'error': 'Message is empty.'})
            return
        if len(user_message) > MAX_MESSAGE_CHARS:
            self.send_json(400, {'ok': False, 'error': f'Please keep messages under {MAX_MESSAGE_CHARS} characters.'})
            return

        allowed, retry_after = ai_rate_limiter.check(self.visitor_address())
        if not allowed:
            minutes = max(1, retry_after // 60)
            self.send_json(429, {
                'ok': False,
                'error': f"You've reached the AI message limit for this demo. Please try again in about {minutes} minute{'s' if minutes != 1 else ''}.",
            }, {'Retry-After': str(retry_after)})
            return

        clean_history = [
            {'role': turn.get('role'), 'content': str(turn.get('content', ''))[:MAX_MESSAGE_CHARS * 2]}
            for turn in history[-MAX_HISTORY_TURNS:] if isinstance(turn, dict)
        ]
        result = ai_backend.chat(user_message, history=clean_history, session_id='default')
        if not result.get('ok'):
            # Provider errors stay in the server log; the page falls back to its built-in answers.
            print(f"[AI] Chat failed: {result.get('error')}", file=sys.stderr)
            result['error'] = 'The AI is temporarily unavailable.'
        self.send_json(200, result)

    def send_head(self):
        # The static file server must never hand out secrets or server code.
        # Checks the resolved path because Windows also opens ".env." and "key.pem::$DATA".
        resolved = os.path.relpath(self.translate_path(self.path), PORTFOLIO_DIR)
        for part in resolved.replace('\\', '/').split('/'):
            name = part.split(':')[0].rstrip('. ').lower()
            if part != '..' and part != '.' and (part.startswith('.') or name.endswith(('.pem', '.py'))):
                self.send_error(404, 'File not found')
                return None
        return super().send_head()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        if not self.origin_allowed():
            self.close_connection = True
            self.send_json(403, {'ok': False, 'error': 'This site may not use this API.'})
            return

        if parsed.path == '/api/ai/chat':
            try:
                self.handle_ai_chat()
            except Exception as e:
                print(f"[AI] Request failed: {e}", file=sys.stderr)
                self.send_json(500, {'ok': False, 'error': 'Server error.'})
            return

        self.send_response(404)
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path.startswith('/api/') and not self.origin_allowed():
            self.send_json(403, {'ok': False, 'error': 'This site may not use this API.'})
            return

        if parsed.path == '/api/ai/status':
            provider, _, label = ai_backend.get_active_provider()
            body = json.dumps({
                'ok': True,
                'configured': bool(provider),
                'provider': label,
            }).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return

        if parsed.path == '/api/cs2/market':
            params = urllib.parse.parse_qs(parsed.query)
            force = params.get('force', ['0'])[0] == '1'
            q = params.get('q', [''])[0].strip()
            try:
                if q:
                    data = cs2_backend.search_skins(q)
                else:
                    data = cs2_backend.get_watchlist_payload(force=force)
                body = json.dumps(data, ensure_ascii=False).encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.send_header('Content-Length', str(len(body)))
                self.end_headers()
                self.wfile.write(body)
            except Exception as e:
                err_body = json.dumps({
                    'ok': False,
                    'isLive': False,
                    'liveStatus': 'error',
                    'error': str(e),
                    'lastSuccessfulUpdate': cs2_backend.last_successful_iso,
                    'items': []
                }).encode('utf-8')
                self.send_response(500)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.send_header('Content-Length', str(len(err_body)))
                self.end_headers()
                self.wfile.write(err_body)
            return

        return super().do_GET()


def run_http(port=3000):
    try:
        server = http.server.ThreadingHTTPServer(('0.0.0.0', port), Handler)
        print(f"[HTTP] Portfolio live at: http://localhost:{port}")
        server.serve_forever()
    except Exception as e:
        print(f"[HTTP] Error on port {port}: {e}", file=sys.stderr)


def run_https(port=8443):
    cert_path = os.path.join(PORTFOLIO_DIR, 'cert.pem')
    key_path = os.path.join(PORTFOLIO_DIR, 'key.pem')
    if not (os.path.exists(cert_path) and os.path.exists(key_path)):
        print("[HTTPS] cert.pem or key.pem missing, HTTPS skipped.", file=sys.stderr)
        return

    try:
        server = http.server.ThreadingHTTPServer(('0.0.0.0', port), Handler)
        context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        context.load_cert_chain(certfile=cert_path, keyfile=key_path)
        server.socket = context.wrap_socket(server.socket, server_side=True)
        print(f"[HTTPS] Portfolio live at: https://localhost:{port}")
        server.serve_forever()
    except Exception as e:
        print(f"[HTTPS] Error on port {port}: {e}", file=sys.stderr)


if __name__ == '__main__':
    if '--sync-snapshot' in sys.argv:
        snap = cs2_backend.get_watchlist_payload(force=True)
        print(f"[CS2-Backend] Synced {len(snap.get('items', []))} live items. Provider Last-Modified: {snap.get('providerLastModified')}")
        sys.exit(0)

    # Pre-warm CS2 live market cache on server start in background thread
    threading.Thread(target=cs2_backend.get_watchlist_payload, kwargs={'force': True}, daemon=True).start()

    # Determine HTTP port (command-line arg, PORT env var, or default 8080)
    http_port = 8080
    for arg in sys.argv[1:]:
        if arg.isdigit():
            http_port = int(arg)
            break
    http_port = int(os.environ.get('PORT', http_port))

    threads = [threading.Thread(target=run_http, args=(http_port,), daemon=True)]
    # Hosts set PORT and handle HTTPS themselves; local HTTPS is only for pairing the phone controller.
    if 'PORT' not in os.environ:
        threads.append(threading.Thread(target=run_https, args=(8443,), daemon=True))

    for thread in threads:
        thread.start()

    print("Developer Portfolio server started successfully.")
    try:
        for thread in threads:
            thread.join()
    except KeyboardInterrupt:
        print("Server stopped.")
