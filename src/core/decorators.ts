import type { CommandOptions } from '@snowluma/sdk';

/**
 * 处理器种类。
 *
 * - command    : 通过 /ping 这类命令触发(client.command)
 * - message    : 任意消息触发(client.onMessage)
 * - group      : 群聊消息触发(client.onGroupMessage)
 * - private    : 私聊消息触发(client.onPrivateMessage)
 * - notice     : 通知事件触发(client.onNotice)
 * - request    : 请求事件触发(client.onRequest)
 * - middleware : 事件中间件(client.use),可拦截/改写所有事件
 */
export type HandlerKind =
    | 'command'
    | 'message'
    | 'group'
    | 'private'
    | 'notice'
    | 'request'
    | 'middleware';

/** 一条装饰器收集到的处理器元数据。 */
export interface HandlerMeta {
    kind: HandlerKind;
    /** 插件类中的方法名。 */
    propertyKey: string;
    /** command 的命令串或正则。 */
    spec?: string | RegExp;
    /** notice/request 的事件子类型(如 'group_recall')。 */
    type?: string;
    /** command 的 SDK 选项(prefixes/trim/caseSensitive)。 */
    options?: CommandOptions;
}

/**
 * 以「方法函数」为键收集元数据。
 *
 * 运行时(tsx/esbuild)应用的是标准 TC39 装饰器,不提供 prototype,
 * 也不发射 Symbol.metadata,因此无法在装饰器执行时把元数据挂到原型上。
 * 这里用 WeakMap<Function, HandlerMeta[]> 按方法函数本身记录元数据,
 * 注册阶段通过遍历插件原型的方法名反查即可,tsc 与运行时行为一致。
 */
const METHOD_METADATA = new WeakMap<Function, HandlerMeta[]>();

function addMeta(value: Function, meta: HandlerMeta): void {
    const list = METHOD_METADATA.get(value) ?? [];
    list.push(meta);
    METHOD_METADATA.set(value, list);
}

/**
 * 遍历插件原型链,反查出所有被装饰方法及其元数据。
 * 顺序:父类在前、子类在后,确保中间件/命令注册顺序稳定。
 */
export function getHandlerMeta(target: object): Array<{ key: string; value: Function; metas: HandlerMeta[] }> {
    const result: Array<{ key: string; value: Function; metas: HandlerMeta[] }> = [];
    const seen = new Set<Function>();

    let proto: object | null = target;
    const chain: object[] = [];
    while (proto && proto !== Object.prototype) {
        chain.unshift(proto);
        proto = Object.getPrototypeOf(proto);
    }

    for (const node of chain) {
        for (const key of Object.getOwnPropertyNames(node)) {
            if (key === 'constructor') continue;
            const value = (node as Record<string, unknown>)[key] as Function;
            if (typeof value !== 'function') continue;
            if (seen.has(value)) continue;
            seen.add(value);
            const metas = METHOD_METADATA.get(value);
            if (metas) result.push({ key, value, metas });
        }
    }

    return result;
}

/** 注册一个命令处理器,如 `@Command('ping', { prefixes: '/' })`。 */
export function Command(command: string | RegExp, options?: CommandOptions) {
    return (value: Function, context: ClassMethodDecoratorContext): void => {
        addMeta(value, { kind: 'command', propertyKey: String(context.name), spec: command, options });
    };
}

/** 注册一个消息处理器(群聊 + 私聊)。 */
export function OnMessage() {
    return (value: Function, context: ClassMethodDecoratorContext): void => {
        addMeta(value, { kind: 'message', propertyKey: String(context.name) });
    };
}

/** 注册一个群聊消息处理器。 */
export function OnGroupMessage() {
    return (value: Function, context: ClassMethodDecoratorContext): void => {
        addMeta(value, { kind: 'group', propertyKey: String(context.name) });
    };
}

/** 注册一个私聊消息处理器。 */
export function OnPrivateMessage() {
    return (value: Function, context: ClassMethodDecoratorContext): void => {
        addMeta(value, { kind: 'private', propertyKey: String(context.name) });
    };
}

/**
 * 注册一个通知事件处理器。
 * @param type 可选的通知子类型,如 'group_recall'、'friend_recall'。
 */
export function OnNotice(type?: string) {
    return (value: Function, context: ClassMethodDecoratorContext): void => {
        addMeta(value, { kind: 'notice', propertyKey: String(context.name), type });
    };
}

/**
 * 注册一个请求事件处理器。
 * @param type 可选的请求子类型,如 'friend'、'group'。
 */
export function OnRequest(type?: string) {
    return (value: Function, context: ClassMethodDecoratorContext): void => {
        addMeta(value, { kind: 'request', propertyKey: String(context.name), type });
    };
}

/** 注册一个事件中间件,用于拦截/改写所有事件。 */
export function OnMiddleware() {
    return (value: Function, context: ClassMethodDecoratorContext): void => {
        addMeta(value, { kind: 'middleware', propertyKey: String(context.name) });
    };
}