/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
 
import React from "react";
import "./ServerProperties.css";

interface Properties {
    onServerAddressChanged: (address: string) => void;
    onUsernameChanged: (username: string) => void;
    onPasswordChanged: (password: string) => void;

    defaultAddress?: string;
    defaultUsername?: string;
    defaultPassword?: string;
}

export default class ServerProperties extends React.Component<Properties> {
    render() {
        const onServerAddressChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
            this.props.onServerAddressChanged(e.target.value);
        };
        const onUsernameChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
            this.props.onUsernameChanged(e.target.value);
        };
        const onPasswordChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
            this.props.onPasswordChanged(e.target.value);
        };

        return (
            <ul className="server-form">
                <li className="server-form-row">
                    <input type="text" className="textbox" placeholder="Server Address..." autoFocus
                        onChange={onServerAddressChanged} defaultValue={this.props.defaultAddress} />
                </li>
                <li className="server-form-row">
                    <input type="text" className="textbox" placeholder="Username..."
                        onChange={onUsernameChanged} defaultValue={this.props.defaultUsername} />
                </li>
                <li className="server-form-row">
                    <input type="password" className="textbox" placeholder="Password..."
                        onChange={onPasswordChanged} defaultValue={this.props.defaultPassword} />
                </li>
            </ul>
        );
    }
}