import "./Chat.css";
import MessageList from "./MessageList";
import EntryBox from "./EntryBox";
import { ClientMessage } from "../net/client";

interface Properties {
    messages: Array<ClientMessage>
    onSendMessage: (text: string) => void
    canSendMessage: boolean
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