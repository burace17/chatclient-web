/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
 
export interface ClientMessage {
    message_id: number;
    time: number;
    content: string;
    user?: User;
    nickname?: string;
}

export enum UserStatus {
    Online = "Online",
    Away = "Away",
    Offline = "Offline"
}

export interface User {
    id: number;
    username: string;
    nickname: string;
    status: UserStatus;
}

export interface Channel {
    address: string;
    id: number;
    name: string;
    users: User[]
}

export interface ClientProperties {
    address: string;
    username: string;
    password: string;
    onOpen: (addr: string) => void;
    onClose: (addr: string) => void;
    onMessage: (addr: string, channel: string) => void;
    onWelcome: (addr: string, channels: Channel[]) => void;
    onJoin: (addr: string, channel: string, user: User) => void;
    onReceiveChannelInfo: (addr: string, channel: Channel) => void;
    onUserStatusUpdate: (addr: string, user: User) => void;
}

export function compareMessage(a: ClientMessage, b: ClientMessage) {
    return a.time - b.time;
}

export function compareChannel(a: Channel, b: Channel) {
    return a.name.localeCompare(b.name);
}

function appendAddress(message: any, address: string): Channel {
    return {
        address,
        id: message.id,
        name: message.name,
        users: message.users
    }
}

class Client {
    private ws: WebSocket;
    private readonly props: ClientProperties;
    private serverName: string;
    private channels: Channel[] = [];
    private channelMessages = new Map<string, ClientMessage[]>();
    private hasQuit: boolean = false;
    private quitReason: string | undefined;
    private quitCode: number | undefined;

    constructor(props: ClientProperties) {
        this.props = props;
        this.serverName = props.address;
        this.ws = this.connect();
    }

    private connect = () => {
        console.log("Attempting to connect to " + this.props.address);
        let ws = new WebSocket(this.props.address);
        ws.onopen = this.socketOnOpen;
        ws.onclose = this.socketOnClose;
        ws.onmessage = this.socketOnMessage;
        return ws;
    }

    private socketOnOpen = (_: Event) => {
        const ident = {
            "cmd": "IDENT",
            "username": this.props.username,
            "password": this.props.password
        };

        this.ws.send(JSON.stringify(ident));
        this.props.onOpen(this.props.address);
    }

    private socketOnClose = (e: CloseEvent) => {
        console.log("websocket closed - clean: " + e.wasClean + ", code: " + e.code + ", reason: " + e.reason);

        // try to reconnect if it didn't close cleanly.
        // note that firefox seems to set wasClean differently than chrome, so also check the code
        if (!e.wasClean && e.code < 4000) {
            setTimeout(() => {
                if (!this.hasQuit)
                    this.ws = this.connect();
            }, 5000);
        }

        this.quitCode = e.code;
        this.quitReason = e.reason;

        this.props.onClose(this.props.address);
    }

    private socketOnMessage = (evt: MessageEvent<any>) => {
        // TODO: Need types here...
        const message = JSON.parse(evt.data);
        switch (message.cmd) {
            case "WELCOME":
                this.handleWelcome(message);
                break;
            case "MSG": 
                this.handleMsg(message);
                break;
            case "JOIN": 
                this.handleJoin(message);
                break;
            case "STATUS":
                this.handleStatusUpdate(message);
                break;
            case "CHANNELINFO":
                this.handleChannelInfo(message);
                break;
            case "HISTORY":
                this.handleChannelHistory(message);
                break;
            default:
                console.log("Got message with unknown command: " + evt.data);
                break;
        }
    }

    private handleWelcome = (message: any) => {
        this.serverName = message.name;
        this.channels = message.channels.map((chan: any) => appendAddress(chan, this.props.address));
        for (const channel of this.channels) {
            this.channelMessages.set(channel.name, []);
        }

        this.getChannelHistory(this.channels.map(c => c.name));
        this.props.onWelcome(this.props.address, this.channels);
    }

    private handleMsg = (message: any) => {
        let msgs = this.channelMessages.get(message.channel);
        msgs?.push({
            message_id: message.message_id,
            content: message.content,
            time: message.time,
            user: message.user,
            nickname: message.user.nickname
        });
        this.props.onMessage(this.props.address, message.channel);
    }

    private handleJoin = (message: any) => {
        const user = message.user;
        this.props.onJoin(this.props.address, message.channel, user);
    }

    private handleStatusUpdate = (message: any) => {
        this.props.onUserStatusUpdate(this.props.address, message.user);
    }

    private handleChannelInfo = (message: any) => {
        const channel = appendAddress(message.channel, this.props.address);
        this.channels.push(channel);
        this.channelMessages.set(channel.name, []);
        this.props.onReceiveChannelInfo(this.props.address, channel);
    }

    private handleChannelHistory = (data: any) => {
        const messages: { channelName: string, messageList: ClientMessage[]} = data.messages;
        for (const [channelName, msgList] of Object.entries(messages)) {
            const existingMessages = this.channelMessages.get(channelName);
            const messageList = msgList as ClientMessage[];
            if (existingMessages) {
                this.channelMessages.set(channelName, messageList.concat(existingMessages));
                this.props.onMessage(this.props.address, channelName);
            }
        }
    }

    getProps() {
        return this.props;
    }

    getServerName() {
        return this.serverName;
    }

    getChannels() {
        return this.channels;
    }

    getMessages(channel: Channel) {
        return this.channelMessages.get(channel.name);
    }

    isConnected() {
        return this.ws.readyState === 1;
    }

    isClosingOrClosed() {
        return this.ws.readyState === 2 || this.ws.readyState === 3;
    }

    getQuitCode() {
        return this.quitCode;
    }

    getQuitReason() {
        return this.quitReason;
    }

    sendMessage(channel: string, text: string) {
        if (text.length === 0)
            return;

        const packet = {
            "cmd": "MSG",
            "channel": channel,
            "content": text
        };

        this.ws.send(JSON.stringify(packet));
    }

    joinChannel(channel: string) {
        const packet = {
            "cmd": "JOIN",
            "name": channel
        };

        this.ws.send(JSON.stringify(packet));
    }

    getChannelHistory(channels: string[]) {
        const packet = {
            "cmd": "HISTORY",
            "channels": channels
        };

        this.ws.send(JSON.stringify(packet));
    }

    quit() {
        this.hasQuit = true;
        this.ws.close(1000);
    }
}

export default Client;