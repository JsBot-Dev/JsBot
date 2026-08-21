import { chain, isGroupMessageEvent } from "@snowluma/sdk";
import { Plugin, Command, AdminCommand } from "../core";
import type { CommandContext, CommandMatch, OneBotMessageEvent } from "../core";

const DisenableGroup=[
    1017248143,
]

export default class LikePlugin extends Plugin{
    @Command('赞我')@Command('like')
    async like(
        event:OneBotMessageEvent,
        ctx:CommandContext,
    ){
        const user = event.user_id;

        if(isGroupMessageEvent(event)){
            const group = event.group_id;
            if(DisenableGroup.includes(group))return;
        }

        const res = await this.bot.client.rawResponse('send_like',{
            user_id:user,
            times:10,
        });
        if(res.status=='ok'){
            await ctx.reply(
                chain()
                .text("给你点了 10 个赞")
                .reply(event.message_id)
                .build()
            )
        }else{
            await ctx.reply(
                chain()
                .text("点赞失败，可能是到上限了")
                .reply(event.message_id)
                .build()
            )
        }
    }
}