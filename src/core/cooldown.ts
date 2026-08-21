import type { CommandOptions, EventMiddleware, SnowLumaEvent } from '@snowluma/sdk';
import { isMessageEvent, isGroupMessageEvent, matchCommand } from '@snowluma/sdk';
import { Logger } from './logger';
import { ALL_COMMANDS, getCooldownMethods } from './decorators';

const cooldownLogger = new Logger({ module: 'cooldown', level: 'debug' });

/** 冷却作用域 */
export type CooldownScope = 'user' | 'group';

/** 冷却命令元数据（导出类型） */
export interface CooldownMeta {
    spec: string | RegExp;
    options?: CommandOptions;
    seconds: number;
    scope: CooldownScope;
    message: string;
    commandName: string;
}

/** 冷却存储：key -> 过期时间戳 */
const cooldownMap = new Map<string, number>();

/** 内存缓存：getCooldownCommands 结果 */
let cachedCooldownCommands: CooldownMeta[] | null = null;

/** 定时清理过期冷却记录 */
setInterval(() => {
    const now = Date.now();
    for (const [key, expires] of cooldownMap.entries()) {
        if (expires <= now) cooldownMap.delete(key);
    }
}, 60_000);

/**
 * 生成冷却键
 * 私聊: user:{userId}:{commandName}
 * 群聊: group:{groupId}:{commandName}
 */
function makeKey(scope: CooldownScope, id: number, commandName: string): string {
    return `${scope}:${id}:${commandName}`;
}

/**
 * 指令冷却装饰器（元数据收集模式，参考 @AdminCommand）
 * @param seconds 冷却秒数
 * @param options 可选配置
 *   - scope: 'user' | 'group' - 强制指定作用域（默认：私聊=user，群聊=group）
 *   - message: 冷却提示模板（支持 {remaining} 占位符）
 */
export function Cooldown(
    seconds: number,
    options?: { scope?: CooldownScope; message?: string }
) {
    const { scope, message = '命令冷却中，{remaining}s 后可再次使用' } = options ?? {};

    return (value: Function, context: ClassMethodDecoratorContext): void => {
        const commandName = String(context.name);

        // 标记该方法有冷却配置，供 getCooldownCommands 关联 ALL_COMMANDS
        getCooldownMethods().set(value, { seconds, scope, message });

        cooldownLogger.debug(`冷却命令标记: ${commandName} ${seconds}s scope=${scope ?? 'auto'}`);
    };
}

/** 收集所有带 @Cooldown 标记的命令元数据，供中间件匹配 */
export function getCooldownCommands(): CooldownMeta[] {
    if (cachedCooldownCommands) return cachedCooldownCommands;

    const cooldownMethods = getCooldownMethods();
    const result: CooldownMeta[] = [];

    // 从 ALL_COMMANDS 找出被 @Cooldown 标记的命令，使用真实的 spec
    for (const { fn, spec, options } of ALL_COMMANDS) {
        const cooldownConfig = cooldownMethods.get(fn);
        if (!cooldownConfig) continue;

        const { seconds, scope, message = '命令冷却中，{remaining}s 后可再次使用' } = cooldownConfig;
        const commandName = typeof spec === 'string' ? spec : spec.source; // 使用实际命令名作为键名

        if (scope === 'user' || scope === 'group') {
            // 强制指定作用域
            result.push({ spec, options, seconds, scope, message, commandName });
        } else {
            // auto: 双维度
            result.push(
                { spec, options, seconds, scope: 'user', message, commandName },
                { spec, options, seconds, scope: 'group', message, commandName }
            );
        }
    }

    cachedCooldownCommands = result;
    cooldownLogger.debug(`冷却命令收集完成: ${result.length} 条规则`);
    return result;
}

/**
 * 冷却中间件：匹配命令、检查/设置冷却、注入 event.onCooldown 等字段
 * 用法：bot.client.use(cooldownMiddleware) 或在插件中 this.bot.client.use(cooldownMiddleware)
 */
export const cooldownMiddleware: EventMiddleware = (event, _ctx, next) => {
    if (!isMessageEvent(event)) return next();

    const commands = getCooldownCommands();
    if (commands.length === 0) return next();

    const isGroup = isGroupMessageEvent(event);
    const scope: CooldownScope = isGroup ? 'group' : 'user';
    const id = isGroup ? event.group_id : event.user_id;

    for (const cmd of commands) {
        if (cmd.scope !== scope) continue;

        if (matchCommand(event, cmd.spec, cmd.options)) {
            const key = makeKey(scope, id, cmd.commandName);
            const now = Date.now();
            const expires = cooldownMap.get(key) ?? 0;

            if (expires > now) {
                const remaining = Math.ceil((expires - now) / 1000);
                (event as any).onCooldown = true;
                (event as any).onCooldownRemaining = remaining;
                (event as any).onCooldownMessage = cmd.message.replace('{remaining}', String(remaining));
                (event as any).onCooldownScope = scope;
                cooldownLogger.debug(`冷却命中: ${key} 剩余 ${remaining}s`);
            } else {
                cooldownMap.set(key, now + cmd.seconds * 1000);
                cooldownLogger.debug(`设置冷却: ${key} ${cmd.seconds}s`);
            }
            break;
        }
    }

    return next();
};

/** 手动清除冷却（供管理员命令） */
export function clearCooldown(scope: CooldownScope, id: number, commandName: string): boolean {
    return cooldownMap.delete(makeKey(scope, id, commandName));
}

/** 获取剩余冷却秒数 */
export function getCooldownRemaining(scope: CooldownScope, id: number, commandName: string): number {
    const expires = cooldownMap.get(makeKey(scope, id, commandName)) ?? 0;
    const remaining = Math.ceil((expires - Date.now()) / 1000);
    return remaining > 0 ? remaining : 0;
}

/** 清除缓存（热重载插件时调用） */
export function invalidateCooldownCache(): void {
    cachedCooldownCommands = null;
}