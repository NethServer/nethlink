import { BrowserWindow } from 'electron'

export class BaseWindow {
  protected _window: BrowserWindow | undefined
  constructor() {
    this.buildWindow()
  }

  hide() {
    this._window?.hide()
  }

  show() {
    if (!this._window) this.buildWindow()
    this._window!.show()
  }

  close() {
    this._window?.close()
    this._window = undefined
  }

  isOpen() {
    return this._window?.isVisible()
  }

  buildWindow() {
    throw new Error('This function is not implemented')
  }
}
