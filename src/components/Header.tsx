/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
 
import React from "react";
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
    // this is to prevent the on screen keyboard on mobile devices from disappearing
    // when clicking these buttons.
    const mouseDown = (e: React.MouseEvent) => e.preventDefault();

    return (
        <div className="header">
            <button className="burger-button" onClick={props.onToggleServerTree}
                onMouseDown={mouseDown} title="Toggle Server List" data-cy="toggle-server-list">
                {BurgerButton()}
            </button>
            <span className="channel-name">{props.channel}</span>
            <button className="burger-button" onClick={props.onToggleUserList}
                onMouseDown={mouseDown} title="Toggle User List" data-cy="toggle-user-list">
                {BurgerButton()}
            </button>
        </div>
    );
}

export default Header;