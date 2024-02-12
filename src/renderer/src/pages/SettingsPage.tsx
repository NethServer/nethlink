export function SettingsPage() {
  async function openDevices() {
    window.electron.ipcRenderer.send('openDevices')
    console.log(await navigator.usb.getDevices())
    console.log(
      await navigator.usb.requestDevice({
        filters: []
      })
    )
  }

  return (
    <div className="absolute pb-1 container text-red-500 w-full h-full overflow-hidden flex flex-col items-center">
      SETTINGS
      <button onClick={openDevices}>devices</button>
    </div>
  )
}
