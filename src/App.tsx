import React from 'react';
import './App.css';
import Header from './components/Header';
import ServerTree from './components/ServerTree';
import Chat from './components/Chat';
import UserList from './components/UserList';
import Client from './net/client';
//import { timeStamp } from 'console';

// basically will have a map that maps server uri's or names to this client object
// for the server tree, transform the map into a tree structure with just the info needed
// header just needs the current channel
// chat just needs the messages for the current channel.
//const test = new Client("wss://0.0.0.0:1337", "test", "mypassword");

function map<T, K>(iter: IterableIterator<T>, f: (t: T) => K): Array<K>  {
    let arr = [];
    for (const item of iter) {
        arr.push(f(item));
    }
    return arr;
}

function getNamesAndAddresses(clients: Map<string, Client>): Array<[string, string]> {
  return map(clients.entries(), kv => {
    const name = kv[1].getServerName();
    return [kv[0], name];
  });
}

interface Properties {}

interface State {
  clients: Map<string, Client>;
  serverNames: Array<[string, string]> // address, name
}

class App extends React.Component<Properties, State> {
  constructor(props: Properties) {
    super(props);
    this.state = {
      clients: new Map<string, Client>(),
      serverNames: []
    }
    this.onServerAdded = this.onServerAdded.bind(this);
    this.onMessageReceived = this.onMessageReceived.bind(this);
    this.onServerNameChanged = this.onServerNameChanged.bind(this);
  }

  private onMessageReceived(address: string, evt: MessageEvent<any>) {

  }

  private onServerNameChanged() {
    this.setState(state => {
      return {
        serverNames: getNamesAndAddresses(state.clients)
      }
    });
  }

  private onServerAdded(address: string, username: string, password: string) {
    if (this.state.clients.has(address))
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

    this.setState(state => {
      const newState = new Map(state.clients);
      newState.set(address, new Client(props));
      return { 
        clients: newState,
        serverNames: getNamesAndAddresses(newState)
      };
    });
  }

  render() {
    return (
      <div className="App">
        <Header channel="Not in a channel"/>
        <div className="App-container">
          <ServerTree onServerAdded={this.onServerAdded} connectedServers={this.state.serverNames} />
          <Chat />
          <UserList />
        </div>
      </div>
    );
  }
}

export default App;
