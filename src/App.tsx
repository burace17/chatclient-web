/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import React from "react";
import "./App.css";
import Header from "./components/Header";
import ServerTree from "./components/ServerTree";
import Chat from "./components/Chat";
import UserList from "./components/UserList";
import Client from "./net/client";
import { ClientMessage, ClientProperties, User, Channel } from "./net/client";

function map<T, K>(iter: IterableIterator<T>, f: (t: T) => K): Array<K> {
    let arr = [];
    for (const item of iter) {
        arr.push(f(item));
    }
    return arr;
}
function supportsNotifications() {
    return "Notification" in window;
}

async function checkForNotificationPermission() {
    if (supportsNotifications() && Notification.permission === "default") {
        await Notification.requestPermission();
    }
}

function showNotification(title: string, body: string) {
    if (supportsNotifications() && Notification.permission === "granted") {
        new Notification(title, { body });
    }
}

declare global {
    interface Window {
        credentialManager: any;
        ccTestAppInstance: App;
    }
}

interface Server {
    address: string;
}

export interface ServerInfo {
    address: string;
    username: string;
    password: string;
    name: string;
    channels: Channel[];
    isClosed: boolean;
    quitReason?: string;
    quitCode?: number;
}

interface Properties { }

export type ServerSelection = Server | Channel | null;

interface State {
    serverNames: ServerInfo[];
    selectedTreeItem: ServerSelection;
    currentChannelMessages: ClientMessage[]
    currentChannelUsers: User[];
    hideServerTree: boolean;
    hideUserList: boolean;
    canSendMessage: boolean;
}

function getNamesAndAddresses(clients: Map<string, Client>): ServerInfo[] {
    return map(clients.entries(), kv => {
        const [addr, client] = kv;
        const name = client.getServerName();
        const channels = client.getChannels();
        return {
            address: addr,
            username: client.getProps().username,
            password: client.getProps().password,
            name: name,
            channels: channels,
            isClosed: client.isClosingOrClosed(),
            quitReason: client.getQuitReason(),
            quitCode: client.getQuitCode(),
        };
    });
}

class App extends React.Component<Properties, State> {
    private clients: Map<string, Client> = new Map<string, Client>();
    private chatRef: React.RefObject<Chat> = React.createRef();
    constructor(props: Properties) {
        super(props);
        this.state = {
            serverNames: [],
            selectedTreeItem: null,
            currentChannelMessages: [],
            currentChannelUsers: [],
            hideServerTree: false,
            hideUserList: false,
            canSendMessage: false,
        };

        // Hack to allow tests to access the instance of this component
        // Please do not use anywhere else!
        window.ccTestAppInstance = this;
    }

    async componentDidMount() {
        await this.getStoredServers();
        await checkForNotificationPermission();
        window.addEventListener("focus", this.onWindowGotFocus);
        window.addEventListener("blur", this.onWindowLostFocus);
    }

    componentWillUnmount() {
        window.removeEventListener("focus", this.onWindowGotFocus);
        window.removeEventListener("blur", this.onWindowLostFocus);
    }

    private focusEntryBox = () => this.chatRef.current?.focusEntryBox();

    private getStoredServers = async () => {
        if (window.credentialManager) {
            // TODO: Make this type safe
            const data = await window.credentialManager.getStoredServers();
            for (const server of data) {
                const password = await window.credentialManager.getStoredPassword(server.address, server.username);
                this.onServerAdded(server.address, server.username, password, false, false);
            }
        }
    }

    private writeToCurrentChat = (text: string) => {
        this.setState(state => {
            let newState = Array.from(state.currentChannelMessages);
            newState.push({
                message_id: Math.random(),
                time: Date.now() / 1000,
                content: text,
                attachments: []
            });

            return { currentChannelMessages: newState };
        });
    }

    private sendCommand = (text: string) => {
        const channel = this.state.selectedTreeItem;
        if (!channel) {
            this.writeToCurrentChat("Need to be connected to a server to send a command");
            return;
        }

        const client = this.clients.get(channel.address);
        const words = text.split(" ");
        if (client && words[0] === "/join" && words.length >= 2) {
            const channel = words[1];
            if (!client.getChannels().some(c => c.name === channel))
                client.joinChannel(channel);
            else
                this.writeToCurrentChat("You are already in " + channel);
        }
        else
            this.writeToCurrentChat("Invalid command: " + text);
    }

    private onWindowGotFocus = () => {
        const channel = this.state.selectedTreeItem as Channel;
        if (!channel)
            return;

        const client = this.clients.get(channel.address);
        if (client && channel.name)
            client.notifyViewingChannel(channel.name);
        // In the future, we should check that the last message is actually in view.
        // Right now it always should be since we are still scrolling the page even when the document is hidden.
        // But I think we will want to stop doing that?
    }

    private onWindowLostFocus = () => {
        const channel = this.state.selectedTreeItem as Channel;
        if (!channel)
            return;

        const client = this.clients.get(channel.address);
        if (client)
            client.notifyNotViewingChannels();
    }

    private onSendMessage = (text: string) => {
        if (text.startsWith("/"))
            this.sendCommand(text);
        else if (this.state.selectedTreeItem) {
            const channel = this.state.selectedTreeItem as Channel;
            if (!channel.name) {
                this.writeToCurrentChat("You must be in a channel to send a message");
                return;
            }
            this.clients.get(channel.address)?.sendMessage(channel.name, text);
        }
    }

    private onTreeSelectionChanged = (newSelection: ServerSelection) => {
        let messages: ClientMessage[] = [];
        let users: User[] = [];
        const newChannel = newSelection as Channel;
        const client = this.clients.get(newChannel.address);

        const oldClient = this.clients.get(this.state.selectedTreeItem?.address ?? "");
        if (oldClient && oldClient !== client)
            oldClient.notifyNotViewingChannels();

        if (newChannel.name && client) {
            messages = client.getMessages(newChannel) ?? [];
            users = newChannel.users;
            document.title = newChannel.name + " - Chat Client";
            client.notifyViewingChannel(newChannel.name);
        }
        else {
            document.title = "Chat Client";
            client?.notifyNotViewingChannels();
        }

        this.setState({
            selectedTreeItem: newChannel,
            currentChannelMessages: messages,
            currentChannelUsers: users,
            canSendMessage: client?.isConnected() ?? false
        }, () => this.focusEntryBox());
    }

    private onMessageReceived = (addr: string, channel: string, message?: ClientMessage) => {
        const currentChannel = this.state.selectedTreeItem as Channel;
        const client = this.clients.get(addr);
        if (!client) return;

        const isChannelActive = addr === currentChannel.address && channel === currentChannel.name;
        if (isChannelActive) {
            const messages = client.getMessages(currentChannel);
            this.setState({ currentChannelMessages: messages });
        }
        else {
            this.setState({ serverNames: getNamesAndAddresses(this.clients) });
        }

        if (!client.isBeingViewed(currentChannel) && message && message.user && message.user.username !== client.getProps().username) {
            showNotification(`${message.user.username} (${channel})`, message.content);
        }
    }

    private onWelcome = (addr: string, channels: Array<Channel>) => {
        const channel = this.state.selectedTreeItem as Channel;
        if (!channel.name && channels.length > 0) {
            this.onTreeSelectionChanged(channels[0]);
        }

        this.setState({
            serverNames: getNamesAndAddresses(this.clients),
            canSendMessage: this.state.selectedTreeItem !== null,
        });
    }

    private onServerAdded = async (address: string | undefined, username: string | undefined, password: string | undefined,
        persist: boolean, shouldRegister: boolean) => {
        if (!address || !username || !password) {
            this.writeToCurrentChat("Could not add server");
            return;
        }

        const existingClient = this.clients.get(address);
        if (existingClient)
            existingClient.quit();
        this.clients.delete(address);

        const props: ClientProperties = {
            address: address,
            username: username,
            password: password,
            onOpen: (_) => { }, // might be able to remove..
            onClose: this.onConnectionClose,
            onMessage: this.onMessageReceived,
            onWelcome: this.onWelcome,
            onJoin: this.onJoin,
            onReceiveChannelInfo: this.onReceiveChannelInfo,
            onUserStatusUpdate: this.onUserStatusUpdate,
            onChannelBeingViewed: () => this.setState({ serverNames: getNamesAndAddresses(this.clients) })
        };

        if (persist && window.credentialManager) {
            await window.credentialManager.storeServerInfo(address, username, password);
        }

        this.clients.set(address, new Client(props, shouldRegister));
        this.setState({
            serverNames: getNamesAndAddresses(this.clients),
            selectedTreeItem: { address }
        }, () => this.focusEntryBox());
    }

    private onConnectionClose = (address: string) => {
        this.setState(state => {
            return {
                serverNames: getNamesAndAddresses(this.clients),
                canSendMessage: state.selectedTreeItem !== null && state.selectedTreeItem.address !== address
            };
        });
    }

    private onToggleServerTree = () => {
        this.setState({ hideServerTree: !this.state.hideServerTree });
    }

    private onToggleUserList = () => {
        this.setState({ hideUserList: !this.state.hideUserList });
    }

    private onServerRemoved = async (addr: string) => {
        const client = this.clients.get(addr);
        if (client) {
            client.quit();
            this.clients.delete(addr);

            if (window.credentialManager) {
                await window.credentialManager.removeServerInfo(addr, client.getProps().username);
            }
            if (this.state.selectedTreeItem?.address === addr) {
                this.setState({
                    currentChannelMessages: [],
                    currentChannelUsers: [],
                    canSendMessage: false
                });
            }

            this.setState({
                serverNames: getNamesAndAddresses(this.clients),
                selectedTreeItem: null
            });
        }
    }

    private onJoin = (addr: string, channel: string, user: User) => {
        // TODO: consider removing these parameters as we don't use them.
        this.setState({
            serverNames: getNamesAndAddresses(this.clients)
        });
    }

    private onUserStatusUpdate = (addr: string, user: User) => {
        if (this.state.selectedTreeItem?.address === addr) {
            const index = this.state.currentChannelUsers.findIndex(u => u.id === user.id);
            if (index !== -1) {
                let copy = Array.from(this.state.currentChannelUsers);
                copy[index].status = user.status;
                this.setState({
                    currentChannelUsers: copy
                });
            }
        }
    }

    private onReceiveChannelInfo = (addr: string, channel: Channel) => {
        this.setState({
            serverNames: getNamesAndAddresses(this.clients),
        });
        this.onTreeSelectionChanged(channel);
    }

    render() {
        return (
            <div className="App">
                <Header channel={(this.state.selectedTreeItem as Channel)?.name ?? ""} onToggleServerTree={this.onToggleServerTree}
                    onToggleUserList={this.onToggleUserList} />
                <div className="App-container">
                    <ServerTree onServerAdded={this.onServerAdded} connectedServers={this.state.serverNames}
                        selectedChannel={this.state.selectedTreeItem} onSelectedChannelChanged={this.onTreeSelectionChanged}
                        isHidden={this.state.hideServerTree} onServerRemoved={this.onServerRemoved} />
                    <Chat messages={this.state.currentChannelMessages} onSendMessage={this.onSendMessage}
                        canSendMessage={this.state.canSendMessage} ref={this.chatRef} />
                    <UserList isHidden={this.state.hideUserList} users={this.state.currentChannelUsers} />
                </div>
            </div>
        );
    }
}

export default App;