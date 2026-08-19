import { SnowLumaWebSocketClient,text,fromCQString } from "@snowluma/sdk";
import { BotRole,RefuseCommand } from "../utils/tools";

export default class EchoPlugin{
    public register(bot:SnowLumaWebSocketClient){
        bot.command('test.raw',async(event,ctx,match)=>{
            if(BotRole(event.user_id)!='User'){
                await ctx.reply(text(match.rest));
                console.log(`管理员 ${event.user_id} 使用了指令'test.raw'，内容为 ${match.rest}`);
            }else{
                RefuseCommand(ctx,event);
            }
        });
        bot.command('test',async(event,ctx,match)=>{
            if(BotRole(event.user_id)!='User'){
                await ctx.reply(fromCQString(match.rest));
                console.log(`管理员 ${event.user_id} 使用了指令'test'，内容为 ${match.rest}`);
            }else{
                RefuseCommand(ctx,event);
            }
        });
    }
}
