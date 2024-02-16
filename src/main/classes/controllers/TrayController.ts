import { Menu, MenuItem, MenuItemConstructorOptions, Tray } from 'electron'
import { join } from 'path'

export class TrayController {
  tray: Tray
  constructor(onTrayIconClick: () => void) {
    this.tray = new Tray(join(__dirname, '../../resources/TrayLogo.png'))
    this.tray.setIgnoreDoubleClickEvents(true)
    this.tray.on('click', onTrayIconClick)
    const menu: (MenuItemConstructorOptions | MenuItem)[] = [
      {
        role: 'quit',
        //accelerator: 'Command+Q',
        commandId: 1
      }
    ]
    this.tray.on('right-click', () => {
      this.tray.popUpContextMenu(Menu.buildFromTemplate(menu))
    })
  }
}
