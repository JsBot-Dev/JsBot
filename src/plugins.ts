import  EchoPlugin from './plugins/echo.plugin'
import  RolePlugin  from './plugins/role.plugin'
import  TestPlugin from './plugins/test.plugin'
import  AdminPlugin from './plugins/admin.plugin'
import  CavePlugin from './plugins/cave.plugin'
import  BlacklistPlugin from './plugins/blacklist.plugin'
import  AliasPlugin from './plugins/alias.plugin'
import  AdminManagePlugin from './plugins/admin.manage.plugin'
import  HelpPlugin from './plugins/help.plugin'

export const plugins = [
    new BlacklistPlugin(),
    new AliasPlugin(),
    new AdminManagePlugin(),
    new HelpPlugin(),
    new EchoPlugin(),
    new RolePlugin(),
    new TestPlugin(),
    new AdminPlugin(),
    new CavePlugin(),
]
