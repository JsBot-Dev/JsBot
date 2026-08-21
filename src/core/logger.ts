/** 日志级别,从上到下详细程度递减。 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/** 级别到数值的映射,用于比较阈值。 */
const LEVEL_ORDER: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};

/** 各级别对应的 console 方法。 */
const CONSOLE_METHOD: Record<LogLevel, 'debug' | 'info' | 'warn' | 'error'> = {
    debug: 'debug',
    info: 'info',
    warn: 'warn',
    error: 'error',
};

/** ANSI 颜色代码 */
const LEVEL_COLOR: Record<LogLevel, string> = {
    debug: '\x1b[90m',
    info: '\x1b[32m',
    warn: '\x1b[33m',
    error: '\x1b[31m',
};

const COLOR_RESET = '\x1b[0m';
const COLOR_DIM = '\x1b[2m';

/** 判断是否为 TTY (支持颜色) */
const isTTY = typeof process !== 'undefined' && process.stdout?.isTTY === true;

/** 格式化参数为字符串 */
function formatArgs(args: unknown[]): string {
    return args
        .map((arg) => {
            if (arg === undefined) return 'undefined';
            if (arg === null) return 'null';
            if (typeof arg === 'object') {
                try {
                    return JSON.stringify(arg);
                } catch {
                    return String(arg);
                }
            }
            return String(arg);
        })
        .join(' ');
}

/** 日志器选项 */
export interface LoggerOptions {
    level?: LogLevel;
    module?: string;
    parent?: Logger;
}

/**
 * 增强日志器:带 ISO 时间戳、级别前缀、模块名、颜色支持、子日志器。
 * 低于阈值的日志直接丢弃,不影响其它模块。
 */
export class Logger {
    private readonly threshold: number;
    private readonly module?: string;
    private readonly parent?: Logger;

    constructor(options: LoggerOptions = {}) {
        this.threshold = LEVEL_ORDER[options.level ?? 'info'];
        this.module = options.module;
        this.parent = options.parent;
    }

    /** 创建带有额外上下文的子日志器 */
    child(context: { module: string }): Logger {
        const childModule = this.module ? `${this.module}:${context.module}` : context.module;
        return new Logger({
            level: this.getLevel(),
            module: childModule,
            parent: this,
        });
    }

    /** 获取当前日志级别 */
    getLevel(): LogLevel {
        for (const [level, order] of Object.entries(LEVEL_ORDER)) {
            if (order === this.threshold) return level as LogLevel;
        }
        return 'info';
    }

    /** 设置日志级别 (运行时动态调整) */
    setLevel(level: LogLevel): void {
        (this as any).threshold = LEVEL_ORDER[level];
    }

    debug(...args: unknown[]): void {
        this.log('debug', ...args);
    }

    info(...args: unknown[]): void {
        this.log('info', ...args);
    }

    warn(...args: unknown[]): void {
        this.log('warn', ...args);
    }

    error(...args: unknown[]): void {
        this.log('error', ...args);
    }

    /** 统一输出入口:先过滤级别,再格式化打印。 */
    private log(level: LogLevel, ...args: unknown[]): void {
        if (LEVEL_ORDER[level] < this.threshold) return;

        const timestamp = new Date().toISOString();
        const message = formatArgs(args);
        const levelStr = level.toUpperCase().padEnd(5);
        const moduleStr = this.module ? ` [${this.module}]` : '';

        let output: string;
        if (isTTY) {
            const color = LEVEL_COLOR[level];
            output = `${COLOR_DIM}[${timestamp}]${COLOR_RESET} ${color}[${levelStr}]${COLOR_RESET}${moduleStr} ${message}`;
        } else {
            output = `[${timestamp}] [${levelStr}]${moduleStr} ${message}`;
        }

        console[CONSOLE_METHOD[level]](output);
    }
}

/** 创建日志器的工厂函数 */
export function createLogger(options: LoggerOptions = {}): Logger {
    return new Logger(options);
}