/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import React from "react";
import { ClientMessage, MessageAttachment } from "../net/client";
import urlRegex from "url-regex-safe";
import replaceToArray from "string-replace-to-array";
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

function formatMessage(urlMatcher: RegExp, message: string) {
    // using this to ensure <a> elements have unique keys.
    const urlOccurances = new Map<string, number>();
    const urlElements = replaceToArray(message, urlMatcher, (s: string) => {
        if (!urlOccurances.has(s))
            urlOccurances.set(s, 1);
        const occurance = urlOccurances.get(s)!;
        urlOccurances.set(s, occurance + 1);
        return <a key={s + occurance} target="_blank" rel="noreferrer" href={s}>{s}</a>;
    });
    return urlElements;
}

function createImage(url: string, onImageLoad: () => void) {
    return (
        <li key={url}>
            <a target="_blank" rel="noreferrer" href={url}>
                <img className="image" alt="" src={url} onError={e => e.currentTarget.style.display = "none"} 
                    onLoad={onImageLoad} />
            </a>
        </li>
    );
}

function renderAttachments(attachments: MessageAttachment[], onImageLoad: () => void) {
    const elements: React.ReactNode[] = [];
    const uniqueAttachments = [...new Map(attachments.map(a => [a.url, a])).values()];
    for (const attachment of uniqueAttachments) {
        if (attachment.mime.startsWith("image")) {
            elements.push(createImage(attachment.url, onImageLoad));
        }
    }
    return elements;
}

export default class Message extends React.Component<Properties> {
    private urlMatcher: RegExp = urlRegex({ strict: true });

    render() {
        const msg = this.props.message;
        const className = msg.isPing ? "message-content message-content-pinged" : "message-content";
        const onImageLoad = () => this.forceUpdate();
        if (msg.nickname) {
            return (
                <li key={msg.message_id} className="message">
                    {this.props.showTime && formatTime(msg.time)}
                    <div className={className}>
                        <span className="nickname">{msg.nickname}</span>: {formatMessage(this.urlMatcher, msg.content)}
                    </div>
                    {msg.attachments.length > 0 && <ul data-cy="message-attachments">
                        {renderAttachments(msg.attachments, onImageLoad)}
                    </ul>}
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