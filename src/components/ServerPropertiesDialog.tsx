/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
 
import React from "react";
import ModalDialog from "./ModalDialog";
import ServerProperties from "./ServerProperties";
import "./util.css";

interface Properties {
    show: boolean;
    title: string;
    okButtonText: string;
    onClose: () => void;
    onCommit: (address?: string, username?: string, password?: string) => void;
    defaultServerAddress?: string;
    defaultUsername?: string;
    defaultPassword?: string;

    infoText?: string;
}

interface State {
    serverAddress?: string;
    username?: string;
    password?: string;
}

class ServerPropertiesDialog extends React.Component<Properties, State> {
    constructor(props: Properties) {
        super(props);
        this.state = {
            serverAddress: props.defaultServerAddress,
            username: props.defaultUsername,
            password: props.defaultPassword
        }
    }

    render() {
        const fixAddress = (address?: string) => {
            if (!address || address.startsWith("wss://")) // TODO: Make this more robust
                return address;
            else
                return "wss://" + address + ":1337";
        };

        const discard = () => this.props.onClose();
        const commit = () => {
            const address = this.state.serverAddress ?? this.props.defaultServerAddress;
            const username = this.state.username ?? this.props.defaultUsername;
            const password = this.state.password ?? this.props.defaultPassword;
            this.props.onCommit(fixAddress(address), username, password);
        }
        const onServerAddressChanged = (address: string) => this.setState({ serverAddress: address });
        const onUsernameChanged = (username: string) => this.setState({ username });
        const onPasswordChanged = (password: string) => this.setState({ password });

        return (
            <ModalDialog isOpen={this.props.show} title={this.props.title} showOkButton={true} showCancelButton={true} 
                       okButtonText={this.props.okButtonText} onOkButtonPressed={commit} onClose={discard}>
                <span className="text">{this.props.infoText}</span>
                <ServerProperties onServerAddressChanged={onServerAddressChanged} onUsernameChanged={onUsernameChanged}
                    onPasswordChanged={onPasswordChanged} defaultAddress={this.props.defaultServerAddress}
                    defaultUsername={this.props.defaultUsername} defaultPassword={this.props.defaultPassword} />
            </ModalDialog>
        );
    }
}

export default ServerPropertiesDialog;