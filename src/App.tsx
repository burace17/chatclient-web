import React from 'react';
import './App.css';
import Header from './components/Header';
import ServerTree from './components/ServerTree';
import Chat from './components/Chat';
import UserList from './components/UserList';
import Client from './net/client';

// basically will have a map that maps server uri's or names to this client object
// for the server tree, transform the map into a tree structure with just the info needed
// header just needs the current channel
// chat just needs the messages for the current channel.
//const test = new Client("wss://0.0.0.0:1337", "test", "mypassword");

function App() {
  return (
    <div className="App">
      <Header channel="Not in a channel"/>
      <div className="App-container">
        <ServerTree />
        <Chat />
        <UserList />
      </div>
    </div>
  );
}

export default App;
