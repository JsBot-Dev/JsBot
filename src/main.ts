import { SnowLumaWebSocketClient,at,message,text } from '@snowluma/sdk';
import dotenv from 'dotenv';
dotenv.config()

const bot = new SnowLumaWebSocketClient({
    url: process.env.BaseUrl,
    accessToken: process.env.AccessToken,
    reconnect:true,
})

await bot.connect();

setTimeout(() => {}, 0); 