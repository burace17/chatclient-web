/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import "./UserList.css";
import "./util.css";
import { User, UserStatus } from "../net/client";

interface Properties {
    isHidden: boolean;
    users: User[];
}

function addUser(user: User) {
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
        <li key={"ul-" + user.id}>
            <span className={className}>{user.nickname}</span>
        </li>
    );
}

function compareUser(a: User, b: User) {
    if (a.status === UserStatus.Online && b.status !== UserStatus.Online)
        return -1;
    else if (a.status !== UserStatus.Online && b.status === UserStatus.Online)
        return 1;
    else
        return a.nickname.localeCompare(b.nickname);
}

function UserList(props: Properties) {
    const name = props.isHidden ? "scrollbar user-list hidden" : "scrollbar user-list";
    return (
        <div className={name}>
            <ul>
                {props.users.sort(compareUser).map(addUser)}
            </ul>
        </div>
    );
}

export default UserList;