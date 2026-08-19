import { SnowLumaWebSocketClient, text, isMessageEvent, SnowLumaEventContext, OneBotMessageEvent } from "@snowluma/sdk";
import { Aliases } from "../config/alias.config";
import { isAdmin } from "../utils/roles";
import { RefuseCommand } from "../utils/tools";
import { persistStringMap, configPath } from "../utils/config-persist";

export default class AliasPlugin{
    private aliases = new Map<string, string>(Object.entries(Aliases));

    public register(bot:SnowLumaWebSocketClient):void{
        bot.use(async (event,context,next)=>{
            if(isMessageEvent(event)){
                let trimmed = event.raw_message.trim();
                if(trimmed.startsWith('/')){
                    const words = trimmed.split(/\s+/);
                    let cmd = words[0].slice(1).toLowerCase();
                    const rawCmd = cmd;
                    const sub = words[1]?.toLowerCase();

                    const commandTarget = this.aliases.get(cmd);
                    if(commandTarget){
                        trimmed = trimmed.replace(/^\S+/, '/' + commandTarget);
                        cmd = commandTarget.toLowerCase();
                    }

                    const subTarget = sub
                        ? this.aliases.get(`${cmd}.${sub}`) ?? this.aliases.get(`${rawCmd}.${sub}`)
                        : undefined;
                    if(subTarget){
                        const [tCmd = '', tSub = ''] = subTarget.split('.');
                        trimmed = trimmed.replace(/^\S+\s+\S+/, `/${tCmd}${tSub ? ' ' + tSub : ''}`);
                    }

                    if(trimmed !== event.raw_message){
                        event.raw_message = trimmed;
                    }
                }
            }
            await next();
        });

        bot.command('alias',async(event,ctx,match)=>{
            if(!isAdmin(event.user_id)){
                RefuseCommand(ctx,event);
                return;
            }

            const rawSub = match.args[0];
            if(!rawSub){
                this.usage(ctx,event);
                return;
            }

            const sub = this.normalizeSub(rawSub);
            if(!sub){
                this.usage(ctx,event);
                return;
            }

            if(sub === 'list'){
                this.list(ctx,event);
                return;
            }

            if(sub === 'add'){
                const alias = match.args[1]?.toLowerCase();
                const target = match.args[2]?.toLowerCase();
                if(!alias || !target || !this.isValidPath(alias) || !this.isValidPath(target)){
                    this.usage(ctx,event);
                    return;
                }
                this.aliases.set(alias, target);
                this.persist();
                ctx.reply(text("指令执行成功").reply(event.message_id));
                return;
            }

            if(sub === 'remove'){
                const alias = match.args[1]?.toLowerCase();
                if(!alias || !this.isValidPath(alias)){
                    this.usage(ctx,event);
                    return;
                }
                this.aliases.delete(alias);
                this.persist();
                ctx.reply(text("指令执行成功").reply(event.message_id));
                return;
            }

            this.usage(ctx,event);
        });
    }

    private normalizeSub(arg:string|undefined):string|undefined{
        if(!arg) return undefined;
        switch(arg.toLowerCase()){
            case 'ls':
            case 'list': return 'list';
            case 'a':
            case 'add': return 'add';
            case 'rm':
            case 'del':
            case 'remove': return 'remove';
            default: return undefined;
        }
    }

    private isValidPath(path:string):boolean{
        return /^[a-zA-Z0-9]+(\.[a-zA-Z0-9]+)?$/.test(path)
    }

    private list(ctx:SnowLumaEventContext,event:OneBotMessageEvent){
        const lines = [...this.aliases.entries()].map(([alias,target]) =>
            `/${alias} -> /${target}`
        );
        ctx.reply(text(lines.join("\n")).reply(event.message_id));
    }

    private persist():void{
        persistStringMap(configPath('../config/alias.config.ts'), {
            Aliases:Object.fromEntries(this.aliases),
        });
    }

    private usage(ctx:SnowLumaEventContext,event:OneBotMessageEvent){
        ctx.reply(
            text("参数检定未通过").br().br()
            .text("/alias list").br()
            .text("/alias add <别名> <指令>").br()
            .text("/alias add <别名> <指令.子指令>").br()
            .text("/alias remove <别名>").reply(event.message_id)
        );
    }
}