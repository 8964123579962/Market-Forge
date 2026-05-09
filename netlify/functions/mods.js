// netlify/functions/mods.js
// Fetches mod data from the Discord database channel and returns it as JSON.
// The bot posts rich embeds to DATABASE_CHANNEL_ID — we read those embed fields
// and reconstruct ModEntry objects on the fly.
//
// Required env vars (set in Netlify dashboard → Site configuration → Env variables):
//   DISCORD_BOT_TOKEN      — your bot token
//   DATABASE_CHANNEL_ID    — the channel where the bot stores mod embeds

const DISCORD_API = "https://discord.com/api/v10";

export const handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers };
  }

  const token = process.env.DISCORD_BOT_TOKEN;
  const channelId = process.env.DATABASE_CHANNEL_ID;

  if (!token || !channelId) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Missing DISCORD_BOT_TOKEN or DATABASE_CHANNEL_ID env vars." }),
    };
  }

  try {
    const mods = await fetchAllMods(token, channelId);
    return {
      statusCode: 200,
      headers: { ...headers, "Cache-Control": "public, s-maxage=300" },
      body: JSON.stringify({ mods, count: mods.length, fetched_at: new Date().toISOString() }),
    };
  } catch (err) {
    console.error("Error fetching mods:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};

// ─── Fetch up to 500 messages from the channel (10 pages × 100) ──────────────
async function fetchAllMods(token, channelId) {
  const allMods = [];
  let before = null;
  const pages = 5; // 5 × 100 = 500 messages max

  for (let i = 0; i < pages; i++) {
    const url = `${DISCORD_API}/channels/${channelId}/messages?limit=100${before ? `&before=${before}` : ""}`;
    const resp = await fetch(url, {
      headers: { Authorization: `Bot ${token}` },
    });

    if (!resp.ok) {
      const body = await resp.text();
      throw new Error(`Discord API ${resp.status}: ${body}`);
    }

    const messages = await resp.json();
    if (!messages.length) break;

    for (const msg of messages) {
      // The bot posts mod info as embeds
      for (const embed of (msg.embeds || [])) {
        const mod = embedToMod(embed, msg);
        if (mod) allMods.push(mod);
      }
    }

    before = messages[messages.length - 1].id;
    if (messages.length < 100) break; // no more pages
  }

  // Deduplicate by name (keep latest)
  const seen = new Map();
  for (const mod of allMods) {
    const key = mod.name.toLowerCase().trim();
    if (!seen.has(key)) seen.set(key, mod);
  }
  return Array.from(seen.values());
}

// ─── Parse a Discord embed into a ModEntry-like object ───────────────────────
function embedToMod(embed, msg) {
  // The bot's mod embeds always have a title (mod name)
  const name = embed.title?.replace(/^[🎮📦🗺️🎨👤✨🔷🔶]+\s*/, "").trim();
  if (!name || name.length < 2) return null;

  // Collect all field values by name
  const fields = {};
  for (const f of (embed.fields || [])) {
    const key = f.name
      .replace(/[^\w\s]/g, "")   // strip emoji
      .trim()
      .toLowerCase();
    fields[key] = f.value?.trim() || "";
  }

  // Helper to get field by partial key match
  const get = (...keys) => {
    for (const k of keys) {
      for (const [fk, fv] of Object.entries(fields)) {
        if (fk.includes(k)) return fv;
      }
    }
    return "";
  };

  const priceStr = get("price", "minecoins", "cost");
  const priceInt = parsePriceInt(priceStr);
  const ratingStr = get("rating", "stars", "score");
  const rating = parseFloat(ratingStr) || 0;

  return {
    name,
    category:     get("type", "category", "pack type") || "",
    price:        priceStr || "",
    price_int:    priceInt,
    studio:       get("studio", "creator", "author", "publisher") || "",
    description:  embed.description?.trim() || get("description", "about") || "",
    image_url:    embed.thumbnail?.url || embed.image?.url || "",
    rating,
    rating_count: parseRatingCount(ratingStr),
    genre:        get("genre", "vibe", "theme") || "",
    tags:         parseTags(get("tags", "keywords", "tag")),
    contents:     get("contents", "includes", "content") || "",
    marketplace_url: extractUrl(get("marketplace", "link", "url", "store")) || embed.url || "",
    download_url:    extractUrl(get("download", "mediafire", "drive", "file")) || "",
    featured:     false,
    added_at:     msg.timestamp || "",
    message_id:   msg.id,
  };
}

function parsePriceInt(str) {
  if (!str) return 0;
  const lower = str.toLowerCase();
  if (lower.includes("free") || lower === "0") return 0;
  const m = str.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}

function parseRatingCount(str) {
  if (!str) return 0;
  // e.g. "4.5/5 ⭐ (128 ratings)"
  const m = str.match(/\((\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}

function parseTags(str) {
  if (!str) return [];
  return str.split(/[\s,]+/).filter(Boolean).map(t =>
    t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()
  ).slice(0, 12);
}

function extractUrl(str) {
  if (!str) return "";
  const m = str.match(/https?:\/\/[^\s)>\]]+/);
  return m ? m[0] : "";
}
