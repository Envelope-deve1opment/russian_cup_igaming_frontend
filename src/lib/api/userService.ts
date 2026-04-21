import {ServiceBaseWithGetAll} from "$lib/api/JSONServiceBase";

const UsersBaseAPI: string = "/api/technical/users" as const;

export interface UserDTO {
    id: string,
    username: string,
}

class UserService extends ServiceBaseWithGetAll<UserDTO> {
    constructor() {
        super(UsersBaseAPI);
    }
}

export const userService = new UserService();
