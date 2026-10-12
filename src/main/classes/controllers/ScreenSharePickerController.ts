import {
  BrowserWindow,
  DesktopCapturerSource,
  desktopCapturer,
  screen,
  session,
} from 'electron'
import { IPC_EVENTS } from '@shared/constants'
import { ScreenShareSource } from '@shared/types'
import { Log } from '@shared/utils/logger'
import { SCREEN_SHARE_PICKER_SIZE, ScreenSharePickerWindow } from '../windows'
import { PhoneIslandController } from './PhoneIslandController'

type SettleRequest = (source?: DesktopCapturerSource) => void

const PICKER_LOAD_TIMEOUT_MS = 10000

export class ScreenSharePickerController {
  static instance: ScreenSharePickerController
  private window: ScreenSharePickerWindow | undefined
  private settlePending: SettleRequest | undefined

  constructor() {
    ScreenSharePickerController.instance = this
    session.defaultSession.setDisplayMediaRequestHandler((_request, callback) =>
      this.handleRequest(callback),
    )
  }

  cancel() {
    this.settlePending?.()
  }

  private async handleRequest(callback: (streams: Electron.Streams) => void) {
    if (this.settlePending) {
      Log.warning('SCREEN SHARE request rejected: picker already open')
      callback(null as unknown as Electron.Streams)
      return
    }

    let settled = false
    const restorePhoneIsland = this.lowerPhoneIslandForSystemPicker()
    const settle: SettleRequest = (source) => {
      if (settled) return
      settled = true
      this.settlePending = undefined
      this.destroyWindow()
      restorePhoneIsland()
      if (source) {
        Log.info('SCREEN SHARE source selected', source.id, source.name)
        callback({ video: { id: source.id, name: source.name } })
      } else {
        Log.info('SCREEN SHARE request cancelled')
        callback(null as unknown as Electron.Streams)
      }
    }
    this.settlePending = settle

    try {
      const sources = await this.getSources()
      if (settled) return
      if (sources.length <= 1) {
        settle(sources[0])
        return
      }
      this.openPicker(sources, settle)
    } catch (e) {
      Log.error('SCREEN SHARE getSources error', e)
      settle()
    }
  }

  private lowerPhoneIslandForSystemPicker(): () => void {
    const isWayland =
      process.platform === 'linux' &&
      (process.env['XDG_SESSION_TYPE'] === 'wayland' ||
        !!process.env['WAYLAND_DISPLAY'])
    try {
      const window = PhoneIslandController.instance?.window?.getWindow()
      if (
        !isWayland ||
        !window ||
        window.isDestroyed() ||
        !window.isAlwaysOnTop()
      ) {
        return () => {}
      }
      window.setAlwaysOnTop(false)
      return () => {
        try {
          if (!window.isDestroyed()) {
            window.setAlwaysOnTop(true, 'screen-saver')
          }
        } catch (e) {
          Log.warning('SCREEN SHARE phone island restore error', e)
        }
      }
    } catch (e) {
      Log.warning('SCREEN SHARE phone island lowering error', e)
      return () => {}
    }
  }

  private async getSources(): Promise<DesktopCapturerSource[]> {
    const ownMediaSourceIds = new Set(
      BrowserWindow.getAllWindows()
        .filter((w) => !w.isDestroyed())
        .map((w) => w.getMediaSourceId()),
    )
    const sources = await desktopCapturer.getSources({
      types: ['screen', 'window'],
      thumbnailSize: { width: 320, height: 180 },
      fetchWindowIcons: true,
    })
    return sources.filter((s) => !ownMediaSourceIds.has(s.id))
  }

  private openPicker(sources: DesktopCapturerSource[], settle: SettleRequest) {
    const pickerWindow = new ScreenSharePickerWindow()
    this.window = pickerWindow
    const window = pickerWindow.getWindow()
    if (!window) {
      settle()
      return
    }

    const serializedSources: ScreenShareSource[] = sources.map((s) => ({
      id: s.id,
      name: s.name,
      type: s.id.startsWith('screen:') ? 'screen' : 'window',
      thumbnail: s.thumbnail.toDataURL(),
      appIcon:
        s.appIcon && !s.appIcon.isEmpty() ? s.appIcon.toDataURL() : undefined,
    }))

    const loadTimeout = setTimeout(() => {
      Log.warning('SCREEN SHARE picker did not load')
      settle()
    }, PICKER_LOAD_TIMEOUT_MS)

    window.on('closed', () => {
      clearTimeout(loadTimeout)
      settle()
    })
    window.webContents.on('render-process-gone', () => settle())
    window.webContents.on('did-fail-load', () => settle())

    pickerWindow.addListener(IPC_EVENTS.SCREEN_SHARE_PICKER_SOURCES, () => {
      clearTimeout(loadTimeout)
      pickerWindow.emit(
        IPC_EVENTS.SCREEN_SHARE_PICKER_SOURCES,
        serializedSources,
      )
      this.showCentered(window)
    })

    pickerWindow.addListener(
      IPC_EVENTS.SCREEN_SHARE_PICKER_SELECT,
      (_event, sourceId: string | null) => {
        settle(sources.find((s) => s.id === sourceId))
      },
    )
  }

  private showCentered(window: BrowserWindow) {
    try {
      const phoneIslandBounds = PhoneIslandController.instance?.window
        ?.getWindow()
        ?.getBounds()
      const display =
        phoneIslandBounds &&
        phoneIslandBounds.width > 1 &&
        phoneIslandBounds.height > 1
          ? screen.getDisplayMatching(phoneIslandBounds)
          : screen.getDisplayNearestPoint(screen.getCursorScreenPoint())
      const { x, y, width, height } = display.workArea
      const { width: w, height: h } = SCREEN_SHARE_PICKER_SIZE
      window.setBounds({
        x: x + Math.round((width - w) / 2),
        y: y + Math.round((height - h) / 2),
        width: w,
        height: h,
      })
    } catch (e) {
      Log.warning('SCREEN SHARE picker positioning error', e)
    }
    window.show()
    window.focus()
  }

  private destroyWindow() {
    const window = this.window?.getWindow()
    this.window = undefined
    if (window && !window.isDestroyed()) {
      window.destroy()
    }
  }
}
