import { BrowserWindow } from 'electron'

export class BaseWindow {
  protected _window: BrowserWindow | undefined
  protected _buildArgs: any

  constructor(...args: any) {
    this._buildArgs = args
    this.buildWindow(...this._buildArgs)
  }

  hide(...args: any) {
    this._window?.hide()
  }

  show(...args: any) {
    if (!this._window) this.buildWindow(...(args || this._buildArgs))
    this._window!.show()
  }

  close(...args: any) {
    this._window?.close()
    this._window = undefined
  }

  isOpen(...args: any) {
    return this._window?.isVisible()
  }

  buildWindow(...args: any) {
    throw new Error('This function is not implemented')
  }
}
