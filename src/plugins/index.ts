import type { JsBot } from '../core/bot';
import type { Plugin } from '../core/plugin';
import { BotAdminPlugin } from './bot.admin';
import CoolDownPlugin from './cooldown';
import { EchoPlugin } from './echo';
import { HelpPlugin } from './help';
import LikePlugin from './like';

/**
 * 内置插件列表。
 *
 * 业务插件在此登记,即可被 main.ts 自动装载。也可以不依赖此处,
 * 直接在 main.ts 里逐个 bot.use(...) 手动注册。
 */
export const builtinPlugins: Array<new (bot: JsBot) => Plugin> = [
    BotAdminPlugin,
    CoolDownPlugin,
    EchoPlugin,
    HelpPlugin,
    LikePlugin,
];