import { Plugin, OnMiddleware } from '../core';
import type { CommandContext, EventNext, OneBotMessageEvent } from '../core';
import { text } from '@snowluma/sdk';

export class BotAdminPlugin extends Plugin{
    @OnMiddleware() async BotAdmin(
        event:OneBotMessageEvent,
        ctx:CommandContext,
        next:EventNext
    ){
        const { superAdmins, admins } = this.bot.config;
        const user = event.user_id;
        if(
            event.adminLevel=='super' && 
            !superAdmins.includes(user)
        ){
            await this.RufuseCommand(ctx,event);
            return;
        }
        if(
            event.adminLevel=='admin' && 
            (
                !admins.includes(user) &&
                !superAdmins.includes(user)
            )
        ){
            await this.RufuseCommand(ctx,event);
            return;
        }
        await next()
    }
    private async RufuseCommand(ctx:CommandContext,event:OneBotMessageEvent){
        await ctx.reply(
            text("权限不足")
            .face(79)
            .reply(event.message_id)
        )
    }
}