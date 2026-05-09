# ⚒️ MarketForge

A Modrinth-style Minecraft Marketplace browser that syncs live from your Discord database channel.

## Stack
- **Frontend**: Pure HTML/CSS/JS (zero dependencies, blazing fast)
- **Backend**: Netlify Serverless Function — reads Discord channel embeds
- **Deploy**: Netlify (free tier works great)

---

## 🚀 Deploy to Netlify

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial MarketForge commit"
git remote add origin https://github.com/YOUR_USERNAME/marketforge.git
git push -u origin main
```

### 2. Connect to Netlify
1. Go to [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import an existing project**
2. Pick your GitHub repo
3. Build settings are auto-detected from `netlify.toml`:
   - **Publish directory**: `public`
   - **Functions directory**: `netlify/functions`
4. Click **Deploy site**

### 3. Set Environment Variables
In Netlify dashboard → **Site configuration** → **Environment variables**, add:

| Variable | Value |
|---|---|
| `DISCORD_BOT_TOKEN` | Your bot token (from Discord Developer Portal) |
| `DATABASE_CHANNEL_ID` | Your database channel ID (e.g. `1497109810959749203`) |

> ⚠️ Never commit your bot token to git. Always use env vars.

### 4. Redeploy
After setting env vars, trigger a new deploy: **Deploys** → **Trigger deploy** → **Deploy site**

---

## 🔄 How Sync Works

The Netlify function (`/netlify/functions/mods.js`) fetches up to **500 messages** from your Discord database channel and parses the bot's embed fields into mod objects.

The site auto-refreshes its data from the function every time someone visits. Responses are cached for **5 minutes** via Netlify CDN.

### What gets synced
Every embed the bot posts to `DATABASE_CHANNEL_ID` gets parsed:
- **Name** — from embed title
- **Category** — from `Type` / `Category` field  
- **Price** — from `Price` / `Minecoins` field
- **Studio** — from `Studio` / `Creator` field
- **Description** — from embed description or `Description` field
- **Image** — from embed thumbnail/image
- **Rating** — from `Rating` field (e.g. `4.5/5`)
- **Tags** — from `Tags` field
- **Links** — marketplace and download URLs from embed fields

---

## 🛠 Local Development

```bash
npm install
npx netlify dev
```

Set your env vars in a `.env` file (for local dev only):
```
DISCORD_BOT_TOKEN=your_token_here
DATABASE_CHANNEL_ID=1497109810959749203
```

Then visit http://localhost:8888

---

## 📁 Project Structure

```
marketforge/
├── public/
│   └── index.html          ← Full frontend (single file)
├── netlify/
│   └── functions/
│       └── mods.js         ← Discord sync function
├── netlify.toml            ← Netlify config
├── package.json
└── README.md
```
