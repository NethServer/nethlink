export function LoginPage() {
  function submit(event: React.FormEvent) {
    event.preventDefault()
    const f = {
      host: event.target[0].value,
      username: event.target[1].value,
      password: event.target[2].value
    }
    console.log(f, window.electron)
    window.api.login(f.host, f.username, f.password)
  }

  return (
    <form onSubmit={submit}>
      <div className="flex flex-col h-full w-full bg-black p-5">
        <input name="host" value="https://cti.demo-heron.sf.nethserver.net" />
        <input name="username" value="lorenzo" />
        <input name="password" value="NethVoice,1234" />
        <button className="bg-gray-900 text-white" type="submit">
          login
        </button>
      </div>
    </form>
  )
}
