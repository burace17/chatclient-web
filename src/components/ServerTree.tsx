import "./ServerTree.css";
import "./util.css";
import ServerPropertiesDialog from "./ServerPropertiesDialog";
import { ServerInfo, Channel } from "../App";
import React from "react";
import { ContextMenu, MenuItem, ContextMenuTrigger } from "react-contextmenu";

interface Properties {
    onServerAdded: (addr: string | undefined, username: string | undefined, password: string | undefined, persist: boolean) => void;
    onServerRemoved: (addr: string) => void;
    onSelectedChannelChanged: (newChannel: Channel) => void;
    connectedServers: Array<ServerInfo>;
    selectedChannel: Channel | null;
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

    private addServerDialogCommitted = (address?: string, username?: string, password?: string) => {
        this.setState({ showAddServer: false });
        this.props.onServerAdded(address, username, password, true);
    }

    private createChannelNameButton = (address: string, name: string) => {
        const selected = address === this.props.selectedChannel?.address && name === this.props.selectedChannel.name;
        const className = selected ? "channel-button channel-button-selected" : "channel-button channel-button-unselected";

        return (
            <li key={name}>
                <ContextMenuTrigger id="channel_context_trigger">
                    <button className={className} onClick={() => { this.props.onSelectedChannelChanged({ address, name })}}>
                        {name}
                    </button>
                </ContextMenuTrigger>
            </li> 
        );
    }

    // TODO: add types..
    private onLeaveServerClicked = (_: Event, obj: any) => {
        this.props.onServerRemoved(obj.address);
    }

    render() {
        const servers = this.props.connectedServers.map(info => {
            const collect = (data: any) => { return { address: info.address } };
            return (
                <li key={info.address}>
                    <ContextMenuTrigger id="server_context_trigger" collect={collect}>
                        <div className="server-name">{info.name}</div>
                    </ContextMenuTrigger>
                    <ul>
                        {info.channelNames.map(name => this.createChannelNameButton(info.address, name))}
                    </ul>
                    <ContextMenu id="server_context_trigger" className="context-menu">
                        <MenuItem className="context-menu-item">Join Channel</MenuItem>
                        <MenuItem className="context-menu-item" onClick={this.onLeaveServerClicked}>Leave Server</MenuItem>
                    </ContextMenu>
                    <ContextMenu id="channel_context_trigger" className="context-menu">
                        <MenuItem className="context-menu-item">Leave Channel</MenuItem>
                    </ContextMenu>
                </li>
           );
        });

        const containerClass = this.props.isHidden ? "server-container hidden" : "server-container scrollbar";

        return (
            <div className={containerClass}>
                <button onClick={this.showAddServerDialog} className="button">Add a server</button>
                <ul>
                    {servers}
                </ul>
                <ServerPropertiesDialog show={this.state.showAddServer} onClose={this.addServerDialogClosed} 
                                 onCommit={this.addServerDialogCommitted} title="Add Server" okButtonText="Add" />
            </div>
        );
    }
}

export default ServerTree;