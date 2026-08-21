import { text } from "@snowluma/sdk";
import { Plugin, Command, AdminCommand } from "../core";
import type { CommandContext, CommandMatch, OneBotMessageEvent } from "../core";

export class EchoPlugin extends Plugin{
    @AdminCommand()
    @Command('test')
    async test(
        event:OneBotMessageEvent,
        ctx:CommandContext,
        match:CommandMatch,
    ){
        await ctx.reply(match.rest);
    }

    @AdminCommand()
    @Command('test.raw')
    async testRaw(
        event:OneBotMessageEvent,
        ctx:CommandContext,
        match:CommandMatch,
    ){
        await ctx.reply(text(match.rest));
    }
}