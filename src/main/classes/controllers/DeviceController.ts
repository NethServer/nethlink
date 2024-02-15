import { BrowserWindow } from 'electron'
import { usb } from 'usb'

/**
 *
 *  https://www.geeksforgeeks.org/how-to-access-usb-devices-from-node-webkit/
 *
 */
export class DeviceController {
  mainWindow: BrowserWindow
  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow

    //let selectBluetoothCallback
    mainWindow.webContents.session.setBluetoothPairingHandler((details, callback) => {
      //const bluetoothPinCallback = callback
      // Send a message to the renderer to prompt the user to confirm the pairing.
      mainWindow.webContents.send('bluetooth-pairing-request', details)
    })
  }

  selectUSB() {
    const devices = usb.getDeviceList()
    console.log(devices)
    let grantedDeviceThroughPermHandler

    this.mainWindow.webContents.session.on('select-usb-device', (event, details, callback) => {
      // Add events to handle devices being added or removed before the callback on
      // `select-usb-device` is called.
      this.mainWindow.webContents.session.on('usb-device-added', (_event, device) => {
        console.log('usb-device-added FIRED WITH', device)
        // Optionally update details.deviceList
      })

      this.mainWindow.webContents.session.on('usb-device-removed', (_event, device) => {
        console.log('usb-device-removed FIRED WITH', device)
        // Optionally update details.deviceList
      })

      event.preventDefault()
      if (details.deviceList && details.deviceList.length > 0) {
        const deviceToReturn = details.deviceList.find((device) => {
          return (
            !grantedDeviceThroughPermHandler ||
            device.deviceId !== grantedDeviceThroughPermHandler.deviceId
          )
        })
        if (deviceToReturn) {
          callback(deviceToReturn.deviceId)
        } else {
          callback()
        }
      }
    })

    this.mainWindow.webContents.session.setPermissionCheckHandler(
      (_webContents, permission, _requestingOrigin, details) => {
        if (permission === 'usb' && details.securityOrigin === 'file:///') {
          return true
        }
        return false
      }
    )

    this.mainWindow.webContents.session.setDevicePermissionHandler((details) => {
      if (details.deviceType === 'usb' && details.origin === 'file://') {
        if (!grantedDeviceThroughPermHandler) {
          grantedDeviceThroughPermHandler = details.device
          return true
        }
      }
      return false
    })

    //this.mainWindow.webContents.session.setUSBProtectedClassesHandler((details) => {
    //  return details.protectedClasses.filter((usbClass) => {
    //    // Exclude classes except for audio classes
    //    return usbClass.indexOf('audio') === -1
    //  })
    //})
  }
}
