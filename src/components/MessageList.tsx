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

    scrollToLastViewed() {
        /*if (this.props.lastViewedMessage) {
            //const msgs = this.props.messages.sort((a,b) => b.time - a.time);
            const index = this.props.messages.findIndex(msg => msg.message_id === this.props.lastViewedMessage);
            console.log(`last message id: ${this.props.lastViewedMessage}, index: ${index}`);
            this.listRef.current?.scrollToIndex(index);
        }*/
    }

    componentDidMount() {
        //this.scrollToLastViewed();
    }

    render() {
        const msgs = groupMessages(Array.from(this.props.messages), 60);
        /*const endReeached = (index: number) => {
            console.log("end reached: " + index);
            this.props.onBottomStateChanged(true);
        };
        const bottomStateChanged = (state: boolean) => {
            console.log(`bottom state changed: ${state}`);
        };*/
        return (
            <Virtuoso totalCount={msgs.length} 
                itemContent={index => msgs[index]} 
                followOutput={false}
                className="message-list scrollbar"
                initialTopMostItemIndex={this.props.lastViewedMessage}
                atBottomStateChange={this.props.onBottomStateChanged}/>
        );
    }
}

export default MessageList;