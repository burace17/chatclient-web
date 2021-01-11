import '../App.css';

interface Properties {
    channel: String
}

export function Header(props: Properties) {
    return (
        <div className="App-text">
            {props.channel}
            <hr />
        </div>
    );
}