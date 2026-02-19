const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
    ping: () => "pong",

    translateText: (text) => ipcRenderer.invoke("translate", text),

    // Отправка поста в main.js (SendPost)
    sendPost: (payload) => ipcRenderer.invoke("post:send", payload)
});