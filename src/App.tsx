import React from 'react';
import './App.css';
import Header from './components/Header';
import ServerTree from './components/ServerTree';
import Chat from './components/Chat';
import UserList from './components/UserList';
import Client from './net/client';
import { ClientMessage } from './net/client';

function map<T, K>(iter: IterableIterator<T>, f: (t: T) => K): Array<K> {
    let arr = [];
    for (const item of iter) {
        arr.push(f(item));
    }
    return arr;
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
    selectedChannel?: Channel
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
            selectedChannel: undefined,
            currentChannelMessages: [],
            hideServerTree: false,
            canSendMessage: false
        }
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
        let channel: Channel | undefined = this.state.selectedChannel;
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

    private onServerAdded = (address: string, username: string, password: string) => {
        if (this.clients.has(address))
            return; // todo: show a notification

        const props = {
            address: address,
            username: username,
            password: password,
            onOpen: (_: string) => { },
            onClose: this.onClose,
            onMessage: this.onMessageReceived,
            onWelcome: this.onWelcome
        };

        this.clients.set(address, new Client(props));
        this.setState({
            serverNames: getNamesAndAddresses(this.clients),
        });
    }

    private onClose = (address: string) => {
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

    render() {
        return (
            <div className="App">
                <Header channel={this.state.selectedChannel?.name ?? ""} onToggleServerTree={this.onToggleServerTree} />
                <div className="App-container">
                    <ServerTree onServerAdded={this.onServerAdded} connectedServers={this.state.serverNames}
                        selectedChannel={this.state.selectedChannel} onSelectedChannelChanged={this.onSelectedChannelChanged}
                        isHidden={this.state.hideServerTree} />
                    <Chat messages={this.state.currentChannelMessages} onSendMessage={this.onSendMessage}
                        canSendMessage={this.state.canSendMessage} />
                    <UserList />
                </div>
            </div>
        );
    }
}

export default App;
