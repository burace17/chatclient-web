/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
 
import "../App.css";
import "./Header.css";

interface Properties {
    channel: String
    onToggleServerTree: () => void;
    onToggleUserList: () => void;
}

function BurgerButton() {
    return (
        <svg viewBox="0 0 100 80" width="24" height="24">
            <rect width="100" height="10" fill="white" />
            <rect y="30" width="100" height="10" fill="white" />
            <rect y="60" width="100" height="10" fill="white" />
        </svg>
    );
}

function Header(props: Properties) {
    return (
        <div className="header">
            <button className="burger-button" onClick={props.onToggleServerTree}
                title="Toggle Server List">
                {BurgerButton()}
            </button>
            <span className="channel-name">{props.channel}</span>
            <button className="burger-button" onClick={props.onToggleUserList}
                title="Toggle User List">
                {BurgerButton()}
            </button>
        </div>
    );
}

export default Header;