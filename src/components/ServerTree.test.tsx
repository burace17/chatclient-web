/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
 
import { fireEvent, render, screen, within } from "@testing-library/react";
import ServerTree from "./ServerTree";
import { Channel, ServerInfo } from "../App";
import Modal from "react-modal";

test("Leave server", () => {
    const server1 = {
        address: "wss://192.168.0.111:1337",
        username: "username",
        password: "password",
        name: "wss://192.168.0.111:1337",
        channelNames: [],
        isClosed: true
    };
    const server2 = {
        address: "wss://localhost:1337",
        username: "test",
        password: "test",
        name: "Server 2",
        channelNames: ["#general", "#testing"],
        isClosed: false
    };

    let servers = [server1, server2];
    const onServerAdded = jest.fn();
    const onServerRemoved = jest.fn();
    const onSelectedChannelChanged = jest.fn();
    const selectedChannel: Channel | null = null;
    const isHidden = false;

    render(<ServerTree connectedServers={servers} selectedChannel={selectedChannel} isHidden={isHidden}
        onServerAdded={onServerAdded} onServerRemoved={onServerRemoved} 
        onSelectedChannelChanged={onSelectedChannelChanged} />);

    const server1Element = screen.getByText(/192.168.0.111/i);
    fireEvent.click(server1Element, { button: 2 });

    const contextMenuWrapper = server1Element.parentElement!.parentElement!;
    const leaveServerButton = within(contextMenuWrapper).getByRole("menuitem", { name: /leave server/i });
    fireEvent.click(leaveServerButton);

    expect(onServerRemoved).toHaveBeenCalledTimes(1);
    expect(onServerRemoved).toHaveBeenCalledWith("wss://192.168.0.111:1337");
    expect(onServerAdded).not.toHaveBeenCalled();
});

test("Add server", () => {
    const servers: ServerInfo[] = [];
    const onServerAdded = jest.fn();
    const onServerRemoved = jest.fn();
    const onSelectedChannelChanged = jest.fn();
    const selectedChannel: Channel | null = null
    const isHidden = false;

    render(<div id="root"><ServerTree connectedServers={servers} selectedChannel={selectedChannel} isHidden={isHidden}
        onServerAdded={onServerAdded} onServerRemoved={onServerRemoved} 
        onSelectedChannelChanged={onSelectedChannelChanged} /></div>);
    Modal.setAppElement("#root");


    const testAddServer = (addr: string, username: string, password: string, shouldSubmit: boolean) => {
        const addServerButton = screen.getByRole("button", { name: "Add a server"});
        fireEvent.click(addServerButton);

        const addressElem = screen.getByPlaceholderText(/address/i);
        fireEvent.change(addressElem, { target: { value: addr } });

        const userElem = screen.getByPlaceholderText(/username/i);
        fireEvent.change(userElem, { target: { value: username } });

        const passwordElem = screen.getByPlaceholderText(/password/i);
        fireEvent.change(passwordElem, { target: { value: password } });

        if (shouldSubmit) {
            const submit = screen.getByRole("button", { name: "Add" });
            fireEvent.click(submit);
        }
        else {
            // TODO: key presses aren't working with this for some reason.
            //const dialog = screen.getByRole("dialog");
            //fireEvent.keyPress(dialog, { key: "Escape", code: "Escape" });
            const cancel = screen.getByRole("button", { name: "Cancel" });
            fireEvent.click(cancel);
        }
    };

    const combos: [string, string, string, boolean][] = [
        ["localhost", "myusername", "mypassword", true],
        ["192.168.1.1", "someotheruser", "really secret password", false],
        ["192.168.1.126", "test", "testpassword", true]
    ];

    combos.forEach(args => testAddServer.apply(this, args));
    expect(onServerAdded).toHaveBeenCalledTimes(combos.filter(args => args[3]).length);
});