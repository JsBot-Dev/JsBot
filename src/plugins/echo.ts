import { text } from "@snowluma/sdk";
import { Plugin, Command, AdminCommand } from "../core";
import type { CommandContext, CommandMatch, OneBotMessageEvent } from "../core";

export class EchoPlugin extends Plugin{
    @AdminCommand()
    @Command('test')
    test(
        event:OneBotMessageEvent,
        ctx:CommandContext,
        match:CommandMatch,
    ){
        ctx.reply(match.rest);
    }

    @AdminCommand()
    @Command('test.raw')
    testRaw(
        event:OneBotMessageEvent,
        ctx:CommandContext,
        match:CommandMatch,
    ){
        ctx.reply(text(match.rest));
    }
}