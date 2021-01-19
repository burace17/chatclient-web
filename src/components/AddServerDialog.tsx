import './util.css';
import './AddServerDialog.css';
import Modal from 'react-modal';

interface Properties {
    show: boolean;
    onClose: (commit: boolean) => void;
}

function AddServerDialog(props: Properties) {
    const discard = () => props.onClose(false);
    const commit = () => props.onClose(true);

    return (
        <Modal isOpen={props.show} contentLabel="Add Server" onRequestClose={discard}
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
                        <input type="text" className="textbox" placeholder="Server Address..." autoFocus />
                    </li>
                    <li className="server-form-row">
                        <input type="text" className="textbox" placeholder="Username..." />
                    </li>
                    <li className="server-form-row">
                        <input type="password" className="textbox" placeholder="Password..." />
                    </li>
                </ul>
                <button className="button" onClick={commit}>Add</button>
                <button className="button" onClick={discard}>Cancel</button>
            </form>
        </Modal>
    );
}

export default AddServerDialog;