import "./ServerTree.css";
import "./util.css";
import AddServerDialog from "./AddServerDialog";
import { ServerInfo, Channel } from "../App";
import React from "react";
interface Properties {
    onServerAdded: (addr: string, username: string, password: string) => void;
    connectedServers: Array<ServerInfo>;
    selectedChannel?: Channel;
    onSelectedChannelChanged: (newChannel: Channel) => void;
    isHidden: boolean;
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
    }

    private showAddServerDialog = () => {
        this.setState({ showAddServer: true });
    }

    private addServerDialogClosed = () => {
        this.setState({ showAddServer: false });
    }

    private addServerDialogCommitted = (address: string, username: string, password: string) => {
        this.setState({ showAddServer: false });
        this.props.onServerAdded("wss://" + address + ":1337", username, password);
    }

    private createChannelNameButton = (address: string, name: string) => {
        const selected = address === this.props.selectedChannel?.address && name === this.props.selectedChannel.name;
        const className = selected ? "channel-button channel-button-selected" : "channel-button channel-button-unselected";

        return (
            <li key={name}>
                <button className={className} onClick={() => { this.props.onSelectedChannelChanged({ address, name })}}>
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

        const containerClass = this.props.isHidden ? "server-tree hidden" : "server-tree";

        return (
            <div className={containerClass}>
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