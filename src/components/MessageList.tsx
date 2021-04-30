/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import "./MessageList.css";
import Message from "./Message";
import { ClientMessage } from "../net/client";
import React from "react";
import { Virtuoso, VirtuosoHandle } from "react-virtuoso";

interface Properties {
    messages: ClientMessage[];
    messagesOnServer: number;
    lastViewedMessage: number | undefined;
    windowHasFocus: boolean;
    onBottomStateChanged: (atBottom: boolean) => void;
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
    private listRef: React.RefObject<VirtuosoHandle> = React.createRef();

    constructor(props: Properties) {
        super(props);
        this.state = {
            showTime: true
        };
    }

    scrollToEnd() {
        if (this.props.messages.length > 0) {
            console.log("scrolling to end");
            const index = this.props.messages.length - 1;
            requestAnimationFrame(() => this.listRef.current?.scrollToIndex(index));
        }
    }

    componentDidMount() {
        console.log("mounted, last read: " + this.props.lastViewedMessage);
        console.log("mount, number of messages: " + this.props.messages?.length);
    }

    render() {
        const msgs = groupMessages(Array.from(this.props.messages), 60);
        console.log("render, last read: " + this.props.lastViewedMessage);
        return (
            <Virtuoso totalCount={msgs.length} 
                itemContent={index => msgs[index]} 
                className="message-list scrollbar"
                initialTopMostItemIndex={this.props.lastViewedMessage ?? this.props.messages.length - 1}
                atBottomStateChange={this.props.onBottomStateChanged}
                ref={this.listRef}/>
        );
    }
}

export default MessageList;