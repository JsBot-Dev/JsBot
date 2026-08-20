import type {
    CommandHandler,
    EventHandler,
    EventMiddleware,
    SnowLumaWebSocketClient,
} from '@snowluma/sdk';
import { getHandlerMeta } from './decorators';
import type { Logger } from './logger';
import type { Plugin } from './plugin';

/**
 * 处理器绑定函数。
 * SDK 处理器签名不统一(command 带 CommandMatch,事件带 context),
 * 这里统一按「任意参数 + 可选 Promise」处理,再在具体分支转类型。
 */
type Handler = (...args: unknown[]) => void | Promise<void>;

/**
 * 插件注册中心。
 *
 * 职责:扫描插件类上的装饰器元数据,把每个被装饰的方法翻译成
 * SDK 客户端的注册调用(command/onMessage/onGroupMessage/...),
 * 并记录对应的注销函数,供插件卸载时移除。
 */
export class PluginRegistry {
    /** 每个插件对应的注销函数集合。 */
    private readonly unsubscribers = new Map<Plugin, Array<() => void>>();

    constructor(
        private readonly client: SnowLumaWebSocketClient,
        private readonly logger: Logger,
    ) {}

    /**
     * 注册一个插件:扫描元数据并挂载到客户端。
     * 重复注册同一插件会先注销旧的,再重新挂载。
     */
    register(plugin: Plugin): void {
        this.unregister(plugin);

        const unsubs: Array<() => void> = [];
        const entries = getHandlerMeta(Object.getPrototypeOf(plugin));

        for (const { key, value, metas } of entries) {
            const handler = (value as Handler).bind(plugin);

            for (const meta of metas) {
                switch (meta.kind) {
                    case 'command':
                        unsubs.push(
                            this.client.command(
                                meta.spec as string | RegExp,
                                handler as CommandHandler,
                                meta.options,
                            ),
                        );
                        break;
                    case 'message':
                        unsubs.push(this.client.onMessage(handler as EventHandler));
                        break;
                    case 'group':
                        unsubs.push(this.client.onGroupMessage(handler as EventHandler));
                        break;
                    case 'private':
                        unsubs.push(this.client.onPrivateMessage(handler as EventHandler));
                        break;
                    case 'notice':
                        unsubs.push(
                            meta.type
                                ? this.client.onNotice(meta.type, handler as EventHandler)
                                : this.client.onNotice(handler as EventHandler),
                        );
                        break;
                    case 'request':
                        unsubs.push(
                            meta.type
                                ? this.client.onRequest(meta.type, handler as EventHandler)
                                : this.client.onRequest(handler as EventHandler),
                        );
                        break;
                    case 'middleware':
                        unsubs.push(this.client.use(handler as EventMiddleware));
                        break;
                }

                this.logger.debug(`${plugin.name} 注册 ${meta.kind} 处理器: ${key}`);
            }
        }

        this.unsubscribers.set(plugin, unsubs);
    }

    /** 注销一个插件:调用所有记录的注销函数,移除其处理器。 */
    unregister(plugin: Plugin): void {
        const unsubs = this.unsubscribers.get(plugin);
        if (!unsubs) return;
        for (const unsub of unsubs) {
            unsub();
        }
        this.unsubscribers.delete(plugin);
        this.logger.debug(`${plugin.name} 已注销`);
    }
}