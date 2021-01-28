import React from 'react';
import './App.css';
import Header from './components/Header';
import ServerTree from './components/ServerTree';
import Chat from './components/Chat';
import UserList from './components/UserList';
import Client from './net/client';

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
  selectedChannel: [string, string] // address, channel name
}

class App extends React.Component<Properties, State> {
  private clients: Map<string, Client>;
  constructor(props: Properties) {
    super(props);
    this.clients = new Map<string, Client>();
    this.state = {
      serverNames: [],
      selectedChannel: ["", "Not in a channel"]
    }
    this.onServerAdded = this.onServerAdded.bind(this);
    this.onMessageReceived = this.onMessageReceived.bind(this);
    this.onServerNameChanged = this.onServerNameChanged.bind(this);
    this.onSelectedChannelChanged = this.onSelectedChannelChanged.bind(this);
  }

  private onSelectedChannelChanged(newChannel: [string, string]) {
    if (this.state.selectedChannel[0] !== newChannel[0] || this.state.selectedChannel[1] !== newChannel[1])
      this.setState({ selectedChannel: newChannel });
  }

  private onMessageReceived(address: string, evt: MessageEvent<any>) {

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
    this.setState({ serverNames: getNamesAndAddresses(this.clients) });
  }

  render() {
    return (
      <div className="App">
        <Header channel={this.state.selectedChannel[1]} />
        <div className="App-container">
          <ServerTree onServerAdded={this.onServerAdded} connectedServers={this.state.serverNames} 
                      selectedChannel={this.state.selectedChannel} onSelectedChannelChanged={this.onSelectedChannelChanged} />
          <Chat />
          <UserList />
        </div>
      </div>
    );
  }
}

export default App;
