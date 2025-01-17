import { PAGES } from '@shared/types'
import { BaseWindow } from './BaseWindow'

export class DevToolsWindow extends BaseWindow {
  constructor() {
    super(PAGES.DEVTOOLS, {
      show: false,
      y: 80,
      x: 100,
      closable: false,
      movable: true,
      frame: true,
      height: 580,
      width: 300,
      resizable: true,
      alwaysOnTop: true,
      minimizable: true,
      maximizable: false,
      titleBarStyle: 'default',
      title: 'NethLink DevTools',

    })
  }
}
