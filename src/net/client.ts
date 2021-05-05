/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

export interface ClientMessage {
    message_id: number;
    time: number;
    content: string;
    attachments: MessageAttachment[];
    user?: User;
    nickname?: string;
    isPing?: boolean;
}

export interface MessageAttachment {
    url: string;
    mime: string;
}

export enum UserStatus {
    Online = "Online",
    Away = "Away",
    Offline = "Offline"
}

export enum ChannelNotificationStatus {
    None,
    UnreadMessages,
    Pinged
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
    users: User[];
    status?: ChannelNotificationStatus;
}

export interface ClientProperties {
    address: string;
    username: string;
    password: string;
    onOpen: (addr: string) => void;
    onClose: (addr: string) => void;
    onMessage: (addr: string, channel: string, message?: ClientMessage) => void;
    onWelcome: (addr: string, channels: Channel[]) => void;
    onJoin: (addr: string, channel: string, user: User) => void;
    onReceiveChannelInfo: (addr: string, channel: Channel) => void;
    onUserStatusUpdate: (addr: string, user: User) => void;
    onChannelBeingViewed: () => void;
    onReceiveMessageHistory: () => void;
}

export function compareChannel(a: Channel, b: Channel) {
    return a.name.localeCompare(b.name);
}

function appendAddress(message: any, address: string): Channel {
    return {
        address,
        id: message.id,
        name: message.name,
        users: message.users,
        status: ChannelNotificationStatus.None
    };
}

class Client {
    private ws: WebSocket;
    private readonly props: ClientProperties;
    private serverName: string;

    private channels: Channel[] = [];

    private gotHistory = false;

    // This stores the messages currently loaded for each channel
    // There may be significantly more on the server which we don't know about
    private channelMessages = new Map<string, ClientMessage[]>();

    // This stores the number of new messages waiting to be read on the server
    private channelMessagesOnServer = new Map<string, number>();

    private lastRead = new Map<string, number | null>();
    private channelsBeingViewed = new Set<string>();

    private hasQuit: boolean = false;
    private quitReason: string | undefined;
    private quitCode: number | undefined;
    private sendRegistrationFirst: boolean = false;

    private pingWords: Set<string> = new Set<string>();

    constructor(props: ClientProperties, shouldRegister: boolean) {
        this.props = props;
        this.pingWords.add("@everyone");
        this.serverName = props.address;
        this.sendRegistrationFirst = shouldRegister;
        this.ws = this.connect();
    }

    private send = (data: string) => {
        if (this.isConnected()) {
            this.ws.send(data);
        }
    };

    private connect = () => {
        console.log("Attempting to connect to " + this.props.address);
        let ws = new WebSocket(this.props.address);
        ws.onopen = this.socketOnOpen;
        ws.onclose = this.socketOnClose;
        ws.onmessage = this.socketOnMessage;
        return ws;
    };

    private socketOnOpen = (_: Event) => {
        let packet;
        if (this.sendRegistrationFirst) {
            packet = {
                "cmd": "REGISTER",
                "username": this.props.username,
                "password": this.props.password
            };
        }
        else {
            packet = {
                "cmd": "IDENT",
                "username": this.props.username,
                "password": this.props.password
            };
        }

        this.send(JSON.stringify(packet));
        this.props.onOpen(this.props.address);
    };

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
    };

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
        case "HASVIEWERS":
            this.handleGotViewer(message);
            break;
        case "NOVIEWERS":
            this.handleNoViewers(message);
            break;
        case "ADDATTACHMENT":
            this.handleAddAttachment(message);
            break;
        default:
            console.log("Got message with unknown command: " + evt.data);
            break;
        }
    };

    private handleWelcome = (message: any) => {
        this.serverName = message.name;
        this.sendRegistrationFirst = false;
        this.channels = message.channels.map((chan: any) => appendAddress(chan, this.props.address));
        for (const channel of this.channels) {
            this.channelMessages.set(channel.name, []);
            this.lastRead.set(channel.name, null);
        }

        this.channelsBeingViewed.clear();
        for (const channel of message.viewing) {
            this.channelsBeingViewed.add(channel);
        }

        this.pingWords.add("@" + this.props.username);
        this.getChannelHistory(this.channels.map(c => c.name));
        this.props.onWelcome(this.props.address, this.channels);
    };

    private handleMsg = (message: any) => {
        const msgs = this.channelMessages.get(message.channel);
        const msg: ClientMessage = {
            message_id: message.message_id,
            content: message.content,
            time: message.time,
            user: message.user,
            nickname: message.user.nickname,
            attachments: []
        };
        msg.isPing = this.hasPingWord(msg.content);
        msgs?.push(msg);

        this.updateChannelStatus(message.channel);
        this.props.onMessage(this.props.address, message.channel, msg);
    };

    private handleJoin = (message: any) => {
        const user: User = message.user;
        const channel = this.channels.find(c => c.name === message.channel);
        if (channel)
            channel.users.push(user);
        this.props.onJoin(this.props.address, message.channel, user);
    };

    private handleStatusUpdate = (message: any) => {
        const user: User = message.user;
        for (const c of this.channels) {
            const channelUser = c.users.find(u => u.id === user.id);
            if (channelUser)
                channelUser.status = user.status;
        }
        this.props.onUserStatusUpdate(this.props.address, message.user);
    };

    private handleChannelInfo = (message: any) => {
        const channel = appendAddress(message.channel, this.props.address);
        this.channels.push(channel);
        this.channelMessages.set(channel.name, []);
        this.channelMessagesOnServer.set(channel.name, 0);
        this.props.onReceiveChannelInfo(this.props.address, channel);
    };

    private handleChannelHistory = (data: any) => {
        interface ChannelHistoryEntry {
            last_read_message: number | null;
            messages: ClientMessage[];
            messages_after: number;
        };
        interface ChannelHistory {
            channelName: string,
            entry: ChannelHistoryEntry;
        };

        const messages: ChannelHistory = data.messages;
        for (const [channelName, value] of Object.entries(messages)) {
            const existingMessages = this.channelMessages.get(channelName);
            const entry = value as ChannelHistoryEntry;
            const messageList = entry.messages;
            if (existingMessages) {
                const mergedMessages = messageList.concat(existingMessages).sort((a, b) => a.time - b.time);
                for (const msg of mergedMessages)
                    msg.isPing = this.hasPingWord(msg.content);
                this.channelMessages.set(channelName, mergedMessages);
                this.lastRead.set(channelName, entry.last_read_message);
                this.channelMessagesOnServer.set(channelName, entry.messages_after);
                console.log(`history: ${channelName} last read message was ${entry.last_read_message}`);
                this.updateChannelStatus(channelName);
                //this.props.onMessage(this.props.address, channelName);
            }
        }

        this.gotHistory = true;
        this.props.onReceiveMessageHistory();
    };

    private handleGotViewer = (data: any) => {
        const channel = data.channel;
        console.log("handleGotViewer(): " + channel + " is being viewed");
        this.lastRead.set(channel, null);
        this.channelsBeingViewed.add(channel);
        this.updateChannelStatus(data.channel);
        this.props.onChannelBeingViewed();
    };

    private handleNoViewers = (data: any) => {
        console.log("handleNoViewers(): " + data.channel + " is no longer being viewed");
        this.lastRead.set(data.channel, data.message_id);
        this.channelsBeingViewed.delete(data.channel);
    };

    private handleAddAttachment = (data: any) => {
        const channelMessages = this.channelMessages.get(data.channel);
        const message = channelMessages?.find(m => m.message_id === data.message_id);
        if (message) {
            message.attachments.push({
                url: data.url,
                mime: data.mime
            });
            this.props.onMessage(this.props.address, data.channel);
        }
    };

    private updateChannelStatus = (name: string) => {
        const channel = this.channels.find(c => c.name === name);
        if (channel) {
            if (this.hasUnreadMessages(channel)) {
                if (this.isPinged(channel))
                    channel.status = ChannelNotificationStatus.Pinged;
                else
                    channel.status = ChannelNotificationStatus.UnreadMessages;
            }
            else
                channel.status = ChannelNotificationStatus.None;
        }
    };

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
        return this.channelMessages.get(channel.name) ?? [];
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

    isBeingViewed(channel: Channel) {
        return this.channelsBeingViewed.has(channel.name);
    }

    getUnreadMessagesOnServer(channel: Channel) {
        return this.channelMessagesOnServer.get(channel.name) ?? 0;
    }

    getLastReadMessage(channel: Channel) {
        const messages = this.getMessages(channel);
        const lastRead = this.lastRead.get(channel.name) ?? null;
        let index: number | undefined = undefined;
        if (lastRead)
            index = messages.findIndex(m => m.message_id === lastRead);

        return index;
    }

    getLastReadMessageId(channel: Channel) {
        return this.lastRead.get(channel.name) ?? null;
    }

    hasHistory() {
        return this.gotHistory;
    }

    getLastMessageId(channel: Channel) {
        const messages = this.getMessages(channel);
        if (messages.length > 0) {
            //return messages[messages.length - 1].message_id;
            return Math.max(...messages.map(m => m.message_id));
        }
        else
            return null;
    };

    private hasUnreadMessages = (channel: Channel) => {
        const lastReadMessage = this.lastRead.get(channel.name) ?? null;
        const lastMessageId = this.getLastMessageId(channel);
        const isBeingViewed = this.isBeingViewed(channel);
        console.log(`hasUnreadMessages(): lastReadMessage: ${lastReadMessage}, lastMessageId: ${lastMessageId}, isBeingViewed: ${isBeingViewed}`);

        return !isBeingViewed && lastReadMessage !== lastMessageId;
    };

    private isPinged = (channel: Channel) => {
        const lastReadMessage = this.lastRead.get(channel.name) ?? null;
        const messages = this.getMessages(channel);
        if (!messages || !lastReadMessage)
            return false; // Maybe?

        let startIndex = messages.findIndex(m => m.message_id === lastReadMessage);
        if (startIndex < 0)
            return false;

        startIndex++;
        for (let i = startIndex; i < messages.length; i++) {
            if (messages[i].isPing)
                return true;
        }

        return false;
    };

    private hasPingWord = (message: string) => {
        const content = message.split(" ");
        for (const pingWord of this.pingWords) {
            if (content.includes(pingWord))
                return true;
        }

        return false;
    }

    sendMessage(channel: string, text: string) {
        if (text.length === 0)
            return;

        const packet = {
            "cmd": "MSG",
            "channel": channel,
            "content": text
        };

        this.send(JSON.stringify(packet));
    }

    joinChannel(channel: string) {
        const packet = {
            "cmd": "JOIN",
            "name": channel
        };

        this.send(JSON.stringify(packet));
    }

    getChannelHistory(channels: string[]) {
        const packet = {
            "cmd": "HISTORY",
            "channels": channels
        };

        this.send(JSON.stringify(packet));
    }

    notifyViewingChannel(channel: string) {
        if (this.gotHistory && !this.channelsBeingViewed.has(channel)) {
            const packet = {
                "cmd": "VIEWING",
                "channel": channel,
            };

            this.send(JSON.stringify(packet));
        }
    }

    notifyNotViewingChannels() {
        //console.log("notifynotviewingchannels");
        const packet = {
            "cmd": "NOTVIEWING",
        };

        this.send(JSON.stringify(packet));
    }

    quit() {
        this.hasQuit = true;
        this.ws.close(1000);
    }
}

export default Client;