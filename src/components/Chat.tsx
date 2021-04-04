/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
 
import "./Chat.css";
import React from "react";
import MessageList from "./MessageList";
import EntryBox from "./EntryBox";
import { ClientMessage } from "../net/client";

interface Properties {
    messages: Array<ClientMessage>;
    onSendMessage: (text: string) => void;
    canSendMessage: boolean;
}

export class Chat extends React.Component<Properties> {
    private entryBoxRef: React.RefObject<EntryBox> = React.createRef();

    focusEntryBox() {
        this.entryBoxRef.current?.focus();
    }

    render() {
        return (
            <div className="Chat">
                <MessageList messages={this.props.messages} />
                <EntryBox onSendMessage={this.props.onSendMessage} canSendMessage={this.props.canSendMessage} 
                    ref={this.entryBoxRef} />
            </div>
        );
    }
}

export default Chat;