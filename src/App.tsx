import React from 'react';
import './App.css';
import Header from './components/Header';
import ServerTree from './components/ServerTree';
import Chat from './components/Chat';
import UserList from './components/UserList';
import Client from './net/client';
import { ClientMessage } from './net/client';

function map<T, K>(iter: IterableIterator<T>, f: (t: T) => K): Array<K>  {
    let arr = [];
    for (const item of iter) {
        arr.push(f(item));
    }
    return arr;
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

interface Properties {}

interface State {
  serverNames: Array<ServerInfo>
  selectedChannel: [string?, string?] // address, channel name
  currentChannelMessages: Array<ClientMessage>
}

class App extends React.Component<Properties, State> {
  private clients: Map<string, Client>;
  constructor(props: Properties) {
    super(props);
    this.clients = new Map<string, Client>();
    this.state = {
      serverNames: [],
      selectedChannel: [undefined, undefined],
      currentChannelMessages: []
    }
    this.onServerAdded = this.onServerAdded.bind(this);
    this.onMessageReceived = this.onMessageReceived.bind(this);
    this.onServerNameChanged = this.onServerNameChanged.bind(this);
    this.onSelectedChannelChanged = this.onSelectedChannelChanged.bind(this);
    this.onSendMessage = this.onSendMessage.bind(this);
    this.sendCommand = this.sendCommand.bind(this);
    this.writeToCurrentChat = this.writeToCurrentChat.bind(this);
  }

  private writeToCurrentChat(text: string) {
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

  private sendCommand(text: string) {
    const currentAddr = this.state.selectedChannel[0];
    if (!currentAddr) {
      this.writeToCurrentChat("Need to be connected to a server to send a command");
      return;
    }

    const client = this.clients.get(currentAddr);
    const words = text.split(" ");
    if (words[0] === "/join" && words.length >= 2) {
      const channel = words[1];
      client?.joinChannel(channel);
    }
    else
      this.writeToCurrentChat("Invalid command: " + text);
  }

  private onSendMessage(text: string) {
    const [addr, channelName] = this.state.selectedChannel;
    if (addr) {
      if (text.startsWith("/"))
        this.sendCommand(text);
      else if (channelName)
        this.clients.get(addr)?.sendMessage(channelName, text);
      else
        this.writeToCurrentChat("You need to join or select a channel to send a message");
    }
  }

  private onSelectedChannelChanged(newData: [string, string]) {
    const [currentAddr, currentChannel] = this.state.selectedChannel;
    const [newAddr, newChannel] = newData;
    if (currentAddr !== newAddr || currentChannel !== newChannel) {
      const messages = this.clients.get(newAddr)?.getMessages(newChannel) ?? [];
      this.setState({ 
        selectedChannel: newData,
        currentChannelMessages: messages
      });
    }
  }

  private onMessageReceived(addr: string, channel: string) {
    const [currentAddr, currentChannel] = this.state.selectedChannel;
    if (addr === currentAddr && channel === currentChannel) {
      const messages = this.clients.get(addr)?.getMessages(channel);
      if (messages)
        this.setState({ currentChannelMessages: messages });
    }
  }

  private onServerNameChanged() {
    this.setState({ serverNames: getNamesAndAddresses(this.clients) });
  }

  private onServerAdded(address: string, username: string, password: string) {
    if (this.clients.has(address))
      return; // todo: show a notification

    const props = {
      address: address,
      username: username,
      password: password,
      onOpen: (_: string) => {},
      onClose: (a: string) => {},
      onMessage: this.onMessageReceived,
      onServerNameChanged: this.onServerNameChanged
    };

    this.clients.set(address, new Client(props));
    this.setState({ 
      serverNames: getNamesAndAddresses(this.clients),
      selectedChannel: [address, undefined]
    });
  }

  render() {
    return (
      <div className="App">
        <Header channel={this.state.selectedChannel[1] ?? ""} />
        <div className="App-container">
          <ServerTree onServerAdded={this.onServerAdded} connectedServers={this.state.serverNames} 
                      selectedChannel={this.state.selectedChannel} onSelectedChannelChanged={this.onSelectedChannelChanged} />
          <Chat messages={this.state.currentChannelMessages} onSendMessage={this.onSendMessage} />
          <UserList />
        </div>
      </div>
    );
  }
}

export default App;
