import { PAGES } from '@shared/types'
import { AccountController } from '../controllers'
import { BaseWindow } from './BaseWindow'

export const LOGIN_WINDOW_WIDTH = 500
export class LoginWindow extends BaseWindow {
  constructor() {
    super(PAGES.LOGIN, {
      width: LOGIN_WINDOW_WIDTH,
      height: 0,
      show: false,
      fullscreenable: false,
      autoHideMenuBar: true,
      closable: false,
      alwaysOnTop: true,
      minimizable: false,
      maximizable: false,
      movable: true,
      resizable: false,
      skipTaskbar: true,
      roundedCorners: true,
      parent: undefined,
      transparent: true,
      hiddenInMissionControl: true,
      hasShadow: false,
      center: true,
      fullscreen: false,
      acceptFirstMouse: false,
      frame: false,
      thickFrame: false
    })
  }

}
