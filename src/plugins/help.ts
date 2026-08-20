import { chain, text } from "@snowluma/sdk";
import { Plugin, Command, AdminCommand } from "../core";
import type { CommandContext, CommandMatch, OneBotMessageEvent } from "../core";

export class HelpPlugin extends Plugin{
    @Command('help')
    help(
        event:OneBotMessageEvent,
        ctx:CommandContext,
        match:CommandMatch,
    ){
        ctx.reply(
            chain()
            .text("JsBot Help Command v1.2.0").br().br()
            .text("/help 本帮助指令").br()
            .text("/test <内容> 原样输出（Admin）").br()
            .text("/test.raw <内容> 输出CQ码（Admin）")
            .reply(event.message_id)
            .build()
        )
    }
}