import {
    isGroupMessageEvent,
    text,
    type SnowLumaWebSocketClient,
} from "@snowluma/sdk";
import { BotRole } from "../utils/tools";

export default function testPlugin(bot: SnowLumaWebSocketClient): void {
    bot.command("info", async (event, ctx) => {
        const lines = [
            "机器人信息",
            `机器人 QQ：${event.self_id}`,
            `消息 ID：${event.message_id}`,
            `消息序列号：${event.message_seq ?? "unknown"}`,
            `事件时间：${new Date(event.time * 1000).toLocaleString("zh-CN")}`,
            `消息类型：${event.message_type}`,
            `消息子类型：${event.sub_type}`,
            "",
            "发送者信息",
            `QQ：${event.user_id}`,
            `昵称：${event.sender.nickname || "unknown"}`,
            `群昵称：${event.sender.card || "unknown"}`,
            `机器人权限：${BotRole(event.user_id)}`,
            `群内身份：${event.sender.role || "unknown"}`,
            `性别：${event.sender.sex || "unknown"}`,
            `年龄：${event.sender.age ?? "unknown"}`,
        ];

        if (isGroupMessageEvent(event)) {
            lines.splice(7, 0, `群号：${event.group_id}`);
        }

        await ctx.reply(text(lines.join("\n")));
    });
}
