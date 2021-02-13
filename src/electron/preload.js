/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
 
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("credentialManager", {
    getStoredServers: async () => await ipcRenderer.invoke("get-stored-servers"),
    getStoredPassword: async (address, username) => await ipcRenderer.invoke("get-stored-password", address, username),
    storeServerInfo: async (address, username, password) => await ipcRenderer.invoke("store-server-info", address, username, password),
    removeServerInfo: async (address, username) => await ipcRenderer.invoke("remove-server-info", address, username),
});
