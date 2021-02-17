/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
 
import "./MessageList.css";
import Message from "./Message";
import { ClientMessage, compareMessage } from "../net/client";
import React from "react";

interface Properties {
    messages: ClientMessage[]
}

class MessageList extends React.Component<Properties> {
    private messagesEndRef: React.RefObject<HTMLDivElement>;
    constructor(props: Properties) {
        super(props);
        this.messagesEndRef = React.createRef();
    }
    scrollToBottom() {
        this.messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    }

    componentDidUpdate() {
        this.scrollToBottom();
    }

    componentDidMount() {
        this.scrollToBottom();
    }

    private createMessage = (msg: ClientMessage) => {
        return <Message key={msg.message_id} id={msg.message_id} time={msg.time} text={msg.content} nickname={msg.nickname} />
    }

    render() {
        const msgs = this.props.messages.sort(compareMessage).map(this.createMessage);

        return (
            <div className="message-list scrollbar">
                <ul>
                    {msgs}
                </ul>
                <div ref={this.messagesEndRef} />
            </div>
        );
    }
}

export default MessageList;