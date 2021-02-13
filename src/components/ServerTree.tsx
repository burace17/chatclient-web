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

    showModifyServer: boolean;
    modifyServerAddress?: string;
    modifyServerUsername?: string;
    modifyServerPassword?: string;
    modifyServerInfo?: string;
}

class ServerTree extends React.Component<Properties, State> {
    constructor(props: Properties) {
        super(props);
        this.state = {
            showAddServer: false,
            showModifyServer: false
        };
    }

    private showAddServerDialog = () => {
        this.setState({ showAddServer: true });
    }

    private hideAddServerDialog = () => {
        this.setState({ showAddServer: false });
    }

    private onAddServerCommitted = (address?: string, username?: string, password?: string) => {
        this.setState({ showAddServer: false });
        this.props.onServerAdded(address, username, password, true);
    }

    private showModifyServerDialog = (info: ServerInfo) => {
        this.setState({
            showModifyServer: true,
            modifyServerAddress: info.address,
            modifyServerUsername: info.username,
            modifyServerPassword: info.password
        });
    }

    private hideModifyServerDialog = () => {
        this.setState({
            showModifyServer: false,
            modifyServerAddress: undefined,
            modifyServerUsername: undefined,
            modifyServerPassword: undefined,
            modifyServerInfo: undefined
        });
    }

    private onModifyServerCommitted = (address?: string, username?: string, password?: string) => {
        this.setState({ showModifyServer: false });
        this.props.onServerAdded(address, username, password, true);
    }

    // TODO: add types..
    private onLeaveServerClicked = (_: Event, obj: any) => {
        this.props.onServerRemoved(obj.address);
    }

    private onShowPropertiesClicked = (_: Event, obj: any) => {
        this.showModifyServerDialog(obj.info);
    }

    private onReconnectClicked = (_: Event, obj: any) => {
        const info: ServerInfo = obj.info;
        this.props.onServerAdded(info.address, info.username, info.password, true);
    }

    private createChannel = (serverAddress: string, name: string) => {
        const selected = serverAddress === this.props.selectedChannel?.address && name === this.props.selectedChannel.name;
        const className = selected ? "channel-button channel-button-selected" : "channel-button channel-button-unselected";

        return (
            <li key={name}>
                <ContextMenuTrigger id={"channel_context_trigger_" + serverAddress + name}>
                    <button className={className} onClick={() => this.props.onSelectedChannelChanged({ address: serverAddress, name })}>
                        {name}
                    </button>
                </ContextMenuTrigger>
                <ContextMenu id={"channel_context_trigger_" + serverAddress + name} className="context-menu">
                    <MenuItem className="context-menu-item">Leave Channel</MenuItem>
                </ContextMenu>
            </li>
        );
    }

    private createServer = (info: ServerInfo) => {
        return (
            <li key={info.address}>
                <ContextMenuTrigger id={"server_context_trigger_" + info.address}>
                    <div className="server-name">
                        {info.name}
                        {info.isClosed && this.createDisconnectedImage(info.quitReason)}
                    </div>
                </ContextMenuTrigger>
                <ul>
                    {info.channelNames.map(name => this.createChannel(info.address, name))}
                </ul>
                <ContextMenu id={"server_context_trigger_" + info.address} className="context-menu">
                    <MenuItem className="context-menu-item">Join Channel</MenuItem>
                    <MenuItem className="context-menu-item" data={{info}} onClick={this.onReconnectClicked}>Reconnect</MenuItem>
                    <MenuItem className="context-menu-item" data={{address: info.address}} onClick={this.onLeaveServerClicked}>Leave Server</MenuItem>
                    <MenuItem className="context-menu-item" data={{info}} onClick={this.onShowPropertiesClicked}>Properties...</MenuItem>
                </ContextMenu>
            </li>
        );
    }

    private createDisconnectedImage = (disconnectInfo?: string) => {
        return (
            <img src="disconnect.svg" alt="Disconnected" className="disconnected-image" title={disconnectInfo} />
        )
    }

    render() {
        const servers = this.props.connectedServers.map(this.createServer);
        const containerClass = this.props.isHidden ? "server-container hidden" : "server-container scrollbar";

        return (
            <div className={containerClass}>
                <button onClick={this.showAddServerDialog} className="button">Add a server</button>
                <ul>
                    {servers}
                </ul>
                <ServerPropertiesDialog show={this.state.showAddServer} onClose={this.hideAddServerDialog}
                    onCommit={this.onAddServerCommitted} title="Add Server" okButtonText="Add" />
                <ServerPropertiesDialog show={this.state.showModifyServer} onClose={this.hideModifyServerDialog}
                    onCommit={this.onModifyServerCommitted} title="Modify Server" okButtonText="Modify"
                    defaultServerAddress={this.state.modifyServerAddress} defaultUsername={this.state.modifyServerUsername}
                    defaultPassword={this.state.modifyServerPassword} infoText={this.state.modifyServerInfo} />
            </div>
        );
    }
}

export default ServerTree;