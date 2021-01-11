import React from 'react';
import './App.css';
import { Header } from './components/Header';
import { ServerTree } from './components/ServerTree';
import { Chat } from './components/Chat';
import { UserList } from './components/UserList';

function App() {
  return (
    <div className="App">
      <Header channel="#test"/>
      <div className="App-container">
        <ServerTree />
        <Chat />
        <UserList />
      </div>
    </div>
  );
}

export default App;
