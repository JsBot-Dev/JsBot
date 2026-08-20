export { JsBot } from './bot';
export type { BotConfig } from './config';
export { loadConfig } from './config';
export { Logger } from './logger';
export type { LogLevel } from './logger';
export {
    Command,
    OnGroupMessage,
    OnMessage,
    OnMiddleware,
    OnNotice,
    OnPrivateMessage,
    OnRequest,
} from './decorators';
export type { HandlerKind, HandlerMeta } from './decorators';
export { Plugin } from './plugin';
export { PluginRegistry } from './registry';

export type {
    CommandMatch,
    EventNext,
    OneBotGroupMessageEvent,
    OneBotMessageEvent,
    OneBotNoticeEvent,
    OneBotPrivateMessageEvent,
    OneBotRequestEvent,
    SnowLumaEvent,
    SnowLumaEventContext,
} from '@snowluma/sdk';

import type { CommandMatch, SnowLumaEventContext } from '@snowluma/sdk';

/** @Command 处理器的上下文类型(上下文 + 命令匹配信息)。 */
export type CommandContext = SnowLumaEventContext & { command: CommandMatch };
