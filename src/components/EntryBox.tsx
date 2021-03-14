/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import "./EntryBox.css";
import "./util.css";

interface Properties {
    onSendMessage: (text: string) => void;
    canSendMessage: boolean;
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