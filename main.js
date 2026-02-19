const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

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

async function SendPost(payload) {
    // payload = { text, media[], platforms }
    // media[] = { name, size, type, kind, path }

    console.log("=== SendPost called ===");
    console.log(JSON.stringify(payload, null, 2));

    // TODO: тут позже будет реальная рассылка по API
    // например:
    // if (payload.platforms.telegram) await sendToTelegram(payload)
    // if (payload.platforms.reddit) await sendToReddit(payload)
    // ...

    return { ok: true, received: payload };
}

// IPC handler: renderer -> main
ipcMain.handle("post:send", async (_event, payload) => {
    // Мини-валидация
    if (!payload || typeof payload !== "object") {
        return { ok: false, error: "Invalid payload" };
    }
    return await SendPost(payload);
});