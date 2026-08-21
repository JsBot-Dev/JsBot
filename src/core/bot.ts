import { SnowLumaWebSocketClient } from '@snowluma/sdk';
import { adminMarkerMiddleware } from './admin';
import { cooldownMiddleware } from './cooldown';
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
        this.logger = new Logger({ level: config.logLevel, module: 'bot' });
        this.client = new SnowLumaWebSocketClient({
            url: config.baseUrl,
            accessToken: config.accessToken,
            reconnect: config.reconnect,
        });
        this.registry = new PluginRegistry(this.client, this.logger.child({ module: 'registry' }));
        this.client.use(adminMarkerMiddleware);
        this.client.use(cooldownMiddleware);
        this.bindClientEvents();
    }

    /**
     * 注册一个插件类(尚未实例化)。
     * 支持链式调用:`bot.use(A).use(B)`。
     */
    use<T extends Plugin>(ctor: new (bot: JsBot) => T): this {
        const startTime = Date.now();
        const plugin = new ctor(this);
        this.plugins.push(plugin);
        this.logger.debug(`插件实例化: ${plugin.name} (耗时 ${Date.now() - startTime}ms)`);
        return this;
    }

    /** 启动:依次装载插件 → 连接客户端。已启动时重复调用无副作用。 */
    async start(): Promise<void> {
        if (this.started) return;

        const startTime = Date.now();
        this.logger.info(`正在加载 ${this.plugins.length} 个插件...`);

        for (const plugin of this.plugins) {
            const pluginStart = Date.now();
            this.logger.debug(`插件加载开始: ${plugin.name}`);
            await plugin.onLoad?.();
            this.registry.register(plugin);
            this.logger.debug(`插件加载完成: ${plugin.name} (耗时 ${Date.now() - pluginStart}ms)`);
        }

        this.logger.info(`所有插件加载完成 (耗时 ${Date.now() - startTime}ms)`);

        this.logger.debug(`连接中 ${this.config.baseUrl}...`);
        await this.client.connect();
        this.started = true;
        this.logger.info(`Bot 已启动 (${this.plugins.length} 个插件, 总耗时 ${Date.now() - startTime}ms)`);
    }

    /** 停止:注销全部插件 → 关闭客户端连接。 */
    async stop(): Promise<void> {
        if (!this.started) return;

        const startTime = Date.now();
        this.logger.info('正在停止 Bot...');

        for (const plugin of this.plugins) {
            const pluginStart = Date.now();
            this.logger.debug(`插件卸载开始: ${plugin.name}`);
            this.registry.unregister(plugin);
            await plugin.onUnload?.();
            this.logger.debug(`插件卸载完成: ${plugin.name} (耗时 ${Date.now() - pluginStart}ms)`);
        }

        for (const unsub of this.clientUnsubscribers) {
            unsub();
        }

        this.client.close();
        this.started = false;
        this.logger.info(`Bot 已停止 (耗时 ${Date.now() - startTime}ms)`);
    }

    /** 监听客户端底层事件,统一记录到日志。 */
    private bindClientEvents(): void {
        const wsLogger = this.logger.child({ module: 'ws' });

        this.clientUnsubscribers.push(
            this.client.on('open', () => wsLogger.info('WebSocket 已连接')),
            this.client.on('close', (info) =>
                wsLogger.warn(`WebSocket 已断开: ${info?.code ?? ''} ${info?.reason ?? ''}`.trim()),
            ),
            this.client.on('error', (err) => wsLogger.error(`WebSocket 错误: ${String(err)}`)),
        );
    }
}