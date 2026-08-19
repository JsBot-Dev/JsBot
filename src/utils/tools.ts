import { fromCQString, OneBotMessageEvent, SnowLumaEventContext, text } from "@snowluma/sdk";

export { BotRole } from "./roles";

export async function RefuseCommand(ctx:SnowLumaEventContext,event:OneBotMessageEvent){
    await ctx.reply(text("权限不足").face(79).reply(event.message_id))
}

export function AtToNumber(arg:string):number|null{
    if (/^\d+$/.test(arg)) return Number(arg);           
    const at = fromCQString(arg).toArray().find(s => s.type === 'at');
    if (at && at.type === 'at' && at.data.qq !== 'all') { 
        return Number(at.data.qq);                        
    }
    return null;
}