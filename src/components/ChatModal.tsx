import Modal from "react-modal";
import "./ChatModal.css";
import "./util.css";

interface Properties {
    isOpen: boolean;
    title: string;

    showOkButton: boolean;
    okButtonText?: string;
    onOkButtonPressed?: () => void;

    showCancelButton: boolean;
    cancelButtonText?: string;
    onClose?: () => void;

    children: React.ReactNode;
}

export default function ChatModal(props: Properties) {
    return (
        <Modal isOpen={props.isOpen} contentLabel={props.title} onRequestClose={props.onClose}
               className="modal" overlayClassName="content" shouldCloseOnOverlayClick={false}>
            <div className="content-header">
                <h4 className="close-header">{props.title}</h4>
                <button onClick={props.onClose} className="close-button">
                    <svg viewBox="0 0 1 1" height="20" width="20" opacity="0.3" className="close">
                        <line x1="0" y1="1" x2="1" y2="0" stroke="white" strokeWidth="0.1" />
                        <line x1="0" y1="0" x2="1" y2="1" stroke="white" strokeWidth="0.1" />
                    </svg>
                </button>
            </div>
            <hr />
            {props.children}
            {props.showOkButton && 
                <button className="button" onClick={props.onOkButtonPressed}>{props.okButtonText ?? "OK"}</button>}
            {props.showCancelButton &&
                <button className="button" onClick={props.onClose}>{props.cancelButtonText ?? "Cancel"}</button>}
        </Modal>
    );
}