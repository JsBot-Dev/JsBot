import { isMessageEvent, matchCommand } from '@snowluma/sdk';
import type { EventMiddleware } from '@snowluma/sdk';
import { getAdminCommands } from './decorators';

/**
 * 内核内置中间件:命中 @AdminCommand / @SuperAdminCommand 指令的消息事件自动附带
 * `adminLevel` 标记('admin' / 'super')。拦截逻辑由插件侧读取 `event.adminLevel` 自行实现。
 */
export const adminMarkerMiddleware: EventMiddleware = (event, _ctx, next) => {
    if (!isMessageEvent(event)) return next();

    const matched = getAdminCommands().find(({ spec, options }) =>
        matchCommand(event, spec, options),
    );
    if (matched) {
        event.adminLevel = matched.level;
    }
    return next();
};
