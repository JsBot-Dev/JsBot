import { SuperAdmin, Admin } from "../config/admim.config";

export const superAdmins = new Set<number>(SuperAdmin);
export const admins = new Set<number>(Admin);

export function BotRole(user_id:number):string{
    if(superAdmins.has(user_id)) return 'SuperAdmin';
    else if(admins.has(user_id)) return 'Admin';
    else return 'User';
}

export function isSuperAdmin(user_id:number):boolean{
    return superAdmins.has(user_id)
}

export function isAdmin(user_id:number):boolean{
    return superAdmins.has(user_id) || admins.has(user_id)
}

export function addSuperAdmin(user_id:number){
    superAdmins.add(user_id);
}

export function addAdmin(user_id:number){
    admins.add(user_id);
}

export function removeAdmin(user_id:number){
    superAdmins.delete(user_id);
    admins.delete(user_id);
}