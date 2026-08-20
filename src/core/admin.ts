import { isMessageEvent, matchCommand } from '@snowluma/sdk';
import type { EventMiddleware } from '@snowluma/sdk';
import { getAdminCommands } from './decorators';

/**
 * 内核内置中间件:命中 @AdminCommand 指令的消息事件自动附带 `isAdmin: true` 标记。
 * 拦截逻辑由插件侧读取 `event.isAdmin` 自行实现。
 */
export const adminMarkerMiddleware: EventMiddleware = (event, _ctx, next) => {
    if (!isMessageEvent(event)) return next();

    const isAdminCmd = getAdminCommands().some(({ spec, options }) =>
        matchCommand(event, spec, options),
    );
    if (isAdminCmd) {
        event.isAdmin = true;
    }
    return next();
};
