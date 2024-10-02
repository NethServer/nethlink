import { DevToolsWindow } from '../windows'

export class DevToolsController {

  static instance: DevToolsController
  window: DevToolsWindow
  constructor() {
    DevToolsController.instance = this
    this.window = new DevToolsWindow()
  }

  show(): void {
    this.window.show()
  }

  hide(): void {
    this.window.hide()
  }

  toggle() {
    if (this.window.isOpen()) {
      this.hide()
    } else {
      this.show()
    }
  }
}
