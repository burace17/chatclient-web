import React from 'react';

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
                <li key={this.props.id}>{this.props.nickname}: {this.props.text}</li> 
            );
        }
        else {
            return (
                <li key={this.props.id}>{this.props.text}</li> 
            );
        }
    }
}