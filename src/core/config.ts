import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import dotenv from 'dotenv';
import type { ReconnectOptions } from '@snowluma/sdk';
import type { LogLevel } from './logger';

/** 运行时使用的完整配置(所有字段已合并默认值并校验)。 */
export interface BotConfig {
    /** OneBot WebSocket 端点,如 ws://127.0.0.1:3001/。 */
    baseUrl: string;
    /** 访问令牌。 */
    accessToken: string;
    /** 断线重连策略,透传给 SDK。 */
    reconnect: boolean | ReconnectOptions;
    /** 日志级别。 */
    logLevel: LogLevel;
    /** 管理员 QQ 名单。 */
    admins: number[];
    /** 超级管理员 QQ 名单(隐含管理员权限)。 */
    superAdmins: number[];
    /** 启用的插件列表(按类名)。 */
    plugins: string[];
}

/** 配置文件(bot.config.json)可覆盖的字段,均为可选。 */
interface FileConfig {
    baseUrl?: string;
    accessToken?: string;
    reconnect?: boolean | ReconnectOptions;
    logLevel?: LogLevel;
    admins?: number[];
    superAdmins?: number[];
    plugins?: string[];
}

/** 各字段的兜底默认值。 */
const DEFAULTS: BotConfig = {
    baseUrl: '',
    accessToken: '',
    reconnect: true,
    logLevel: 'info',
    admins: [],
    superAdmins: [],
    plugins: [],
};

/**
 * 加载配置,优先级从低到高:
 *  默认值 → 配置文件(bot.config.json)→ 环境变量(.env)
 * 加载完成后做必填项校验,缺失则抛错退出。
 */
export function loadConfig(filePath = 'bot.config.json'): BotConfig {
    dotenv.config();

    const file = loadFileConfig(filePath);
    const env = readEnvConfig();

    const merged: BotConfig = {
        ...DEFAULTS,
        ...file,
        ...env,
    };

    validate(merged, filePath);

    return merged;
}

/** 读取可选的 JSON 配置文件;文件不存在时返回空对象。 */
function loadFileConfig(filePath: string): FileConfig {
    const absolute = resolve(process.cwd(), filePath);
    try {
        const raw = readFileSync(absolute, 'utf-8');
        return JSON.parse(raw) as FileConfig;
    } catch (err) {
        if ((err as NodeJS.ErrnoException).code === 'ENOENT') return {};
        throw err;
    }
}

/**
 * 从环境变量读取配置。
 * 注意:只返回「已设置」的键,否则值为 undefined 的键会
 * 在展开合并时覆盖默认值(如 logLevel 默认的 'info')。
 */
function readEnvConfig(): FileConfig {
    const config: FileConfig = {};
    if (process.env.BaseUrl) config.baseUrl = process.env.BaseUrl;
    if (process.env.AccessToken) config.accessToken = process.env.AccessToken;
    if (process.env.LogLevel) config.logLevel = process.env.LogLevel as LogLevel;
    if (process.env.Admins) config.admins = parseIdList(process.env.Admins);
    if (process.env.SuperAdmins) config.superAdmins = parseIdList(process.env.SuperAdmins);
    return config;
}

/** 把逗号分隔的 QQ 名单解析为数字数组,忽略空项与非法值。 */
function parseIdList(raw: string): number[] {
    return raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => Number(s))
        .filter((n) => Number.isInteger(n) && n > 0);
}

/** 校验必填项与枚举值,失败时抛出聚合错误。 */
function validate(config: BotConfig, filePath: string): void {
    const errors: string[] = [];
    if (!config.baseUrl) errors.push('baseUrl 未配置(环境变量 BaseUrl 或配置文件)。');
    if (!config.accessToken) errors.push('accessToken 未配置(环境变量 AccessToken 或配置文件)。');
    if (config.logLevel && !(config.logLevel in LEVEL_ORDER)) {
        errors.push(`logLevel 无效: ${config.logLevel}。`);
    }
    if (errors.length > 0) {
        throw new Error(`配置校验失败(${filePath}):\n${errors.map((e) => `  - ${e}`).join('\n')}`);
    }
}

/** 合法日志级别集合。 */
const LEVEL_ORDER: Record<string, true> = {
    debug: true,
    info: true,
    warn: true,
    error: true,
};