import { SnowLumaWebSocketClient,text } from "@snowluma/sdk";
import { BotRole } from "../utils/tools";

export default function rolePlugin(bot:SnowLumaWebSocketClient){
    bot.command('role',async(event,ctx,match)=>{
        ctx.reply(text(BotRole(event.user_id)));
    })
}