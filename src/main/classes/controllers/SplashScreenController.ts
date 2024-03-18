import { SplashScreenWindow } from '../windows'

export class SplashScreenController {
  static instance: SplashScreenController
  window: SplashScreenWindow
  constructor() {
    SplashScreenController.instance = this
    this.window = new SplashScreenWindow()
  }

  show(): void {
    this.window!.show()
  }

  hide(): void {
    this.window.hide()
  }
}
