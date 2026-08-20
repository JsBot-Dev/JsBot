import { SnowLumaWebSocketClient } from '@snowluma/sdk';
import { adminMarkerMiddleware } from './admin';
import type { BotConfig } from './config';
import { Logger } from './logger';
import { Plugin } from './plugin';
import { PluginRegistry } from './registry';

/**
 * Bot 容器(组合根)。
 *
 * 持有配置、日志器、SDK 客户端与插件注册中心,负责:
 * 1. 插件装载:use() 注册插件类 → start() 时实例化并挂载处理器;
 * 2. 连接管理:启动时连接 OneBot WebSocket,关闭时断开;
 * 3. 生命周期:start()/stop() 配合信号处理器实现优雅退出。
 *
 * 用法:
 * ```ts
 * const bot = new JsBot(loadConfig());
 * bot.use(PingPlugin);
 * await bot.start();
 * ```
 */
export class JsBot {
    readonly config: BotConfig;
    readonly logger: Logger;
    readonly client: SnowLumaWebSocketClient;

    private readonly registry: PluginRegistry;
    private readonly plugins: Plugin[] = [];
    private readonly clientUnsubscribers: Array<() => void> = [];
    private started = false;

    constructor(config: BotConfig) {
        this.config = config;
        this.logger = new Logger(config.logLevel);
        this.client = new SnowLumaWebSocketClient({
            url: config.baseUrl,
            accessToken: config.accessToken,
            reconnect: config.reconnect,
        });
        this.registry = new PluginRegistry(this.client, this.logger);
        this.client.use(adminMarkerMiddleware);
        this.bindClientEvents();
    }

    /**
     * 注册一个插件类(尚未实例化)。
     * 支持链式调用:`bot.use(A).use(B)`。
     */
    use<T extends Plugin>(ctor: new (bot: JsBot) => T): this {
        this.plugins.push(new ctor(this));
        return this;
    }

    /** 启动:依次装载插件 → 连接客户端。已启动时重复调用无副作用。 */
    async start(): Promise<void> {
        if (this.started) return;

        for (const plugin of this.plugins) {
            await plugin.onLoad?.();
            this.registry.register(plugin);
        }

        await this.client.connect();
        this.started = true;
        this.logger.info(`Bot 已启动 (${this.plugins.length} 个插件)`);
    }

    /** 停止:注销全部插件 → 关闭客户端连接。 */
    async stop(): Promise<void> {
        if (!this.started) return;

        for (const plugin of this.plugins) {
            this.registry.unregister(plugin);
            await plugin.onUnload?.();
        }
        for (const unsub of this.clientUnsubscribers) {
            unsub();
        }

        this.client.close();
        this.started = false;
        this.logger.info('Bot 已停止');
    }

    /** 监听客户端底层事件,统一记录到日志。 */
    private bindClientEvents(): void {
        this.clientUnsubscribers.push(
            this.client.on('open', () => this.logger.info('WebSocket 已连接')),
            this.client.on('close', (info) =>
                this.logger.warn(`WebSocket 已断开: ${info?.code ?? ''} ${info?.reason ?? ''}`.trim()),
            ),
            this.client.on('error', (err) => this.logger.error(`WebSocket 错误: ${String(err)}`)),
        );
    }
}