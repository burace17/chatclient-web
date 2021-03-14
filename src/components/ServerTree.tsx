/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
 
import "./ServerTree.css";
import "./util.css";
import ServerPropertiesDialog from "./ServerPropertiesDialog";
import { ServerInfo, ServerSelection } from "../App";
import React from "react";
import { ContextMenu, MenuItem, ContextMenuTrigger } from "react-contextmenu";
import { Channel, compareChannel } from "../net/client";

interface Properties {
    onServerAdded: (addr: string | undefined, username: string | undefined, password: string | undefined, 
        persist: boolean, shouldRegister: boolean) => void;
    onServerRemoved: (addr: string) => void;
    onSelectedChannelChanged: (newChannel: ServerSelection) => void;
    connectedServers: ServerInfo[];
    selectedChannel: ServerSelection | null;
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

    private onAddServerCommitted = (shouldRegister: boolean, address?: string, username?: string, password?: string) => {
        this.setState({ showAddServer: false });
        this.props.onServerAdded(address, username, password, true, shouldRegister);
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
        });
    }

    private onModifyServerCommitted = (_: boolean, address?: string, username?: string, password?: string) => {
        this.setState({ showModifyServer: false });
        if (this.state.modifyServerAddress)
            this.props.onServerRemoved(this.state.modifyServerAddress);
        this.props.onServerAdded(address, username, password, true, false);
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
        this.props.onServerAdded(info.address, info.username, info.password, true, false);
    }

    private createChannel = (channel: Channel, info: ServerInfo) => {
        const selectedChannel = this.props.selectedChannel as Channel;
        const selected = channel.address === selectedChannel?.address && channel.name === selectedChannel.name;
        let className = selected ? "channel-button channel-button-selected" : "channel-button channel-button-unselected";
        if (info.channelsWithUnreadMessages.includes(channel))
            className += " channel-button-unread";

        return (
            <li key={channel.name}>
                <ContextMenuTrigger id={"channel_context_trigger_" + channel.address + channel.name}>
                    <button className={className} onClick={() => this.props.onSelectedChannelChanged(channel)}>
                        {channel.name}
                    </button>
                </ContextMenuTrigger>
                <ContextMenu id={"channel_context_trigger_" + channel.address + channel.name} className="context-menu">
                    <MenuItem className="context-menu-item">Leave Channel</MenuItem>
                </ContextMenu>
            </li>
        );
    }

    private createServer = (info: ServerInfo) => {
        const selectedChannel = this.props.selectedChannel as Channel;
        const selected = info.address === selectedChannel?.address && !selectedChannel.name;
        const className = selected ? "server-name channel-button-selected" : "server-name";
        return (
            <li key={info.address}>
                <ContextMenuTrigger id={"server_context_trigger_" + info.address}>
                    <div className={className} onClick={() => this.props.onSelectedChannelChanged({ address: info.address })}
                        data-cy={info.name}>
                        {info.name}
                        {info.isClosed && this.createDisconnectedImage(info.quitReason)}
                    </div>
                </ContextMenuTrigger>
                <ul>
                    {info.channels.sort(compareChannel).map(c => this.createChannel(c, info))}
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
        );
    }

    render() {
        const servers = this.props.connectedServers.map(this.createServer);
        const containerClass = this.props.isHidden ? "server-container hidden" : "server-container scrollbar";

        return (
            <div className={containerClass}>
                <button onClick={this.showAddServerDialog} className="button" data-cy="add-server">Add a server</button>
                <ul>
                    {servers}
                </ul>
                <ServerPropertiesDialog show={this.state.showAddServer} onClose={this.hideAddServerDialog}
                    onCommit={this.onAddServerCommitted} title="Add Server" okButtonText="Add" 
                    showRegistrationOptions={true} />
                <ServerPropertiesDialog show={this.state.showModifyServer} onClose={this.hideModifyServerDialog}
                    onCommit={this.onModifyServerCommitted} title="Modify Server" okButtonText="Modify"
                    defaultServerAddress={this.state.modifyServerAddress} defaultUsername={this.state.modifyServerUsername}
                    defaultPassword={this.state.modifyServerPassword} infoText={this.state.modifyServerInfo} 
                    showRegistrationOptions={false} />
            </div>
        );
    }
}

export default ServerTree;