/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
 
import Modal from "react-modal";
import "./ModalDialog.css";
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

export default function ModalDialog(props: Properties) {
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
            <form onSubmit={e => e.preventDefault()}>
                {props.children}
                {props.showOkButton && 
                    <button type="submit" className="button" onClick={props.onOkButtonPressed}>{props.okButtonText ?? "OK"}</button>}
                {props.showCancelButton &&
                    <button type="button" className="button" onClick={props.onClose}>{props.cancelButtonText ?? "Cancel"}</button>}
            </form>
        </Modal>
    );
}