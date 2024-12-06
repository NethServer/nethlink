import { log } from '@shared/utils/logger'
import { SplashScreenWindow } from '../windows'

export class SplashScreenController {
  static instance: SplashScreenController
  window: SplashScreenWindow
  constructor() {
    SplashScreenController.instance = this
    this.window = new SplashScreenWindow()
  }

  show(): void {
    try {
      this.window!.show()
    } catch (e) {
      log('WARNING error during showing the SplashScreenWindow:', e)
    }
  }

  hide(): void {
    try {
      this.window.hide()
    } catch (e) {
      log('WARNING error during hiding the SplashScreenWindow:', e)
    }
  }
}
