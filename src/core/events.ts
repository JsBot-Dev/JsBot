import type { OneBotGroupMessageEvent, OneBotPrivateMessageEvent } from '@snowluma/sdk';
import type { AdminLevel } from './decorators';
import type { CooldownScope } from './cooldown';

/**
 * SDK 消息事件类型增强:统一为所有消息事件注入 `adminLevel` 字段。
 * 该字段由内核中间件(admin.ts)在事件分发时写入,普通消息事件保持 undefined。
 */
declare module '@snowluma/sdk' {
    interface OneBotGroupMessageEvent {
        adminLevel?: AdminLevel;
        onCooldown?: boolean;
        onCooldownRemaining?: number;
        onCooldownMessage?: string;
        onCooldownScope?: CooldownScope;
    }
    interface OneBotPrivateMessageEvent {
        adminLevel?: AdminLevel;
        onCooldown?: boolean;
        onCooldownRemaining?: number;
        onCooldownMessage?: string;
        onCooldownScope?: CooldownScope;
    }
}

export {};