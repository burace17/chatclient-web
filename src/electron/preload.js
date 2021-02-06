const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("credentialManager", {
    getStoredServers: async () => await ipcRenderer.invoke("get-stored-servers"),
    getStoredPassword: async (address, username) => await ipcRenderer.invoke("get-stored-password", address, username),
    storeServerInfo: async (address, username, password) => await ipcRenderer.invoke("store-server-info", address, username, password),
    removeServerInfo: async (address, username) => await ipcRenderer.invoke("remove-server-info", address, username),
});
