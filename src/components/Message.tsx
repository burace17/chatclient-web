/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import React from "react";
import { ClientMessage } from "../net/client";
import "./Message.css";

interface Properties {
    message: ClientMessage;
    showTime: boolean;
}

function formatTime(time: number) {
    const date = new Date(time * 1000);
    const now = new Date();
    const sameDay = now.getDate() === date.getDate()
                 && now.getMonth() === date.getMonth()
                 && now.getFullYear() === date.getFullYear();
    const timeOptions: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit" };
    const dateOptions: Intl.DateTimeFormatOptions = {
        year: "2-digit",
        month: "2-digit",
        day: "2-digit",
        hour: "numeric",
        minute: "2-digit"
    };

    return (
        <div className="message-time">
            {sameDay ? date.toLocaleTimeString([], timeOptions) : date.toLocaleString([], dateOptions)}
        </div>
    );
}

export default class Message extends React.Component<Properties> {
    render() {
        const msg = this.props.message;
        if (msg.nickname) {
            return (
                <li key={msg.message_id} className="message">
                    {this.props.showTime && formatTime(msg.time)}
                    <div className="message-content">
                        <span className="nickname">{msg.nickname}</span>: {msg.content}
                    </div>
                </li>
            );
        }
        else { // this case is for information messages (not from other users)
            return (
                <li key={msg.message_id}>{msg.content}</li>
            );
        }
    }
}