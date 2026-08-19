import { isGroupMessageEvent, SnowLumaWebSocketClient, text} from "@snowluma/sdk";
import { EnableGroup, DefaultBanDuration } from "./config/admin.plugin.config";
import { AtToNumber, RefuseCommand } from "../utils/tools";

export default class AdminPlugin{
    public register(
        bot:SnowLumaWebSocketClient
    ):void{
        bot.command('ban',async(event,ctx,match)=>{
            if(!isGroupMessageEvent(event))return;
            if(!this.isEnable(event.group_id))return;

            const groupId = event.group_id;
            const userId = event.user_id;

            if(!await this.isAdmin(groupId,userId,bot)){
                RefuseCommand(ctx,event);
                console.log(`${userId} 权限不足，拒绝执行 /ban`);
                return;
            }


            const args = match.args;
            if(args.length<1){
                ctx.reply(
                    text("参数检定不合法，用法").br().br()
                    .text("/ban <目标用户> <禁言时间>(默认为10分钟)")
                    .reply(event.message_id)
                )
                console.log("参数数量不足")
                return;
            }

            const userNumber = AtToNumber(args[0]);
            if(userNumber == null){
                ctx.reply(
                    text("目标用户不存在").reply(event.message_id)
                )
                console.log("目标用户不存在");
                return;
            }
            
            const duration = Number(args[1]) || DefaultBanDuration;
            if(!Number.isFinite(duration)||duration<0){
                ctx.reply(
                    text("禁言时间不合法").reply(event.message_id)
                )
                console.log("时间不合法")
                return;
            }

            const goalIsAdmin = await this.isAdmin(groupId,userNumber,bot);
            if(goalIsAdmin){
                ctx.reply(
                    text("禁言目标不合法").reply(event.message_id)
                )
                console.log("目标不合法");
                return;
            }
            if(userNumber==event.self_id||userNumber==userId){
                ctx.reply(
                    text("禁言目标不合法").reply(event.message_id)
                )
                console.log("目标不合法");
                return;
            }

            const ban = await bot.rawResponse('set_group_ban',{
                group_id:groupId,
                user_id:userNumber,
                duration:duration
            });

            if(ban.status=='ok'){
                ctx.reply(
                    text("指令执行成功").reply(event.message_id)
                );
            }else{
                ctx.reply(
                    text("指令执行失败，请重试").reply(event.message_id)
                );
            }
        });
        bot.command('unban',async(event,ctx,match)=>{
            if(!isGroupMessageEvent(event))return;
            if(!this.isEnable(event.group_id))return;

            const groupId = event.group_id;
            const userId = event.user_id;

            if(!await this.isAdmin(groupId,userId,bot)){
                RefuseCommand(ctx,event);
                console.log(`${userId} 权限不足，拒绝执行 /unban`);
                return;
            }

            const args = match.args;
            if(args.length<1){
                ctx.reply(
                    text("参数检定不合法，用法").br().br()
                    .text("/unban <目标用户>")
                    .reply(event.message_id)
                )
                console.log("参数数量不足")
                return;
            }

            const userNumber = AtToNumber(args[0]);
            if(userNumber == null){
                ctx.reply(
                    text("目标用户不存在").reply(event.message_id)
                )
                console.log("目标用户不存在");
                return;
            }
            if(userNumber==event.self_id||userNumber==userId){
                ctx.reply(
                    text("解禁目标不合法").reply(event.message_id)
                )
                console.log("目标不合法");
                return;
            }

            const unban = await bot.rawResponse('set_group_ban',{
                group_id:groupId,
                user_id:userNumber,
                duration:0
            });

            if(unban.status=='ok'){
                ctx.reply(
                    text("指令执行成功").reply(event.message_id)
                );
            }else{
                ctx.reply(
                    text("指令执行失败，请重试").reply(event.message_id)
                );
            }
        })
    }

    private isEnable(groupId:number):boolean{
        return EnableGroup.includes(groupId)
    }
    private async isAdmin(groupId:number,userId:number,bot:SnowLumaWebSocketClient){
        const userInfo = await bot.rawResponse('get_group_member_info',{
            group_id:groupId,
            user_id:userId,
        })
        const userRole = userInfo.data.role || 'member'
        return userRole === 'owner' || userRole === 'admin'
    }
}