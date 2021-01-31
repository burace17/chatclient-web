// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const keytar = require("keytar");
const fs = require("fs").promises;

// Ignore certificate errors for development.
if (process.env.NODE_ENV === "development") {
    app.commandLine.appendSwitch("ignore-certificate-errors", "true");
}

function createWindow() {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, "preload.js")
        }
    });

    // TODO: I think I will need to change this for release mode.
    mainWindow.loadURL("http://localhost:3000");

    // Open the DevTools.
    mainWindow.webContents.openDevTools();

    mainWindow.maximize();
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    createWindow();

    app.on("activate", function () {
        // On macOS it"s common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

// Quit when all windows are closed, except on macOS. There, it"s common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", function () {
    if (process.platform !== "darwin") app.quit();
});

async function getJSONFromFile(path) {
    const buffer = await fs.readFile(path);
    return JSON.parse(buffer);
}

async function ignoreErrors(f) {
    try { return await f(); }
    catch { return null; }
}

const configDir = path.join(app.getPath("appData"), "chatclient");
const configPath = path.join(configDir, "servers.json");

ipcMain.handle("get-stored-servers", async () => {
    let servers = [];
    try {
        servers = await getJSONFromFile(configPath);
    }
    catch (e) {
        // for now we're just logging errors and not notifying the client. I think this is fine.
        console.error("get-stored-servers: " + e);
    }

    return servers;
});

ipcMain.handle("get-stored-password", async (_, address, username) => {
    return await keytar.getPassword(address, username);
});

ipcMain.handle("store-server-info", async (_, address, username, password) => {
    let servers = (await ignoreErrors(async () => await getJSONFromFile(configPath))) ?? [];
    servers.push({ address, username });
    ignoreErrors(async () => await fs.mkdir(configDir));

    try {
        await fs.writeFile(configPath, JSON.stringify(servers));
        await keytar.setPassword(address, username, password);
    }
    catch (e) {
        console.error("store-server-info: " + e);
    }
});

ipcMain.handle("remove-server-info", async (_, address, username) =>
{
    let servers = (await ignoreErrors(async () => await getJSONFromFile(configPath))) ?? [];
    const index = servers.find(obj => obj.address === address && obj.username === username);
    if (index === -1)
        return;

    servers.splice(index, 1);
    ignoreErrors(async () => await fs.mkdir(configDir));

    try {
        await fs.writeFile(configPath, JSON.stringify(servers));
        await keytar.deletePassword(address, username);
    }
    catch (e) {
        console.error("remove-server-info: " + e);
    }
});