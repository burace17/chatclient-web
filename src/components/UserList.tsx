/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
 
import "./UserList.css";
import "./util.css";
interface Properties {
    isHidden: boolean;
}

function UserList(props: Properties) {
    const name = props.isHidden ? "user-list hidden" : "user-list"
    return (
        <div className={name}>User List</div>
    );
}

export default UserList;