import React from "react";

interface Properties {
    id: number;
    time: number;
    text: string;
    nickname?: string;
}
export default class Message extends React.Component<Properties> {
    render() {
        if (this.props.nickname) {
            return (
                <li>{this.props.nickname}: {this.props.text}</li> 
            );
        }
        else {
            return (
                <li>{this.props.text}</li> 
            );
        }
    }
}