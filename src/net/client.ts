export interface ClientMessage {
    id: number;
    time: number;
    text: string;
    nickname?: string;
}

export interface ClientProperties {
    address: string;
    username: string;
    password: string;
    onOpen: (addr: string) => void;
    onClose: (addr: string) => void;
    onMessage: (addr: string, channel: string) => void;
    onWelcome: (addr: string, channels: Array<string>) => void;
    onSelfJoin: (addr: string, channel: string) => void;
    onJoin: (addr: string, channel: string, username: string) => void;
}

class Client {
    private ws: WebSocket;
    private readonly props: ClientProperties;
    private serverName: string;
    private channels: Array<string> = [];
    private channelMessages = new Map<string, Array<ClientMessage>>();
    private hasQuit: boolean = false;

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

        // try to reconnect if it didn"t close cleanly.
        if (!e.wasClean) {
            setTimeout(() => {
                if (!this.hasQuit)
                    this.ws = this.connect();
            }, 5000);
        }

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
            default:
                console.log("Got message with unknown command: " + evt.data);
                break;
        }
    }

    private handleWelcome = (message: any) => {
        this.serverName = message.name;
        this.channels = message.channels;
        for (const channel of this.channels) {
            this.channelMessages.set(channel, []);
        }

        this.props.onWelcome(this.props.address, this.channels);
    }

    private handleMsg = (message: any) => {
        let msgs = this.channelMessages.get(message.channel);
        msgs?.push({
            id: message.message_id,
            text: message.content,
            time: message.time,
            nickname: message.user.nickname
        });
        this.props.onMessage(this.props.address, message.channel);
    }

    private handleJoin = (message: any) => {
        const user = message.user;
        if (user.username === this.props.username) {
            this.channels.push(message.channel);
            this.channelMessages.set(message.channel, []);
            this.props.onSelfJoin(this.props.address, message.channel);
        }
        else {
            this.props.onJoin(this.props.address, message.channel, user.username);
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

    quit() {
        this.ws.close(1000);
    }
}

export default Client;