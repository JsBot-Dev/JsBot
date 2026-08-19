import { SnowLumaWebSocketClient,text,fromCQString } from "@snowluma/sdk";
import { BotRole } from "../utils/tools";

const prefix = "Special Echo Command: ";
export default function echoPlugin(bot:SnowLumaWebSocketClient){
    bot.command('test.raw',async(event,ctx,match)=>{
        if(BotRole(event.user_id)!='User'){
            await ctx.reply(text(match.rest));
            console.log(`管理员 ${event.user_id} 使用了指令'test.raw'，内容为 ${match.rest}`);
        }else{
            await ctx.reply(text("权限不足").face(79))
        }
    });
    bot.command('test',async(event,ctx,match)=>{
        if(BotRole(event.user_id)!='User'){
            await ctx.reply(fromCQString(match.rest));
            console.log(`管理员 ${event.user_id} 使用了指令'test'，内容为 ${match.rest}`);
        }else{
            await ctx.reply(text("权限不足").face(79))
        }
    });
}