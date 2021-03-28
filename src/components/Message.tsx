/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import React from "react";
import { ClientMessage } from "../net/client";
import urlRegex from "url-regex-safe";
import replaceToArray from "string-replace-to-array";
import "./Message.css";

interface Properties {
    message: ClientMessage;
    showTime: boolean;
}

export default class Message extends React.Component<Properties> {
    private formatTime = (time: number) => {
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

    private matcher: RegExp = urlRegex({ strict: true });
    private formatMessage = (key: number, message: string) => {
        let parts = replaceToArray(message, this.matcher, (s: string) => {
            return <a key={key} target="_blank" rel="noreferrer" href={s}>{s}</a>;
        });
        return parts;
    }

    render() {
        const msg = this.props.message;
        const className = msg.isPing ? "message-content message-content-pinged" : "message-content";
        if (msg.nickname) {
            return (
                <li key={msg.message_id} className="message">
                    {this.props.showTime && this.formatTime(msg.time)}
                    <div className={className}>
                        <span className="nickname">{msg.nickname}</span>: {this.formatMessage(msg.message_id, msg.content)}
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