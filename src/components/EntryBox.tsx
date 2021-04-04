/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import React from "react";
import "./EntryBox.css";
import "./util.css";

interface Properties {
    onSendMessage: (text: string) => void;
    canSendMessage: boolean;
}

export class EntryBox extends React.Component<Properties> {
    private inputElement: React.RefObject<HTMLInputElement> = React.createRef();

    focus() {
        this.inputElement.current?.focus();
    }

    render() {
        const onKeyDown = (evt: React.KeyboardEvent<HTMLInputElement>) => {
            if (evt.key === "Enter") {
                const target = evt.target as HTMLInputElement;
                this.props.onSendMessage(target.value);
                target.value = "";
            }
        };

        const placeholder = this.props.canSendMessage ? "Type a message..." : "Not connected...";
        return (
            <div className="entrybox-container">
                <input type="text" className="entrybox textbox" placeholder={placeholder}
                    onKeyPress={onKeyDown} disabled={!this.props.canSendMessage} ref={this.inputElement} />
            </div>
        );
    }
}

export default EntryBox;