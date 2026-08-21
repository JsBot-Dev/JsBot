import { isMessageEvent, matchCommand } from '@snowluma/sdk';
import type { EventMiddleware } from '@snowluma/sdk';
import { getAdminCommands } from './decorators';
import { Logger } from './logger';

const adminLogger = new Logger({ module: 'admin', level: 'debug' });

/** 缓存管理员指令,避免每次消息都重新收集并输出日志。 */
let cachedAdminCommands: ReturnType<typeof getAdminCommands> | null = null;

/**
 * 内核内置中间件:命中 @AdminCommand / @SuperAdminCommand 指令的消息事件自动附带
 * `adminLevel` 标记('admin' / 'super')。拦截逻辑由插件侧读取 `event.adminLevel` 自行实现。
 */
export const adminMarkerMiddleware: EventMiddleware = (event, _ctx, next) => {
    if (!isMessageEvent(event)) return next();

    // 首次调用时收集并缓存管理员指令
    if (!cachedAdminCommands) {
        cachedAdminCommands = getAdminCommands();
    }

    const userId = event.user_id;
    const message = event.raw_message;
    const matched = cachedAdminCommands.find(({ spec, options }) =>
        matchCommand(event, spec, options),
    );

    if (matched) {
        event.adminLevel = matched.level;
        adminLogger.info(`权限命中: 用户 ${userId} 执行 ${matched.level} 命令 "${message}"`);
    }
    return next();
};