import "./MessageList.css";
import Message from "./Message";
import { ClientMessage } from "../net/client";
import React from "react";

interface Properties {
    messages: Array<ClientMessage>
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

    render() {
        const msgs = this.props.messages.map(msg => {
            return <Message key={msg.id} id={msg.id} time={msg.time} text={msg.text} nickname={msg.nickname} />
        });

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