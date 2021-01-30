export interface ClientMessage {
    id: number;
    time: number;
    text: string;
    nickname?: string;
}

interface ClientProperties {
    readonly address: string;
    readonly username: string;
    readonly password: string;
    readonly onOpen: (addr: string) => void;
    readonly onClose: (addr: string) => void;
    readonly onMessage: (addr: string, channel: string) => void;
    readonly onWelcome: (addr: string, channels: Array<string>) => void;
}

class Client {
    private ws: WebSocket;
    private readonly props: ClientProperties;
    private serverName: string;
    private channels: Array<string>;
    private channelMessages: Map<string, Array<ClientMessage>>;

    constructor(props: ClientProperties) {
        this.props = props;
        this.serverName = props.address;
        this.channels = [];
        this.channelMessages = new Map<string, Array<ClientMessage>>();
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
            "cmd" : "IDENT",
            "username" : this.props.username,
            "password" : this.props.password
        };

        this.ws.send(JSON.stringify(ident));
        this.props.onOpen(this.props.address);
    }

    private socketOnClose = (e: CloseEvent) => {
        console.log("websocket closed - clean: " + e.wasClean + ", code: " + e.code + ", reason: " + e.reason);

        // try to reconnect if it didn't close cleanly.
        if (!e.wasClean) {
            setTimeout(() => this.ws = this.connect(), 5000);
        }

        this.props.onClose(this.props.address);
    }

    private socketOnMessage = (evt: MessageEvent<any>) => {
        const message = JSON.parse(evt.data);
        if (message.cmd === "WELCOME") {
            this.serverName = message.name;
            this.channels = message.channels;
            for (const channel of this.channels) {
                this.channelMessages.set(channel, []);
            }

            this.props.onWelcome(this.props.address, this.channels);
        }
        else if (message.cmd === "MSG") {
            let msgs = this.channelMessages.get(message.channel);
            msgs?.push({
                id: message.message_id,
                text: message.content,
                time: message.time,
                nickname: message.user.nickname
            });
            this.props.onMessage(this.props.address, message.channel);
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

    getMessages(channel: string) {
        return this.channelMessages.get(channel);
    }

    isConnected() {
        return this.ws.readyState === 1;
    }

    sendMessage(channel: string, text: string) {
        const packet = {
            "cmd" : "MSG",
            "channel" : channel,
            "content" : text
        };

        this.ws.send(JSON.stringify(packet));
    }

    joinChannel(channel: string) {
        const packet = {
            "cmd" : "JOIN",
            "name" : channel
        };

        this.ws.send(JSON.stringify(packet));
    }
}

export default Client;