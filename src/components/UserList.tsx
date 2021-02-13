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