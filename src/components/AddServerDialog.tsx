import React from "react";
import ChatModal from "./ChatModal";
import ServerProperties from "./ServerProperties";

interface Properties {
    show: boolean;
    onClose: () => void;
    onCommit: (address: string, username: string, password: string) => void;
}

interface State {
    serverAddress: string;
    username: string;
    password: string;
}

class AddServerDialog extends React.Component<Properties, State> {
    constructor(props: Properties) {
        super(props);
        this.state = {
            serverAddress: "",
            username: "",
            password: ""
        }
    }

    render() {
        const discard = () => this.props.onClose();
        const commit = () => this.props.onCommit(this.state.serverAddress, this.state.username, this.state.password);
        const onServerAddressChanged = (address: string) => this.setState({ serverAddress: address });
        const onUsernameChanged = (username: string) => this.setState({ username });
        const onPasswordChanged = (password: string) => this.setState({ password });

        return (
            <ChatModal isOpen={this.props.show} title="Add Server" showOkButton={true} showCancelButton={true} 
                       okButtonText="Add" onOkButtonPressed={commit} onClose={discard}>
                <ServerProperties onServerAddressChanged={onServerAddressChanged} onUsernameChanged={onUsernameChanged}
                    onPasswordChanged={onPasswordChanged} />
            </ChatModal>
        );
    }
}

export default AddServerDialog;