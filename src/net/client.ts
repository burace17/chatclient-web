class Client {
    private ws: WebSocket;
    private username: string;
    private password: string;

    constructor(url: string, username: string, password: string) {
        this.ws = new WebSocket(url);
        this.ws.onopen = _ => this.socket_on_open();
        this.ws.onclose = _ => this.socket_on_close();
        this.username = username;
        this.password = password;
    }

    private socket_on_open() {
        const ident = {
            "cmd" : "IDENT",
            "username" : this.username,
            "password" : this.password
        };

        this.ws.send(JSON.stringify(ident));
    }

    private socket_on_close() {

    }
}

export default Client;