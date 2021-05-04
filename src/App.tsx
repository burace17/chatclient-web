/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import React from "react";
import "./App.css";
import Header from "./components/Header";
import ServerTree from "./components/ServerTree";
import UserList from "./components/UserList";
import EntryBox from "./components/EntryBox";
import MessageList from "./components/MessageList";
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
    currentChannelName: string;
    currentChannelMessages: ClientMessage[]
    currentChannelUsers: User[];
    currentChannelMessagesOnServer: number;
    currentChannelLastReadMessage: number | undefined;
    hideServerTree: boolean;
    hideUserList: boolean;
    canSendMessage: boolean;
    messageListAtBottom: boolean;
    windowHasFocus: boolean;
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
    private entryBoxRef: React.RefObject<EntryBox> = React.createRef();
    private messageListRef: React.RefObject<MessageList> = React.createRef();
    private unhookTouchEvents: () => void = () => {};
    constructor(props: Properties) {
        super(props);
        this.state = {
            serverNames: [],
            selectedTreeItem: null,
            currentChannelName: "",
            currentChannelMessages: [],
            currentChannelUsers: [],
            currentChannelMessagesOnServer: 0,
            currentChannelLastReadMessage: undefined,
            hideServerTree: false,
            hideUserList: false,
            canSendMessage: false,
            messageListAtBottom: true,
            windowHasFocus: true
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
        this.evaluateSidePaneVisibility();
        this.setupTouchEventListeners();
    }

    componentWillUnmount() {
        window.removeEventListener("focus", this.onWindowGotFocus);
        window.removeEventListener("blur", this.onWindowLostFocus);
        this.unhookTouchEvents();
    }

    private focusEntryBox = () => this.entryBoxRef.current?.focus();

    private scrollToEnd = () => this.messageListRef.current?.scrollToEnd();

    private getStoredServers = async () => {
        if (window.credentialManager) {
            // TODO: Make this type safe
            const data = await window.credentialManager.getStoredServers();
            if (!data)
                return;

            for (const server of data) {
                const password = server.password ?? await window.credentialManager.getStoredPassword(server.address, server.username);
                this.onServerAdded(server.address, server.username, password, false, false);
            }
        }
    }

    private evaluateSidePaneVisibility = () => {
        const screenTooSmall = window.innerWidth < 500;
        this.setState({
            hideServerTree: screenTooSmall,
            hideUserList: screenTooSmall
        });
    }

    private setupTouchEventListeners = () => {
        let start: Touch | null = null;
        let hideServerTree = this.state.hideServerTree;
        let hideUserList = this.state.hideUserList;
        const onTouchStart = (e: TouchEvent) => {
            start = e.changedTouches[0];
            hideServerTree = this.state.hideServerTree;
            hideUserList = this.state.hideUserList;
        };

        const onTouchMove = (e: TouchEvent) => {
            const end = e.changedTouches[0];

            // don't handle any of these gestures if both the server tree and user list are showing.
            if (!start || (!hideServerTree && !hideUserList))
                return;

            const diffX = end.screenX - start.screenX;
            const diffY = end.screenY - start.screenY;
            const scrolledRight = diffX > 0;
            const scrolledEnough = Math.abs(diffX) > 100;
            const vertical = Math.abs(diffY) > 20;

            if (!scrolledEnough || vertical)
                return;

            let newHideServerTree = true;
            let newHideUserList = true;
            if (hideServerTree && !scrolledRight) {
                newHideUserList = false;
            }
            if (hideUserList && scrolledRight) {
                newHideServerTree = false;
                newHideUserList = true;
            }

            this.setState({
                hideServerTree: newHideServerTree,
                hideUserList: newHideUserList
            });
        };

        window.addEventListener("touchstart", onTouchStart);
        window.addEventListener("touchmove", onTouchMove);
        this.unhookTouchEvents = () => {
            window.removeEventListener("touchstart", onTouchStart);
            window.removeEventListener("touchmove", onTouchMove);
        };
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
        this.setState({
            windowHasFocus: true
        });
        const channel = this.state.selectedTreeItem as Channel;
        if (!channel)
            return;

        const client = this.clients.get(channel.address);
        if (client && channel.name && client.getLastReadMessage(channel) === client.getLastMessageId(channel))
            client.notifyViewingChannel(channel.name);
        // In the future, we should check that the last message is actually in view.
        // Right now it always should be since we are still scrolling the page even when the document is hidden.
        // But I think we will want to stop doing that?
    }

    private onWindowLostFocus = () => {
        this.setState({
            windowHasFocus: false
        });
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
        let messagesOnServer = 0;
        let lastReadMessage: number | undefined = undefined;
        const newChannel = newSelection as Channel;
        const client = this.clients.get(newChannel.address);

        const oldClient = this.clients.get(this.state.selectedTreeItem?.address ?? "");
        const oldChannel = this.state.selectedTreeItem as Channel;
        if (oldChannel.address === newChannel.address && oldChannel.name === newChannel.name)
            return;

        if (oldClient && oldClient !== client)
            oldClient.notifyNotViewingChannels();

        if (newChannel.name && client) {
            messages = client.getMessages(newChannel) ?? [];
            users = newChannel.users;
            messagesOnServer = client.getUnreadMessagesOnServer(newChannel);
            lastReadMessage = client.getLastReadMessage(newChannel);
            document.title = newChannel.name + " - Chat Client";
        }
        else {
            document.title = "Chat Client";
            client?.notifyNotViewingChannels();
        }

        const afterSetState = () => {
            this.focusEntryBox();
            if (client?.getLastMessageId(newChannel) === lastReadMessage) {
                client?.notifyViewingChannel(newChannel.name);
            }
            else {
                client?.notifyNotViewingChannels();
            }
        };

        this.setState({
            selectedTreeItem: newChannel,
            currentChannelName: newChannel?.name ?? "",
            currentChannelMessages: messages,
            currentChannelUsers: users,
            currentChannelMessagesOnServer: messagesOnServer,
            currentChannelLastReadMessage: lastReadMessage,
            canSendMessage: client?.isConnected() ?? false
        }, afterSetState);
    }

    private onMessageReceived = (addr: string, channel: string, message?: ClientMessage) => {
        const currentChannel = this.state.selectedTreeItem as Channel;
        const client = this.clients.get(addr);
        if (!client) return;

        const isChannelActive = addr === currentChannel.address && channel === currentChannel.name;
        if (isChannelActive) {
            const messages = client.getMessages(currentChannel);
            this.setState({ 
                currentChannelMessages: messages,
                currentChannelMessagesOnServer: client.getUnreadMessagesOnServer(currentChannel),
                currentChannelLastReadMessage: client.getLastReadMessage(currentChannel)
            }, () => this.scrollToEnd());
        }
        else {
            this.setState({ serverNames: getNamesAndAddresses(this.clients) });
        }

        if (!client.isBeingViewed(currentChannel) && message && message.user && message.user.username !== client.getProps().username) {
            showNotification(`${message.user.username} (${channel})`, message.content);
        }
    }

    private onWelcome = (addr: string, channels: Array<Channel>) => {
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
            onChannelBeingViewed: () => this.setState({ serverNames: getNamesAndAddresses(this.clients) }),
            onReceiveMessageHistory: this.onReceiveChannelHistory
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
                    currentChannelMessagesOnServer: 0,
                    currentChannelLastReadMessage: undefined,
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

    private onBottomStateChanged = (atBottom: boolean) => {
        const channel = this.state.selectedTreeItem as Channel;
        if (channel && channel.name) {
            const client = this.clients.get(channel.address);
            if (atBottom && client && this.state.windowHasFocus) {
                client.notifyViewingChannel(channel.name);
            }
        }
        this.setState({
            messageListAtBottom: atBottom
        });
    }

    private onReceiveChannelHistory = () => {
        const channel = this.state.selectedTreeItem as Channel;
        if (!channel.address)
            return;

        const client = this.clients.get(channel.address);
        if (!client)
            return;

        const channels = client.getChannels();
        if (!channel.name && channels.length > 0) {
            this.onTreeSelectionChanged(channels[0]);
        }
    }

    render() {
        return (
            <div className="App">
                <Header channel={this.state.currentChannelName} onToggleServerTree={this.onToggleServerTree}
                    onToggleUserList={this.onToggleUserList} />
                <div className="App-container">
                    <ServerTree onServerAdded={this.onServerAdded} connectedServers={this.state.serverNames}
                        selectedChannel={this.state.selectedTreeItem} onSelectedChannelChanged={this.onTreeSelectionChanged}
                        isHidden={this.state.hideServerTree} onServerRemoved={this.onServerRemoved} />
                    <div className="chat-box">
                        <MessageList key={this.state.currentChannelName} 
                            messages={this.state.currentChannelMessages}
                            lastViewedMessage={this.state.currentChannelLastReadMessage} 
                            onBottomStateChanged={this.onBottomStateChanged} 
                            ref={this.messageListRef} />
                        <EntryBox onSendMessage={this.onSendMessage} canSendMessage={this.state.canSendMessage} 
                            ref={this.entryBoxRef} />
                    </div>
                    <UserList isHidden={this.state.hideUserList} users={this.state.currentChannelUsers} />
                </div>
            </div>
        );
    }
}

export default App;