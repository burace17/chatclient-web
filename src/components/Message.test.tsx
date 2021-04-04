/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { cleanup, render, screen } from "@testing-library/react";
import { ClientMessage } from "../net/client";
import Message from "./Message";

test("Message link formatting", () => {
    const date = new Date();
    const now = Math.floor(date.getTime() / 1000);

    // boolean represents if there should be a link for that test case
    const messages: [ClientMessage, boolean][] = [
        [{message_id: 1, time: 1613536972, content: "hello world", nickname: "testuser", attachments: []}, false],
        [{message_id: 2, time: 1613536980, content: "linkhttps://google.com", nickname: "testuser", attachments: []}, true],
        [{message_id: 3, time: 1613536990, content: "this works? http://github.com", nickname: "otheruser", attachments: []}, true],

        // I don't really want to allow FTP but I need to adjust the library I'm using to detect links first.
        //[{message_id: 4, time: now, content: "not this.. ftp://github.com", nickname: "otheruser"}, false],

        [{message_id: 5, time: now + 10, content: "or this file:///root", nickname: "testuser", attachments: []}, false]
    ];

    const testMessage = (message: ClientMessage, hasLink: boolean) => {
        render(<Message message={message} showTime={false} />);
        const link = expect(screen.queryByRole("link"));
        if (hasLink) {
            link.toBeInTheDocument();
        }
        else {
            link.not.toBeInTheDocument();
        }

        cleanup();
    };

    messages.forEach(args => testMessage.apply(this, args));
});