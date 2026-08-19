import { SuperAdmin,Admin } from "../config/admim.config";

export function BotRole(user_id:number):string{
    if(SuperAdmin.includes(user_id)) return 'SuperAdmin';
    else if(Admin.includes(user_id)) return 'Admin';
    else return 'User';
}