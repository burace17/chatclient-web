import './EntryBox.css';
import './util.css';

interface Properties {
    onSendMessage: (text: string) => void
    canSendMessage: boolean
}

function EntryBox(props: Properties) {
    const onKeyDown = (evt: React.KeyboardEvent<HTMLInputElement>) => {
        if (evt.key === "Enter") {
            const target = evt.target as HTMLInputElement;
            props.onSendMessage(target.value);
            target.value = "";
        }
    };

    const placeholder = props.canSendMessage ? "Type a message..." : "Not connected...";
    return (
        <div className="entrybox-container">
            <input type="text" className="entrybox textbox" placeholder={placeholder}
                   onKeyPress={onKeyDown} disabled={!props.canSendMessage} />
        </div>
    );
}

export default EntryBox;