import '../App.css';

interface Properties {
    channel: String
}

function Header(props: Properties) {
    return (
        <div className="App-text">
            {props.channel}
        </div>
    );
}

export default Header;