import './EntryBox.css';
import './util.css';

interface Properties {
    onSendMessage: (text: string) => void;
}

function EntryBox(props: Properties) {
    const onKeyDown = (evt: React.KeyboardEvent<HTMLInputElement>) => {
        if (evt.key === "Enter") {
            const target = evt.target as HTMLInputElement;
            props.onSendMessage(target.value);
            target.value = "";
        }
    };
    return (
        <div className="entrybox-container">
            <input type="text" className="entrybox textbox" placeholder="Type a message..."
                   onKeyPress={onKeyDown} />
        </div>
    );
}

export default EntryBox;