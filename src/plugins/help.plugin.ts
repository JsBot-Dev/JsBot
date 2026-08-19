import { SnowLumaWebSocketClient, text } from "@snowluma/sdk";
import { isAdmin } from "../utils/roles";

export default class HelpPlugin{
    public register(bot:SnowLumaWebSocketClient):void{
        bot.command('help',async(event,ctx)=>{
            const lines = [
                "帮助菜单",
                "/help - 查看帮助",
                "/info - 机器人信息",
                "/role - 查看你的权限",
                "/test <内容> - 复读内容",
                "/test.raw <内容> - 原文复读",
                "/cave - Cave测试指令",
            ];
            if(isAdmin(event.user_id)){
                lines.push(
                    "/ban <目标> <时长> - 禁言群成员",
                    "/unban <目标> - 解除禁言",
                    "/blacklist - 管理用户/群黑名单",
                    "/admin - 管理机器人管理员",
                    "/alias - 管理指令别名",
                );
            }
            ctx.reply(
                text(lines.join("\n")).reply(event.message_id)
            );
        });
    }
}