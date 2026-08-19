import { SnowLumaWebSocketClient } from '@snowluma/sdk';
import { plugins } from './plugins';
import dotenv from 'dotenv';
dotenv.config()

const client = new SnowLumaWebSocketClient({
    url: process.env.BaseUrl,
    accessToken: process.env.AccessToken,
    reconnect:true,
})

for(const plugin of plugins){
    plugin(client)
}
 
await client.connect();
