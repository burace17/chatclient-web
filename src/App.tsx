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
}

function getNamesAndAddresses(clients: Map<string, Client>): Array<ServerInfo> {
    return map(clients.entries(), kv => {
        const name = kv[1].getServerName();
        const channels = kv[1].getChannels();
        return {
            address: kv[0],
            name: name,
            channelNames: channels
        };
    });
}

interface Properties { }

interface State {
    serverNames: Array<ServerInfo>
    selectedChannel?: Channel
    currentChannelMessages: Array<ClientMessage>
    hideServerTree: boolean
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
            hideServerTree: false
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
            const messages = this.clients.get(newChannel.address)?.getMessages(newChannel.name) ?? [];
            document.title = newChannel.name + " - Chat Client";
            this.setState({
                selectedChannel: newChannel,
                currentChannelMessages: messages
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
        let channel: Channel | null = null;
        if (channels.length > 0) {
            channel = { address: addr, name: channels[0] };
            document.title = channels[0] + " - Chat Client";
        }

        this.setState({ 
            serverNames: getNamesAndAddresses(this.clients),
            selectedChannel: channel ?? this.state.selectedChannel
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
            onClose: (a: string) => { },
            onMessage: this.onMessageReceived,
            onWelcome: this.onWelcome
        };

        this.clients.set(address, new Client(props));
        this.setState({
            serverNames: getNamesAndAddresses(this.clients),
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
                    <Chat messages={this.state.currentChannelMessages} onSendMessage={this.onSendMessage} />
                    <UserList />
                </div>
            </div>
        );
    }
}

export default App;
