const { GoogleGenerativeAI } = require("@google/generative-ai");
const TelegramBot = require("node-telegram-bot-api");
const { Client, GatewayIntentBits, AttachmentBuilder } = require("discord.js");
const fs = require("fs");
const { Console } = require("console");
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
require("dotenv").config();



function createWindow() {
    const win = new BrowserWindow({
        width: 1000,
        height: 700,
        show: false, // show after ready — less flickering
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    win.loadFile("UI/index.html");

    win.once("ready-to-show", () => win.show());
}

app.whenReady().then(() => {
    createWindow();


    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();

    });
});

app.on("window-all-closed", () => {
    // on macOS the app usually doesn't quit completely
    if (process.platform !== "darwin") app.quit();
})


const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);





async function Translate(text) {
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    const result = await model.generateContent("Translate this from Russian to English without any explenations I want pure output: " + text);
    const response = await result.response;
    const translatedText = response.text();
    console.log(translatedText);
    return translatedText;
}

ipcMain.handle("translate", async (_event, text) => {

    const translatedText = await Translate(text);
    console.log("Returning translation:", translatedText);
    return translatedText;

});



// --- Discord ---
const discordClient = new Client({ intents: [GatewayIntentBits.Guilds] });
const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
let discordReady = false;

if (process.env.DISCORD_BOT_TOKEN) {
    discordClient.once("ready", () => {
        console.log(`Discord bot logged in as ${discordClient.user.tag}`);
        discordReady = true;
    });
    discordClient.login(process.env.DISCORD_BOT_TOKEN).catch(err => {
        console.error("Discord login failed:", err.message);
    });
}

async function sendToDiscord(payload) {
    if (!discordReady) {
        throw new Error("Discord bot is not ready or not configured");
    }

    const channel = await discordClient.channels.fetch(DISCORD_CHANNEL_ID);
    if (!channel || !channel.isTextBased()) {
        throw new Error("Discord channel not found or is not a text channel");
    }

    const text = payload.text || "";
    const media = (payload.media || []).filter(m => m.path);

    const files = media.map(m => new AttachmentBuilder(m.path, { name: m.name }));

    const result = await channel.send({
        content: text || undefined,
        files: files.length > 0 ? files : undefined,
    });

    console.log("Discord post result:", result.id);
    return { messageId: result.id, url: result.url };
}

// --- Telegram ---
const telegramBot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);
const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;

async function sendToTelegram(payload) {
    const chatId = TELEGRAM_CHANNEL_ID;
    const text = payload.text || "";
    const media = (payload.media || []).filter(m => m.path);

    // No media — just send text
    if (media.length === 0) {
        const result = await telegramBot.sendMessage(chatId, text || "(empty)");
        console.log("Telegram text result:", result.message_id);
        return { messageId: result.message_id };
    }

    // Single image
    if (media.length === 1 && media[0].kind === "image") {
        const result = await telegramBot.sendPhoto(chatId, fs.createReadStream(media[0].path), {
            caption: text,
        });
        console.log("Telegram photo result:", result.message_id);
        return { messageId: result.message_id };
    }

    // Single video
    if (media.length === 1 && media[0].kind === "video") {
        const result = await telegramBot.sendVideo(chatId, fs.createReadStream(media[0].path), {
            caption: text,
        });
        console.log("Telegram video result:", result.message_id);
        return { messageId: result.message_id };
    }

    // Multiple media
    const mediaGroup = media.map((m, i) => ({
        type: m.kind === "video" ? "video" : "photo",
        media: fs.createReadStream(m.path),
        ...(i === 0 ? { caption: text } : {}),
    }));

    const result = await telegramBot.sendMediaGroup(chatId, mediaGroup);
    console.log("Telegram media group result:", result.length, "messages");
    return { messageIds: result.map(r => r.message_id) };
}

async function SendPost(payload) {
    // payload = { text, media[], platforms }
    // media item = { name, size, type, kind, path }

    console.log("=== SendPost called ===");
    console.log(JSON.stringify(payload, null, 2));

    const results = {};

    try {
        if (payload.platforms.telegram) {
            results.telegram = await sendToTelegram(payload);
        }
        if (payload.platforms.discord) {
            results.discord = await sendToDiscord(payload);
        }
    } catch (e) {
        console.error("SendPost error:", e);
        return { ok: false, error: e.message || String(e) };
    }

    return { ok: true, results };
}

// IPC handler: renderer -> main
ipcMain.handle("post:send", async (_event, payload) => {
    // Basic validation
    if (!payload || typeof payload !== "object") {
        return { ok: false, error: "Invalid payload" };
    }
    return await SendPost(payload);
});

