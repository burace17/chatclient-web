type MessageCallback = (addr: string, e: MessageEvent<any>) => void;

interface ClientProperties {
    readonly address: string;
    readonly username: string;
    readonly password: string;
    readonly onOpen: (addr: string) => void;
    readonly onClose: (addr: string) => void;
    readonly onMessage: MessageCallback;
    readonly onServerNameChanged: () => void;
}
class Client {
    private readonly ws: WebSocket;
    private readonly props: ClientProperties;
    private serverName: string;

    constructor(props: ClientProperties) {
        this.props = props;
        this.serverName = props.address;
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
        if (message.res === 200) {
            this.serverName = message.name;
            this.props.onServerNameChanged();
        }

        this.props.onMessage(this.props.address, evt);
    }

    getProps() {
        return this.props;
    }

    getServerName() {
        return this.serverName;
    }
}

export default Client;