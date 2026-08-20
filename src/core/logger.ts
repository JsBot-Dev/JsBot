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

/**
 * 极简日志器:带 ISO 时间戳与级别前缀,支持级别过滤。
 * 低于阈值的日志直接丢弃,不影响其它模块。
 */
export class Logger {
    private readonly threshold: number;

    constructor(level: LogLevel = 'info') {
        this.threshold = LEVEL_ORDER[level];
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

    /** 统一输出入口:先过滤级别,再打印。 */
    private log(level: LogLevel, ...args: unknown[]): void {
        if (LEVEL_ORDER[level] < this.threshold) return;
        const timestamp = new Date().toISOString();
        console[CONSOLE_METHOD[level]](`[${timestamp}] [${level.toUpperCase()}]`, ...args);
    }
}