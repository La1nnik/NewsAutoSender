# NewsAutoSender

A desktop application for composing and publishing news posts to **Telegram** and **Discord** simultaneously, with built-in **AI-powered translation** using Google Gemini.

Built with [Electron](https://www.electronjs.org/).

---

## Features

- **Multi-platform publishing** — send text and media to Telegram channels and Discord channels in one click.
- **AI Translation** — translate post text between languages using Google Gemini.
- **Media support** — attach images (PNG, JPG, WEBP, GIF) and videos (MP4, WEBM, MOV) via drag-and-drop or file picker.
- **Media gallery preview** — thumbnails with file info and one-click removal.
- **Language selector** — choose which version of the text to publish.

---

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- npm (bundled with Node.js)
- API keys / tokens for the services you want to use (see [Configuration](#configuration))

---

## Installation

```bash
git clone https://github.com/<your-username>/NewsAutoSender.git
cd NewsAutoSender
npm install
```

---

## Configuration

Create a `.env` file in the project root with the following variables:

```env
# Google Gemini (required for translation)
GEMINI_API_KEY=your_gemini_api_key

# Telegram (required for Telegram publishing)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHANNEL_ID=your_telegram_channel_id

# Discord (required for Discord publishing)
DISCORD_BOT_TOKEN=your_discord_bot_token
DISCORD_CHANNEL_ID=your_discord_channel_id
```

### Obtaining keys

| Service | How to get |
|---------|-----------|
| **Gemini API Key** | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| **Telegram Bot Token** | Create a bot via [@BotFather](https://t.me/BotFather) on Telegram |
| **Telegram Channel ID** | Forward a message from your channel to [@userinfobot](https://t.me/userinfobot) or use the Telegram API |
| **Discord Bot Token** | [Discord Developer Portal](https://discord.com/developers/applications) → Bot → Token |
| **Discord Channel ID** | Enable Developer Mode in Discord settings, then right-click a channel → *Copy Channel ID* |

> **Note:** The Telegram bot must be an admin in the target channel. The Discord bot must have `Send Messages` and `Attach Files` permissions in the target channel.

---

## Usage

```bash
npm start
```

1. **Write your text** in the text area.
2. *(Optional)* Click **Translate to English** to generate a translation, then select the language version you want to publish.
3. **Attach media** by dragging files into the drop zone or clicking **Choose files**.
4. **Select platforms** — toggle **Telegram** and/or **Discord**.
5. Click **PUBLISH** to send the post.

---


---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop framework | Electron 30 |
| AI / Translation | Google Generative AI (Gemini) |
| Telegram | node-telegram-bot-api |
| Discord | discord.js v14 |
| Env management | dotenv |

---

## License

ISC
