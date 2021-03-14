/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import React from "react";
import "./ServerProperties.css";
import "./util.css";

interface Properties {
    onServerAddressChanged: (address: string) => void;
    onUsernameChanged: (username: string) => void;
    onPasswordChanged: (password: string) => void;
    onRegisterOptionChanged: (shouldRegister: boolean) => void;

    defaultAddress?: string;
    defaultUsername?: string;
    defaultPassword?: string;
    showRegistrationOptions: boolean;
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
        const onLoginOptionChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
            this.props.onRegisterOptionChanged(!e.target.checked);
        };
        const onRegisterOptionChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
            this.props.onRegisterOptionChanged(e.target.checked);
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
                {this.props.showRegistrationOptions && <li className="server-form-row">
                    <span className="text">
                        Do you have an account on this server?
                    </span>
                </li>}
                {this.props.showRegistrationOptions && <li>
                    <label>
                        <input type="radio" name="register" value="Yes, log me in." defaultChecked
                            onChange={onLoginOptionChanged} />
                        <span className="text">Yes, log me in.</span>
                        <br />
                    </label>
                    <label>
                        <input type="radio" name="register" value="No, create an account for me."
                            onChange={onRegisterOptionChanged} />
                        <span className="text">No, create an account for me.</span>
                    </label>
                </li>}
            </ul>
        );
    }
}