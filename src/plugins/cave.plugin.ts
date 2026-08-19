import { SnowLumaWebSocketClient,text } from "@snowluma/sdk";

export default class CavePlugin{
    public register(bot:SnowLumaWebSocketClient){
        bot.command('cave',async(event,ctx,match)=>{
            ctx.reply(
                text("参数检定已通过：").br().br()
                .text("但是 Jelsedelvance 还没写")
            );
        })
    }
}