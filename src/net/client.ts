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
    readonly onServerNameChanged: () => void;
}

class Client {
    private readonly ws: WebSocket;
    private readonly props: ClientProperties;
    private serverName: string;
    private channels: Array<string>;
    private channelMessages: Map<string, Array<ClientMessage>>;

    constructor(props: ClientProperties) {
        this.props = props;
        this.serverName = props.address;
        this.channels = [];
        this.channelMessages = new Map<string, Array<ClientMessage>>();
        this.socketOnOpen = this.socketOnOpen.bind(this);
        this.socketOnClose = this.socketOnClose.bind(this);
        this.socketOnMessage = this.socketOnMessage.bind(this);

        this.ws = new WebSocket(props.address);
        this.ws.onopen = this.socketOnOpen;
        this.ws.onclose = this.socketOnClose;
        this.ws.onmessage = this.socketOnMessage;
    }

    private socketOnOpen(_: Event) {
        const ident = {
            "cmd" : "IDENT",
            "username" : this.props.username,
            "password" : this.props.password
        };

        this.ws.send(JSON.stringify(ident));
        this.props.onOpen(this.props.address);
    }

    private socketOnClose(_: Event) {
        // todo: try to reconnect? need to set a flag or something to know if the close was requested
        this.props.onClose(this.props.address);
    }

    private socketOnMessage(evt: MessageEvent<any>) {
        const message = JSON.parse(evt.data);
        if (message.cmd === "WELCOME") {
            this.serverName = message.name;
            this.channels = message.channels;
            for (const channel of this.channels) {
                this.channelMessages.set(channel, []);
            }

            this.props.onServerNameChanged();
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