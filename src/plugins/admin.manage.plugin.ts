import { SnowLumaWebSocketClient, text, SnowLumaEventContext, OneBotMessageEvent } from "@snowluma/sdk";
import { AtToNumber, RefuseCommand } from "../utils/tools";
import { isSuperAdmin, isAdmin, addSuperAdmin, addAdmin, removeAdmin, superAdmins, admins } from "../utils/roles";
import { persistNumberArray, configPath } from "../utils/config-persist";

export default class AdminManagePlugin{
    public register(bot:SnowLumaWebSocketClient):void{
        bot.command('admin',async(event,ctx,match)=>{
            const userId = event.user_id;
            if(!isAdmin(userId)){
                RefuseCommand(ctx,event);
                return;
            }

            const args = match.args;
            const sub = args[0];

            if(sub === 'list'){
                ctx.reply(
                    text("SuperAdmin：" + this.listText(superAdmins)).br()
                    .text("Admin：" + this.listText(admins)).reply(event.message_id)
                );
                return;
            }

            const target = args[1];
            const id = AtToNumber(args[2] ?? '');
            if((target !== 'super' && target !== 'admin') || id == null){
                this.usage(ctx,event);
                return;
            }

            if(sub === 'add'){
                if(target === 'super'){
                    if(!isSuperAdmin(userId)){
                        RefuseCommand(ctx,event);
                        return;
                    }
                    addSuperAdmin(id);
                }else{
                    addAdmin(id);
                }
            }else if(sub === 'remove'){
                if(!isSuperAdmin(userId)){
                    RefuseCommand(ctx,event);
                    return;
                }
                removeAdmin(id);
            }else{
                this.usage(ctx,event);
                return;
            }
            this.persist();

            ctx.reply(
                text("指令执行成功").reply(event.message_id)
            );
        });
    }

    private listText(set:Set<number>):string{
        const list = [...set].sort((a,b)=>a-b).join(', ');
        return list || "空"
    }

    private persist():void{
        persistNumberArray(configPath('../config/admim.config.ts'), {
            SuperAdmin:[...superAdmins].sort((a,b)=>a-b),
            Admin:[...admins].sort((a,b)=>a-b),
        });
    }

    private usage(ctx:SnowLumaEventContext,event:OneBotMessageEvent){
        ctx.reply(
            text("参数检定未通过").br().br()
            .text("/admin add admin <QQ>").br()
            .text("/admin add super <QQ>").br()
            .text("/admin remove <QQ>").br()
            .text("/admin list").reply(event.message_id)
        );
    }
}