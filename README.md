# JsBot

基于 [`@snowluma/sdk`](https://www.npmjs.com/package/@snowluma/sdk) 的 OneBot 11 兼容 QQ 机器人框架。

采用 TypeScript + 类装饰器驱动插件系统:核心框架层只负责装载插件、事件分发与生命周期管理,业务功能以插件形式独立编写、即插即用。

## 特性

- **装饰器插件系统** — 用 `@Command` / `@OnGroupMessage` 等装饰器声明处理器,一行挂载
- **管理员指令标记** — `@AdminCommand()` / `@SuperAdminCommand()` 配合 `@Command` 声明,内核自动为命中指令附带 `event.adminLevel`,方便中间件鉴权
- **即插即用** — 插件实现 `onLoad` / `onUnload` 生命周期钩子,支持热注销
- **类型安全** — 全量暴露 SDK 的 OneBot 动作 API 与事件类型,`tsc` 严格模式通过
- **多级配置** — 默认值 → `bot.config.json` → 环境变量,自动合并与校验
- **优雅退出** — 监听 SIGINT/SIGTERM,先注销插件再断开连接
- **自动重连** — 断线重连由 SDK 内置,开箱即用

## 快速开始

```bash
npm install
cp .env.example .env   # 填入 BaseUrl 与 AccessToken
npm run dev            # tsx watch 热重载
```

最小 `.env`:

```env
BaseUrl=ws://127.0.0.1:3001/
AccessToken=your-token
```

## 配置

配置优先级(低 → 高):**默认值 → `bot.config.json` → 环境变量**。

| 配置项        | 环境变量        | 说明                                          |
| ------------- | --------------- | --------------------------------------------- |
| `baseUrl`     | `BaseUrl`       | OneBot WebSocket 端点                         |
| `accessToken` | `AccessToken`   | 访问令牌                                      |
| `reconnect`   | —               | 断线重连策略(`true` / `false` / 配置对象)      |
| `logLevel`    | `LogLevel`      | `debug` / `info` / `warn` / `error`,默认 `info` |
| `admins`      | `Admins`        | 管理员 QQ 名单,逗号分隔                       |
| `superAdmins` | `SuperAdmins`   | 超级管理员 QQ 名单,逗号分隔(隐含管理员权限)   |
| `plugins`     | —               | 启用的插件列表(预留)                           |

参考 [`bot.config.example.json`](./bot.config.example.json)。

## 目录结构

```
src/
  main.ts              # 入口:组装配置、装载插件、启动
  core/
    bot.ts             # JsBot 容器:use() / start() / stop()
    config.ts          # 配置加载与校验
    logger.ts          # 分级日志器
    decorators.ts      # @Command 等处理器装饰器
    plugin.ts          # Plugin 基类与生命周期
    registry.ts        # 装饰器元数据 → SDK 注册中心
  plugins/             # 业务插件(在 index.ts 登记)
```

## 编写插件

```ts
import { Plugin, Command, OnGroupMessage } from '../core';
import type { CommandContext, OneBotGroupMessageEvent, OneBotMessageEvent, SnowLumaEventContext } from '../core';

export class PingPlugin extends Plugin {
    @Command('ping')
    ping(event: OneBotMessageEvent, ctx: CommandContext) {
        ctx.reply('pong');
    }

    @OnGroupMessage()
    onGroup(event: OneBotGroupMessageEvent, ctx: SnowLumaEventContext) {
        if (event.raw_message === 'hello') {
            ctx.reply('Hello!');
        }
    }

    async onLoad() {
        this.bot.logger.info('PingPlugin 已加载');
    }
}
```

管理员指令:加 `@AdminCommand()` / `@SuperAdminCommand()` 标记后,命中该指令的消息事件自动带 `event.adminLevel`(消息事件类型已统一注入该字段),在中间件里据此鉴权即可:

```ts
@AdminCommand()
@Command('ban')
ban(event: OneBotMessageEvent, ctx: CommandContext) {
    // 管理员指令:event.adminLevel === 'admin'
}

@SuperAdminCommand()
@Command('reset')
reset(event: OneBotMessageEvent, ctx: CommandContext) {
    // 超管指令:event.adminLevel === 'super'
}
```

在 `src/plugins/index.ts` 登记后即可被 `main.ts` 自动装载:

```ts
export const builtinPlugins = [PingPlugin];
```

完整的插件编写文档见 [docs/plugin/00-intro.md](https://github.com/JsBot-Dev/JsBot-Docs/blob/main/plugin/00-intro.md)。

## 常用命令

| 命令               | 说明                 |
| ------------------ | -------------------- |
| `npm run dev`      | tsx watch 开发运行   |
| `npx tsc --noEmit` | 类型检查             |
