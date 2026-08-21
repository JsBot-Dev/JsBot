import { chain, isGroupMessageEvent, text } from "@snowluma/sdk";
import { Plugin, Command, AdminCommand, Cooldown } from "../core";
import type { CommandContext, CommandMatch, OneBotMessageEvent } from "../core";

export class HelpPlugin extends Plugin{
    @Cooldown(20)
    @Command('help')
    async help(
        event:OneBotMessageEvent,
        ctx:CommandContext,
        match:CommandMatch,
    ){
        await ctx.reply(
            chain()
            .text("JsBot Help Command v1.2.0").br().br()
            .text("/help 本帮助指令").br()
            .text("/test <内容> 原样输出（Admin）").br()
            .text("/test.raw <内容> 输出CQ码（Admin）")
            .reply(event.message_id)
            .build()
        );
        if(isGroupMessageEvent(event)){
            this.logger.info(`用户 ${event.user_id} 在群 ${event.group_id} 中使用了指令 /help`);
        }else{
            this.logger.info(`用户 ${event.user_id} 使用了指令 /help`)
        }
        
    }
}