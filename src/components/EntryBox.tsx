import './EntryBox.css';

interface Properties {

}

export function EntryBox(props: Properties) {
    return (
        <div className="entrybox-container">
            <input type="text" className="entrybox" placeholder="Type a message..." />
        </div>
    );
}