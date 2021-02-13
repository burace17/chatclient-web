/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
 
const { app, ipcMain } = require("electron");
const keytar = require("keytar");
const fs = require("fs").promises;
const path = require("path");

const configDir = path.join(app.getPath("appData"), "chatclient");
const configPath = path.join(configDir, "servers.json");

async function getJSONFromFile(path) {
    const buffer = await fs.readFile(path);
    return JSON.parse(buffer);
}

async function getStoredServers() {
    let servers = [];
    try {
        servers = await getJSONFromFile(configPath);
    }
    catch {}

    return servers;
}

async function safeMkdir(dir) {
    try { await fs.mkdir(dir); }
    catch {}
}

async function getStoredPassword(_, address, username) {
    return await keytar.getPassword(address, username);
}

async function storeServerInfo(_, address, username, password) {
    let servers = await getStoredServers();
    servers = servers.filter(entry => entry.address !== address && entry.username !== username);
    servers.push({ address, username });
    await safeMkdir(configDir);

    try {
        await fs.writeFile(configPath, JSON.stringify(servers));
        await keytar.deletePassword(address, username);
        await keytar.setPassword(address, username, password);
    }
    catch (e) {
        console.error("store-server-info: " + e);
    }
}

async function removeServerInfo(_, address, username) {
    let servers = await getStoredServers();
    const index = servers.find(obj => obj.address === address && obj.username === username);
    if (index === -1)
        return;

    servers.splice(index, 1);
    await safeMkdir(configDir);

    try {
        await fs.writeFile(configPath, JSON.stringify(servers));
        await keytar.deletePassword(address, username);
    }
    catch (e) {
        console.error("remove-server-info: " + e);
    }
}

exports.setupIPCEvents = () => {
    ipcMain.handle("get-stored-servers", getStoredServers);
    ipcMain.handle("get-stored-password", getStoredPassword);
    ipcMain.handle("store-server-info", storeServerInfo);
    ipcMain.handle("remove-server-info", removeServerInfo);
}