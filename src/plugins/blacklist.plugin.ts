import { SnowLumaWebSocketClient, text, isMessageEvent, isGroupMessageEvent, SnowLumaEventContext, OneBotMessageEvent } from "@snowluma/sdk";
import { BlacklistUsers, BlacklistGroups } from "../config/blacklist.config";
import { AtToNumber, RefuseCommand, BotRole } from "../utils/tools";
import { persistNumberArray, configPath } from "../utils/config-persist";

export default class BlacklistPlugin{
    private users = new Set<number>(BlacklistUsers);
    private groups = new Set<number>(BlacklistGroups);

    public register(bot:SnowLumaWebSocketClient):void{
        bot.use(async (event,context,next)=>{
            if(isMessageEvent(event)){
                const blocked = this.users.has(event.user_id) ||
                    (isGroupMessageEvent(event) && this.groups.has(event.group_id));
                if(blocked){
                    context.stopPropagation();
                    return;
                }
            }
            await next();
        });

        bot.command('blacklist',async(event,ctx,match)=>{
            if(!this.isManager(event.user_id)){
                RefuseCommand(ctx,event);
                return;
            }

            const args = match.args;
            const sub = args[0];

            if(sub === 'list'){
                const users = this.listText(this.users);
                const groups = this.listText(this.groups);
                ctx.reply(
                    text("用户黑名单：" + users).br()
                    .text("群黑名单：" + groups).reply(event.message_id)
                );
                return;
            }

            if(sub !== 'add' && sub !== 'remove'){
                this.usage(ctx,event);
                return;
            }

            const target = args[1];
            const id = AtToNumber(args[2] ?? '');
            if((target !== 'user' && target !== 'group') || id == null){
                this.usage(ctx,event);
                return;
            }

            const set = target === 'user' ? this.users : this.groups;
            if(sub === 'add') set.add(id);
            else set.delete(id);
            this.persist();

            ctx.reply(
                text("指令执行成功").reply(event.message_id)
            );
        });
    }

    private isManager(userId:number):boolean{
        return BotRole(userId) !== 'User'
    }

    private listText(set:Set<number>):string{
        const list = [...set].sort((a,b)=>a-b).join(', ');
        return list || "空"
    }

    private persist():void{
        persistNumberArray(configPath('../config/blacklist.config.ts'), {
            BlacklistUsers:[...this.users].sort((a,b)=>a-b),
            BlacklistGroups:[...this.groups].sort((a,b)=>a-b),
        });
    }

    private usage(ctx:SnowLumaEventContext,event:OneBotMessageEvent){
        ctx.reply(
            text("参数检定不合法，用法").br().br()
            .text("/blacklist add|remove user|group <QQ/群号>").br()
            .text("/blacklist list").reply(event.message_id)
        );
    }
}