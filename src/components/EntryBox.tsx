import './EntryBox.css';
import './util.css';

interface Properties {

}

function EntryBox(props: Properties) {
    return (
        <div className="entrybox-container">
            <input type="text" className="entrybox textbox" placeholder="Type a message..." />
        </div>
    );
}

export default EntryBox;