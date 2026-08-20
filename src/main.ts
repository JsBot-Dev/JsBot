import { JsBot } from './core/bot';
import { loadConfig } from './core/config';
import { builtinPlugins } from './plugins';

// 组装:加载配置 → 创建 Bot 容器 → 挂载内置插件。
const bot = new JsBot(loadConfig());
for (const PluginCtor of builtinPlugins) {
    bot.use(PluginCtor);
}

/** 收到退出信号时优雅关闭:先停止 Bot 再退出进程。 */
async function shutdown(signal: string): Promise<void> {
    bot.logger.info(`收到 ${signal},正在关闭...`);
    await bot.stop();
    process.exit(0);
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));

try {
    await bot.start();
} catch (err) {
    bot.logger.error(`启动失败: ${String(err)}`);
    process.exit(1);
}