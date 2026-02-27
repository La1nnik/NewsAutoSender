const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
    ping: () => "pong",

    translateText: (text) => ipcRenderer.invoke("translate", text),

    // Send post to main.js (SendPost)
    sendPost: (payload) => ipcRenderer.invoke("post:send", payload)
});