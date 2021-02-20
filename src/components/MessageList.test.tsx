/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { fireEvent, render, screen, within } from "@testing-library/react";
import { ClientMessage } from "../net/client";
import MessageList from "./MessageList";

function makeMessage(message_id: number, time: number, content: string, nickname: string): ClientMessage {
    return {
        message_id,
        time,
        content,
        nickname
    };
}

test("Message list", () => {
    const date = new Date();
    const now = Math.floor(date.getTime() / 1000);
    const inputs: [number, number, string, string][] = [
        [1, 1613536972, "hello world", "testuser"],
        [2, 1613536980, "my message", "testuser"],
        [3, 1613536990, "this works?", "otheruser"],
        [4, now, "don't group this", "otheruser"],
        [5, now + 10, "but make sure we group this", "testuser"]
    ];

    const messages = inputs.map(args => makeMessage.apply(this, args));
    render(<MessageList messages={messages} />);

    const getDateString = (time: number) => {
        const targetDate = new Date(time * 1000);
        const dateOptions = {
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
        const timeOptions = {
            hour: "numeric",
            minute: "2-digit"
        };
        return targetDate.toLocaleTimeString([], timeOptions);
    };

    // we expect to find this date in the DOM
    expect(screen.queryByText(getDateString(inputs[0][1]))).toBeInTheDocument();

    // but not these, since they should be grouped
    expect(screen.queryByText(getDateString(inputs[1][1]))).not.toBeInTheDocument();
    expect(screen.queryByText(getDateString(inputs[2][1]))).not.toBeInTheDocument();

    // now check that we don't show the full date when the days are the same
    expect(screen.queryByText(getDateString(inputs[3][1]))).not.toBeInTheDocument();

    // this time should only appear once since the next message should be grouped.
    expect(screen.queryAllByText(getTimeString(inputs[3][1])).length === 1).toBeTruthy();
});