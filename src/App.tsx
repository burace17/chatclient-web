import React from "react";
import "./App.css";
import Header from "./components/Header";
import ServerTree from "./components/ServerTree";
import Chat from "./components/Chat";
import UserList from "./components/UserList";
import Client from "./net/client";
import { ClientMessage, ClientProperties } from "./net/client";

function map<T, K>(iter: IterableIterator<T>, f: (t: T) => K): Array<K> {
    let arr = [];
    for (const item of iter) {
        arr.push(f(item));
    }
    return arr;
}

declare global {
    interface Window {
        credentialManager: any;
    }
}

export interface Channel {
    address: string;
    name: string;
}

export interface ServerInfo {
    address: string;
    name: string;
    channelNames: Array<string>;
    isConnected: boolean;
}

function getNamesAndAddresses(clients: Map<string, Client>): Array<ServerInfo> {
    return map(clients.entries(), kv => {
        const [addr, client] = kv;
        const name = client.getServerName();
        const channels = client.getChannels();
        return {
            address: addr,
            name: name,
            channelNames: channels,
            isConnected: client.isConnected()
        };
    });
}

interface Properties { }

interface State {
    serverNames: Array<ServerInfo>
    selectedChannel: Channel | null
    currentChannelMessages: Array<ClientMessage>
    hideServerTree: boolean
    canSendMessage: boolean
}

class App extends React.Component<Properties, State> {
    private clients: Map<string, Client>;
    constructor(props: Properties) {
        super(props);
        this.clients = new Map<string, Client>();
        this.state = {
            serverNames: [],
            selectedChannel: null,
            currentChannelMessages: [],
            hideServerTree: false,
            canSendMessage: false
        }
    }

    async componentDidMount() {
        await this.getStoredServers();
    }

    private writeToCurrentChat = (text: string) => {
        this.setState(state => {
            let newState = Array.from(state.currentChannelMessages);
            newState.push({
                id: Math.random(),
                time: Date.now() / 1000,
                text: text
            });

            return { currentChannelMessages: newState };
        });
    }

    private sendCommand = (text: string) => {
        const channel = this.state.selectedChannel;
        if (!channel) {
            this.writeToCurrentChat("Need to be connected to a server to send a command");
            return;
        }

        const client = this.clients.get(channel.address);
        const words = text.split(" ");
        if (words[0] === "/join" && words.length >= 2) {
            const channel = words[1];
            client?.joinChannel(channel);
        }
        else
            this.writeToCurrentChat("Invalid command: " + text);
    }

    private onSendMessage = (text: string) => {
        const channel = this.state.selectedChannel;
        if (!channel) {
            this.writeToCurrentChat("You must be in a channel to send a message");
            return;
        }

        if (text.startsWith("/"))
            this.sendCommand(text);
        else
            this.clients.get(channel.address)?.sendMessage(channel.name, text);
    }

    private onSelectedChannelChanged = (newChannel: Channel) => {
        const currentChannel = this.state.selectedChannel;
        if (currentChannel?.address !== newChannel.address || currentChannel.name !== newChannel.name) {
            const client = this.clients.get(newChannel.address); // should never be null hopefully?
            const messages = client?.getMessages(newChannel.name) ?? [];
            document.title = newChannel.name + " - Chat Client";
            this.setState({
                selectedChannel: newChannel,
                currentChannelMessages: messages,
                canSendMessage: client?.isConnected() ?? false
            });
        }
        else
            document.title = "Chat Client";
    }

    private onMessageReceived = (addr: string, channel: string) => {
        const currentChannel = this.state.selectedChannel;
        if (addr === currentChannel?.address && channel === currentChannel.name) {
            const messages = this.clients.get(addr)?.getMessages(channel);
            if (messages)
                this.setState({ currentChannelMessages: messages });
        }
    }

    private onWelcome = (addr: string, channels: Array<string>) => {
        // Select the first channel for this server if nothing is selected right now.
        let channel = this.state.selectedChannel;
        let canSendMessage = this.state.canSendMessage;
        if (!channel && channels.length > 0) { // pick the first channel when we connect for the first time
            channel = { address: addr, name: channels[0] };
            document.title = channels[0] + " - Chat Client";
            canSendMessage = true;
        }
        else if (channel && channel.address === addr) {
            canSendMessage = true; // reconnected to the current server.
        }

        this.setState({ 
            serverNames: getNamesAndAddresses(this.clients),
            selectedChannel: channel,
            canSendMessage
        });
    }

    private onServerAdded = async (address: string, username: string, password: string, persist: boolean) => {
        if (this.clients.has(address))
            return; // todo: show a notification

        const props: ClientProperties = {
            address: address,
            username: username,
            password: password,
            onOpen: (_) => { }, // might be able to remove..
            onClose: this.onClose,
            onMessage: this.onMessageReceived,
            onWelcome: this.onWelcome,
            onJoin: (addr, channel, username) => {},
            onSelfJoin: this.onSelfJoin,
        };

        if (persist && window.credentialManager) {
            await window.credentialManager.storeServerInfo(address, username, password);
        }

        this.clients.set(address, new Client(props));
        this.setState({
            serverNames: getNamesAndAddresses(this.clients),
        });
    }

    private onClose = (address: string, wasClean: boolean, code: number) => {
        this.setState(state => {
            return {
                serverNames: getNamesAndAddresses(this.clients),
                canSendMessage: state.selectedChannel?.address !== address
            };
        });
    }

    private onToggleServerTree = () => {
        this.setState(state => {
            return {
                hideServerTree: !state.hideServerTree
            };
        });
    }

    private getStoredServers = async () => {
        if (window.credentialManager) {
            // TODO: Make this type safe
            const data = await window.credentialManager.getStoredServers();
            for (const server of data) {
                const password = await window.credentialManager.getStoredPassword(server.address, server.username);
                this.onServerAdded(server.address, server.username, password, false);
            }
        }
    }

    private onServerRemoved = async (addr: string) => {
        const client = this.clients.get(addr);
        if (client) {
            client.quit();
            this.clients.delete(addr);

            if (window.credentialManager) {
                await window.credentialManager.removeServerInfo(addr, client.getProps().username);
            }

            this.setState({
                serverNames: getNamesAndAddresses(this.clients),
                selectedChannel: null
            });
        }
    }

    private onSelfJoin = (addr: string, channel: string) => {
        this.setState({
            serverNames: getNamesAndAddresses(this.clients),
        });
        this.onSelectedChannelChanged({address: addr, name: channel});
    }

    render() {
        return (
            <div className="App">
                <Header channel={this.state.selectedChannel?.name ?? ""} onToggleServerTree={this.onToggleServerTree} />
                <div className="App-container">
                    <ServerTree onServerAdded={this.onServerAdded} connectedServers={this.state.serverNames}
                        selectedChannel={this.state.selectedChannel} onSelectedChannelChanged={this.onSelectedChannelChanged}
                        isHidden={this.state.hideServerTree} onServerRemoved={this.onServerRemoved} />
                    <Chat messages={this.state.currentChannelMessages} onSendMessage={this.onSendMessage}
                        canSendMessage={this.state.canSendMessage} />
                    <UserList />
                </div>
            </div>
        );
    }
}

export default App;