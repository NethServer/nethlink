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
import { forceWindowFocus } from '@/lib/windowsFocus'
import { SCREEN_SHARE_PICKER_SIZE, ScreenSharePickerWindow } from '../windows'
import { PhoneIslandController } from './PhoneIslandController'

type SettleRequest = (source?: DesktopCapturerSource) => void

type PreparedPicker = {
  pickerWindow: ScreenSharePickerWindow
  // resolves true once the renderer is mounted and listening for sources
  ready: Promise<boolean>
}

const PICKER_LOAD_TIMEOUT_MS = 30000

export class ScreenSharePickerController {
  static instance: ScreenSharePickerController
  private picker: PreparedPicker | undefined
  private shownSources: DesktopCapturerSource[] = []
  private keepWarm = false
  private settlePending: SettleRequest | undefined

  constructor() {
    ScreenSharePickerController.instance = this
    session.defaultSession.setDisplayMediaRequestHandler((_request, callback) =>
      this.handleRequest(callback),
    )
  }

  // While a call is active keep a hidden picker loaded, so a screen share
  // request only waits for the sources.
  prewarm() {
    this.keepWarm = true
    if (!this.picker && !this.settlePending) this.picker = this.preparePicker()
  }

  cancel() {
    this.keepWarm = false
    this.settlePending?.()
    this.destroyWindow()
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
      this.shownSources = []
      this.destroyWindow()
      if (this.keepWarm) this.picker = this.preparePicker()
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
      await this.showPicker(sources, settle, () => settled)
    } catch (e) {
      Log.error('SCREEN SHARE picker error', e)
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

  private preparePicker(): PreparedPicker {
    const pickerWindow = new ScreenSharePickerWindow()
    const window = pickerWindow.getWindow()!
    const isCurrent = () => this.picker?.pickerWindow === pickerWindow

    const ready = new Promise<boolean>((resolve) => {
      const loadTimeout = setTimeout(() => {
        Log.warning('SCREEN SHARE picker did not load')
        resolve(false)
      }, PICKER_LOAD_TIMEOUT_MS)
      const done = (loaded: boolean) => {
        clearTimeout(loadTimeout)
        resolve(loaded)
      }
      pickerWindow.addListener(IPC_EVENTS.SCREEN_SHARE_PICKER_SOURCES, () =>
        done(true),
      )
      window.on('closed', () => done(false))
      window.webContents.on('render-process-gone', () => done(false))
      window.webContents.on('did-fail-load', () => done(false))
    })

    const onGone = () => {
      if (!isCurrent()) return
      this.picker = undefined
      this.settlePending?.()
    }
    window.on('closed', onGone)
    window.webContents.on('render-process-gone', onGone)

    pickerWindow.addListener(
      IPC_EVENTS.SCREEN_SHARE_PICKER_SELECT,
      (_event, sourceId: string | null) => {
        if (!isCurrent()) return
        this.settlePending?.(this.shownSources.find((s) => s.id === sourceId))
      },
    )

    return { pickerWindow, ready }
  }

  private async showPicker(
    sources: DesktopCapturerSource[],
    settle: SettleRequest,
    isSettled: () => boolean,
  ) {
    const picker = this.picker ?? (this.picker = this.preparePicker())
    const serializedSources: ScreenShareSource[] = sources.map((s) => ({
      id: s.id,
      name: s.name,
      type: s.id.startsWith('screen:') ? 'screen' : 'window',
      thumbnail: s.thumbnail.toDataURL(),
      appIcon:
        s.appIcon && !s.appIcon.isEmpty() ? s.appIcon.toDataURL() : undefined,
    }))

    const loaded = await picker.ready
    if (isSettled()) return
    const window = picker.pickerWindow.getWindow()
    if (!loaded || this.picker !== picker || !window || window.isDestroyed()) {
      settle()
      return
    }

    this.shownSources = sources
    picker.pickerWindow.emit(
      IPC_EVENTS.SCREEN_SHARE_PICKER_SOURCES,
      serializedSources,
    )
    this.showCentered(window)
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
    if (process.platform === 'darwin') {
      window.setVisibleOnAllWorkspaces(true, {
        visibleOnFullScreen: true,
        skipTransformProcessType: true,
      })
    }
    window.show()
    window.setAlwaysOnTop(true, 'screen-saver')
    setTimeout(() => {
      if (window.isDestroyed()) return
      forceWindowFocus(window)
      window.focus()
      window.webContents.focus()
    }, 50)
  }

  private destroyWindow() {
    const window = this.picker?.pickerWindow.getWindow()
    this.picker = undefined
    if (window && !window.isDestroyed()) {
      window.destroy()
    }
  }
}
