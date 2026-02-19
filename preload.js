const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
    ping: () => "pong",

    // Отправка поста в main.js (SendPost)
    sendPost: (payload) => ipcRenderer.invoke("post:send", payload)
});