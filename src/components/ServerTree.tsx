import './ServerTree.css';
import './util.css';
import AddServerDialog from './AddServerDialog';
import { ServerInfo } from '../App';
import React from 'react';
interface Properties {
    onServerAdded: (addr: string, username: string, password: string) => void;
    connectedServers: Array<ServerInfo>;
    selectedChannel: [string?, string?];
    onSelectedChannelChanged: (newChannel: [string, string]) => void;
}

interface State {
    showAddServer: boolean;
}

class ServerTree extends React.Component<Properties, State> {
    constructor(props: Properties) {
        super(props);
        this.state = {
            showAddServer: false
        };

        this.showAddServerDialog = this.showAddServerDialog.bind(this);
        this.addServerDialogClosed = this.addServerDialogClosed.bind(this);
        this.addServerDialogCommitted = this.addServerDialogCommitted.bind(this);
        this.createChannelNameButton = this.createChannelNameButton.bind(this);
    }

    private showAddServerDialog() {
        this.setState({ showAddServer: true });
    }

    private addServerDialogClosed() {
        this.setState({ showAddServer: false });
    }

    private addServerDialogCommitted(address: string, username: string, password: string) {
        this.setState({ showAddServer: false });
        this.props.onServerAdded("wss://" + address + ":1337", username, password);
    }

    private createChannelNameButton(address: string, name: string) {
        const selected = address === this.props.selectedChannel[0] && name === this.props.selectedChannel[1];
        const className = selected ? "channel-button-selected" : "channel-button";

        return (
            <li key={name}>
                <button className={className} onClick={() => { this.props.onSelectedChannelChanged([address, name])}}>
                    {name}
                </button>
            </li> 
        );
    }

    render() {
        const servers = this.props.connectedServers.map(info => {
            return (
                <li key={info.address}>
                    {info.name}
                    <ul>
                        {info.channelNames.map(name => this.createChannelNameButton(info.address, name))}
                    </ul>
                </li>
            );
        });

        return (
            <div className="server-tree">
                <button onClick={this.showAddServerDialog} className="button">Add a server</button>
                <ul>
                    {servers}
                </ul>
                <AddServerDialog show={this.state.showAddServer} onClose={this.addServerDialogClosed} 
                                 onCommit={this.addServerDialogCommitted} />
            </div>
        );
    }
}

export default ServerTree;