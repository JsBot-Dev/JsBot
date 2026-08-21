import { Plugin, OnMiddleware } from '../core';
import type { CommandContext,  EventNext, OneBotMessageEvent } from '../core';
import { chain } from '@snowluma/sdk';

export default class CoolDownPlugin extends Plugin{
    @OnMiddleware()
    async cooldown(
        event:OneBotMessageEvent,
        ctx:CommandContext,
        next:EventNext,
    ){
        if(event.onCooldown==true){
            const { admins,superAdmins } = this.bot.config;
            const user = event.user_id;
            if(admins.includes(user)||superAdmins.includes(user)){
                next();
            }else{
                await ctx.reply(
                    chain()
                    .text(`指令冷却中，剩余冷却 ${event.onCooldownRemaining} s`)
                    .reply(event.message_id)
                    .build()
                );
                return;
            }
        }
        next()
    }
}