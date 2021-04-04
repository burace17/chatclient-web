/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { render, screen } from "@testing-library/react";
import { ClientMessage } from "../net/client";
import MessageList from "./MessageList";

test("Message list grouping", () => {
    const date = new Date();
    const now = Math.floor(date.getTime() / 1000);
    const messages: ClientMessage[] = [
        {message_id: 1, time: 1613536972, content: "hello world", nickname: "testuser", attachments: []},
        {message_id: 2, time: 1613536980, content: "my message", nickname: "testuser", attachments: []},
        {message_id: 3, time: 1613536990, content: "this works?", nickname: "otheruser", attachments: []},
        {message_id: 4, time: now, content: "don't group this", nickname: "otheruser", attachments: []},
        {message_id: 5, time: now + 10, content: "but make sure we group this", nickname: "testuser", attachments: []}
    ];

    render(<MessageList messages={messages} />);

    const getDateString = (time: number) => {
        const targetDate = new Date(time * 1000);
        const dateOptions: Intl.DateTimeFormatOptions = {
            year: "2-digit",
            month: "2-digit",
            day: "2-digit",
            hour: "numeric",
            minute: "2-digit"
        };
        return targetDate.toLocaleString([], dateOptions);
    };

    const getTimeString = (time: number) => {
        const targetDate = new Date(time * 1000);
        const timeOptions: Intl.DateTimeFormatOptions = {
            hour: "numeric",
            minute: "2-digit"
        };
        return targetDate.toLocaleTimeString([], timeOptions);
    };

    // we expect to find this date in the DOM
    expect(screen.queryByText(getDateString(messages[0].time))).toBeInTheDocument();

    // but not these, since they should be grouped
    expect(screen.queryByText(getDateString(messages[1].time))).not.toBeInTheDocument();
    expect(screen.queryByText(getDateString(messages[2].time))).not.toBeInTheDocument();

    // now check that we don't show the full date when the days are the same
    expect(screen.queryByText(getDateString(messages[3].time))).not.toBeInTheDocument();

    // this time should only appear once since the next message should be grouped.
    expect(screen.queryAllByText(getTimeString(messages[3].time)).length === 1).toBeTruthy();
});