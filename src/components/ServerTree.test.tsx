import { fireEvent, render, screen, within } from "@testing-library/react";
import ServerTree from "./ServerTree";
import { Channel } from "../App";

test("Leave server", () => {
    const server1 = {
        address: "wss://192.168.0.111",
        username: "username",
        password: "password",
        name: "wss://192.168.0.111",
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
    const onServerAdded = (addr: string | undefined, username: string | undefined, password: string | undefined, persist: boolean) => {};
    const onServerRemoved = (addr: string) => { servers = servers.filter(obj => obj.address !== addr )};
    const onSelectedChannelChanged = (_: Channel) => {};
    const selectedChannel: Channel | null = null;
    const isHidden = false;

    render(<ServerTree connectedServers={servers} selectedChannel={selectedChannel} isHidden={isHidden}
        onServerAdded={onServerAdded} onServerRemoved={onServerRemoved} 
        onSelectedChannelChanged={onSelectedChannelChanged} />);

    const server1Element = screen.getByText(/192.168.0.111/i);
    expect(server1Element).toBeInTheDocument();

    fireEvent.click(server1Element, { button: 2 });

    const contextMenuWrapper = server1Element.parentElement!.parentElement!;
    const leaveServerButton = within(contextMenuWrapper).getByRole("menuitem", { name: /leave server/i });
    expect(leaveServerButton).toBeInTheDocument();

    fireEvent.click(leaveServerButton);

    expect(servers.length === 1).toBeTruthy();
    expect(servers.find(obj => obj.name === "Server 2")).toBeTruthy();
});