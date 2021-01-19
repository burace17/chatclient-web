import './ServerTree.css';
import './util.css';
import AddServerDialog from './AddServerDialog';
import React from 'react';
interface Properties {

}

interface State {
    showAddServer: boolean;
}

class ServerTree extends React.Component<Properties, State> {
    constructor(props: Properties) {
        super(props);
        this.state = {
            showAddServer: false
        };

        this.showAddServerDialog = this.showAddServerDialog.bind(this);
        this.addServerDialogClosed = this.addServerDialogClosed.bind(this);
    }

    private showAddServerDialog() {
        this.setState({ showAddServer: true });
    }

    private addServerDialogClosed(commit: boolean) {
        this.setState({ showAddServer: false });
    }

    render() {
        return (
            <div className="server-tree">
                <button onClick={this.showAddServerDialog} className="button">Add a server</button>
                <AddServerDialog show={this.state.showAddServer} onClose={this.addServerDialogClosed} />
            </div>
        );
    }
}

export default ServerTree;