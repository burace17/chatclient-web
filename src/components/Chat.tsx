import './Chat.css';
import MessageList from './MessageList';
import EntryBox from './EntryBox';

interface Properties {

}

function Chat(props: Properties) {
    return (
        <div className="Chat">
            <MessageList />
            <EntryBox />
        </div>
    );
}

export default Chat;