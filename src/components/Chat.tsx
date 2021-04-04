/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
 
import "./Chat.css";
import MessageList from "./MessageList";
import EntryBox from "./EntryBox";
import { ClientMessage } from "../net/client";

interface Properties {
    messages: Array<ClientMessage>;
    onSendMessage: (text: string) => void;
    canSendMessage: boolean;
}

function Chat(props: Properties) {
    return (
        <div className="Chat">
            <MessageList messages={props.messages} />
            <EntryBox onSendMessage={props.onSendMessage} canSendMessage={props.canSendMessage} />
        </div>
    );
}

export default Chat;