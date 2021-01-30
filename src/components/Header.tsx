import "../App.css";
import "./Header.css";

interface Properties {
    channel: String
    onToggleServerTree: () => void;
}

function Header(props: Properties) {
    return (
        <div className="header">
            <button className="toggle-server" onClick={props.onToggleServerTree}
                    title="Toggle Server List">
                <svg viewBox="0 0 100 80" width="24" height="24">
                    <rect width="100" height="10" fill="white" />
                    <rect y="30" width="100" height="10" fill="white" />
                    <rect y="60" width="100" height="10" fill="white" />
                </svg>
            </button>
            <span className="channel-name">{props.channel}</span>
        </div>
    );
}

export default Header;