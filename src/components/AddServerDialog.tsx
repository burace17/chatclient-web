import './util.css';
import './AddServerDialog.css';
import Modal from 'react-modal';
import React from 'react';

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

        this.onServerAddressChanged = this.onServerAddressChanged.bind(this);
        this.onUsernameChanged = this.onUsernameChanged.bind(this);
        this.onPasswordChanged = this.onPasswordChanged.bind(this);
    }

    private onServerAddressChanged(e: React.ChangeEvent<HTMLInputElement>) {
        this.setState({ serverAddress: e.target.value });
    }

    private onUsernameChanged(e: React.ChangeEvent<HTMLInputElement>) {
        this.setState({ username: e.target.value });
    }

    private onPasswordChanged(e: React.ChangeEvent<HTMLInputElement>) {
        this.setState({ password: e.target.value });
    }

    render() {
        const discard = () => this.props.onClose();
        const commit = () => this.props.onCommit(this.state.serverAddress, this.state.username, this.state.password);

        return (
            <Modal isOpen={this.props.show} contentLabel="Add Server" onRequestClose={discard}
                    className="modal" overlayClassName="content" shouldCloseOnOverlayClick={false}>
                <div className="content-header">
                    <h4 className="close-header">Add a server</h4>
                    <a onClick={discard}>
                        <svg viewBox="0 0 1 1" height="20" width="20" opacity="0.3" className="close">
                            <line x1="0" y1="1" x2="1" y2="0" stroke="white" stroke-width="0.1" />
                            <line x1="0" y1="0" x2="1" y2="1" stroke="white" stroke-width="0.1" />
                        </svg>
                    </a>
                </div>
                <hr />
                <form>
                    <ul className="server-form">
                        <li className="server-form-row">
                            <input type="text" className="textbox" placeholder="Server Address..." autoFocus 
                                   onChange={this.onServerAddressChanged} />
                        </li>
                        <li className="server-form-row">
                            <input type="text" className="textbox" placeholder="Username..." 
                                   onChange={this.onUsernameChanged} />
                        </li>
                        <li className="server-form-row">
                            <input type="password" className="textbox" placeholder="Password..." 
                                   onChange={this.onPasswordChanged} />
                        </li>
                    </ul>
                    <button className="button" onClick={commit}>Add</button>
                    <button className="button" onClick={discard}>Cancel</button>
                </form>
            </Modal>
        );
    }
}

export default AddServerDialog;