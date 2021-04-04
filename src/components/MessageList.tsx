/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import "./MessageList.css";
import Message from "./Message";
import { ClientMessage } from "../net/client";
import React from "react";

interface Properties {
    messages: ClientMessage[];
}

interface State {
    showTime: boolean;
}

// Groups messages together that came in within a specific interval (in seconds)
function groupMessages(msgs: ClientMessage[], interval: number) {
    let groupedMsgs: JSX.Element[] = [];
    const sortedMsgs = msgs.sort((a, b) => b.time - a.time);
    while (sortedMsgs.length > 0) {
        const current = sortedMsgs.pop()!;
        let additionalLines = [];
        while (sortedMsgs.length > 0 && sortedMsgs[sortedMsgs.length - 1].time - current.time < interval) {
            let msg = sortedMsgs.pop()!;
            additionalLines.push(<Message key={msg.message_id} message={msg} showTime={false} />);
        }

        groupedMsgs.push(<Message key={current.message_id} message={current} showTime={true} />);
        groupedMsgs = groupedMsgs.concat(additionalLines);
    }

    return groupedMsgs;
}

class MessageList extends React.Component<Properties, State> {
    private messagesEndRef: React.RefObject<HTMLDivElement> = React.createRef();

    constructor(props: Properties) {
        super(props);
        this.state = {
            showTime: true
        };
    }

    scrollToBottom() {
        this.messagesEndRef.current?.scrollIntoView?.({ behavior: "auto" });
    }

    /*
    scrollToPercentage(percentage: number) {
        const percent = percentage;
        const element = this.messagesListRef.current;
        const container = this.containerRef.current;
        if (element && container) {
            const offset = percent * element.offsetHeight;
            console.log("percentage: " + percent + ", scrolling to: " + offset);
            container.scrollTo({ left: 0, top: offset, behavior: "auto"});
        }
    }*/

    componentDidUpdate() {
        this.scrollToBottom();
    }

    componentDidMount() {
        this.scrollToBottom();
    }

    render() {
        const msgs = groupMessages(Array.from(this.props.messages), 60);
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