/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import "./MessageList.css";
import Message from "./Message";
import { ClientMessage } from "../net/client";
import React from "react";

interface Properties {
    messages: ClientMessage[];
    lastViewedMessage: number | undefined;
    initialMessageCount?: number;
    onBottomStateChanged: (atBottom: boolean) => void;
}

interface State {
    showTime: boolean;
    atBottom: boolean;
}

// Groups messages together that came in within a specific interval (in seconds)
function groupMessages(msgs: ClientMessage[], interval: number) {
    let groupedMsgs: JSX.Element[] = [];
    const sortedMsgs = msgs.sort((a, b) => b.time - a.time);
    let index = 0;
    while (sortedMsgs.length > 0) {
        const current = sortedMsgs.pop()!;
        groupedMsgs.push(<Message key={current.message_id} index={index++} message={current} showTime={true} />);

        let additionalLines = [];
        while (sortedMsgs.length > 0 && sortedMsgs[sortedMsgs.length - 1].time - current.time < interval) {
            let msg = sortedMsgs.pop()!;
            additionalLines.push(<Message key={msg.message_id} index={index++} message={msg} showTime={false} />);
        }
        groupedMsgs = groupedMsgs.concat(additionalLines);
    }

    return groupedMsgs;
}

class MessageList extends React.Component<Properties, State> {
    private messageListEnd: React.RefObject<HTMLDivElement> = React.createRef();
    private messageList: React.RefObject<HTMLUListElement> = React.createRef();
    private messageContainer: React.RefObject<HTMLDivElement> = React.createRef();

    constructor(props: Properties) {
        super(props);
        this.state = {
            showTime: true,
            atBottom: false
        };
    }

    private updateAtBottom = (element: HTMLElement | null) => {
        if (!element) return;
        const atBottom =  Math.ceil(element.scrollHeight - element.scrollTop) === element.clientHeight;
        if (atBottom !== this.state.atBottom) {
            console.log("atBottom " + atBottom);
            this.props.onBottomStateChanged(atBottom);
            this.setState({
                atBottom: atBottom
            });
        }
    }

    scrollToEnd() {
        this.messageListEnd.current?.scrollIntoView?.({ "behavior": "auto" });
    }

    componentDidMount() {
        const listNodes = this.messageList.current?.children;
        if (!listNodes)
            return;

        const lastViewedMessage = this.props.lastViewedMessage ?? listNodes.length - 1;
        if (lastViewedMessage >= listNodes.length)
            return;

        const lastViewedMessageElement = listNodes[lastViewedMessage];

        // a bit hackish, but wrap in setTimeout and requestAnimationFrame to ensure we don't do this
        // until after everything has been rendered.
        setTimeout(() => requestAnimationFrame(() => {
            lastViewedMessageElement?.scrollIntoView?.({ "behavior" : "auto" });
            this.updateAtBottom(this.messageContainer.current);
        }));
    }

    render() {
        const msgs = groupMessages(Array.from(this.props.messages), 60);
        const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
            this.updateAtBottom(e.target as HTMLElement);
        };

        return (
            <div className="message-list scrollbar" onScroll={onScroll} ref={this.messageContainer}>
                <ul ref={this.messageList}>
                    {msgs}
                </ul>
                <div ref={this.messageListEnd} />
            </div>
        );
    }
}

export default MessageList;