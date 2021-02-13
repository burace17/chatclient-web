/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
 
import React from "react";

interface Properties {
    id: number;
    time: number;
    text: string;
    nickname?: string;
}
export default class Message extends React.Component<Properties> {
    render() {
        if (this.props.nickname) {
            return (
                <li>{this.props.nickname}: {this.props.text}</li> 
            );
        }
        else {
            return (
                <li>{this.props.text}</li> 
            );
        }
    }
}