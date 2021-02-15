/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
 
import "./UserList.css";
import "./util.css";
import { User, UserStatus } from "../net/client";

interface Properties {
    isHidden: boolean;
    users: User[]
}

function UserList(props: Properties) {
    const name = props.isHidden ? "scrollbar user-list hidden" : "scrollbar user-list";
    const addUser = (user: User) => {
        let className;
        switch (user.status) {
            case UserStatus.Online:
                className = "online-user";
                break;
            case UserStatus.Away:
                className = "away-user";
                break;
            case UserStatus.Offline:
                className = "offline-user";
                break;
        }

        return (
            <li key={user.id}>
                <span className={className}>{user.nickname}</span>
            </li>
        );
    };

    return (
        <div className={name}>
            <ul>
                {props.users.map(addUser)}
            </ul>
        </div>
    );
}

export default UserList;