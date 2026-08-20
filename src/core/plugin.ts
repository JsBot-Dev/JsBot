import type { JsBot } from './bot';

/**
 * 插件基类。
 *
 * 所有功能模块继承本类,通过装饰器声明命令/事件处理器:
 *
 * ```ts
 * export class PingPlugin extends Plugin {
 *     @Command('ping')
 *     ping(ctx: SnowLumaEventContext) {
 *         ctx.reply('pong');
 *     }
 * }
 * ```
 *
 * 生命周期:
 * - onLoad  : 注册到客户端之前调用,可做初始化(如加载数据)。
 * - onUnload: 注销后调用,可做清理(如释放资源)。
 */
export abstract class Plugin {
    /** 插件名,默认取类名。 */
    readonly name: string;

    constructor(protected readonly bot: JsBot) {
        this.name = this.constructor.name;
    }

    onLoad?(): void | Promise<void>;
    onUnload?(): void | Promise<void>;
}