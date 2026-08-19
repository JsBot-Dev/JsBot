import  EchoPlugin from './plugins/echo.plugin'
import  RolePlugin  from './plugins/role.plugin'
import  TestPlugin from './plugins/test.plugin'
import  AdminPlugin from './plugins/admin.plugin'
import  CavePlugin from './plugins/cave.plugin'

export const plugins = [
    new EchoPlugin(),
    new RolePlugin(),
    new TestPlugin(),
    new AdminPlugin(),
    new CavePlugin(),
]
