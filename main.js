const { GoogleGenerativeAI } = require("@google/generative-ai");
const { TwitterApi } = require("twitter-api-v2");
const Snoowrap = require("snoowrap");
const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const { Console } = require("console");
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
require("dotenv").config();



function createWindow() {
    const win = new BrowserWindow({
        width: 1000,
        height: 700,
        show: false, // покажем после готовности — меньше мерцания
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
    // на macOS обычно приложение не закрывается полностью
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


// --- Twitter / X ---
const twitterClient = new TwitterApi({
    appKey: process.env.TWITTER_API_KEY,
    appSecret: process.env.TWITTER_API_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

const TWITTER_COMMUNITY_ID = process.env.TWITTER_COMMUNITY_ID;

async function sendToTwitter(payload) {
    const tweetBody = { text: payload.text };

    /*
    // Post to community if ID is set
    if (TWITTER_COMMUNITY_ID) {
        tweetBody.community_id = TWITTER_COMMUNITY_ID;
    }
    */
    // Upload media if any
    if (payload.media && payload.media.length > 0) {
        const mediaIds = [];
        for (const m of payload.media) {
            if (!m.path) continue;
            const mediaId = await twitterClient.v1.uploadMedia(m.path);
            mediaIds.push(mediaId);
        }
        if (mediaIds.length > 0) {
            tweetBody.media = { media_ids: mediaIds };
        }
    }

    const result = await twitterClient.v2.tweet(tweetBody);
    console.log("Twitter post result:", result);
    return result;
}

/*
// --- Reddit ---
const redditClient = new Snoowrap({
    userAgent: "NewsAutoSender/1.0.0",
    clientId: process.env.REDDIT_CLIENT_ID,
    clientSecret: process.env.REDDIT_CLIENT_SECRET,
    username: process.env.REDDIT_USERNAME,
    password: process.env.REDDIT_PASSWORD,
});

const REDDIT_SUBREDDIT = process.env.REDDIT_SUBREDDIT;

async function sendToReddit(payload) {
    const subreddit = redditClient.getSubreddit(REDDIT_SUBREDDIT);

    let result;

    // If there are images, submit as a link post with the first image
    if (payload.media && payload.media.length > 0 && payload.media[0].path) {
        // Reddit API doesn't support direct image upload via snoowrap,
        // so we submit a self post with text
        result = await subreddit.submitSelfpost({
            title: payload.text.substring(0, 300) || "New Post",
            text: payload.text,
        });
    } else {
        // Text-only post
        result = await subreddit.submitSelfpost({
            title: payload.text.substring(0, 300) || "New Post",
            text: payload.text,
        });
    }

    console.log("Reddit post result:", result.name);
    return { id: result.name, url: result.url };
}
*/

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

    // Multiple media — send as media group
    const mediaGroup = media.map((m, i) => ({
        type: m.kind === "video" ? "video" : "photo",
        media: `attach://file${i}`,
        ...(i === 0 ? { caption: text } : {}),
    }));

    const fileOptions = {};
    media.forEach((m, i) => {
        fileOptions[`file${i}`] = fs.createReadStream(m.path);
    });

    const result = await telegramBot.sendMediaGroup(chatId, mediaGroup, {}, fileOptions);
    console.log("Telegram media group result:", result.length, "messages");
    return { messageIds: result.map(r => r.message_id) };
}

async function SendPost(payload) {
    // payload = { text, media[], platforms }
    // media[] = { name, size, type, kind, path }

    console.log("=== SendPost called ===");
    console.log(JSON.stringify(payload, null, 2));

    const results = {};

    try {
        if (payload.platforms.x) {
            results.twitter = await sendToTwitter(payload);
        }
        // if (payload.platforms.reddit) {
        //     results.reddit = await sendToReddit(payload);
        // }
        if (payload.platforms.telegram) {
            results.telegram = await sendToTelegram(payload);
        }
    } catch (e) {
        console.error("SendPost error:", e);
        return { ok: false, error: e.message || String(e) };
    }

    return { ok: true, results };
}

// IPC handler: renderer -> main
ipcMain.handle("post:send", async (_event, payload) => {
    // Мини-валидация
    if (!payload || typeof payload !== "object") {
        return { ok: false, error: "Invalid payload" };
    }
    return await SendPost(payload);
});

