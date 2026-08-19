import { SuperAdmin,Admin } from "../config/admim.config";
import { OneBotMessageEvent, reply, SnowLumaEventContext,text } from "@snowluma/sdk";

export function BotRole(user_id:number):string{
    if(SuperAdmin.includes(user_id)) return 'SuperAdmin';
    else if(Admin.includes(user_id)) return 'Admin';
    else return 'User';
}

export async function RefuseCommand(ctx:SnowLumaEventContext,event:OneBotMessageEvent){
    await ctx.reply(text("权限不足").face(79).reply(event.message_id))
}