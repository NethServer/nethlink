import { useInitialize } from '@renderer/hooks/useInitialize'
import background from '../assets/splashScreenBackground.svg'
import header from '../assets/splashScreenHeader.svg'
import logo from '../assets/splashScreenLogo.svg'

export function SplashScreenPage() {

  useInitialize(() => { }, true)

  return (
    <div
      className="h-[100vh] w-[100vw] p-1 rounded-[10px]"
    >
      <img src={background} draggable={false} className='absolute w-[100vw] h-[100vh] top-0 left-0' />
      <div className='absolute top-0 left-0' >
        <div className="h-full w-full flex flex-col items-center p-9">
          <img src={header} draggable="false"></img>
          <p className="text-gray-300 text-sm px-5 text-center mt-8">
            Lorem ipsum dolor sit amet, consectet adipiscing elit. Donec cursus condimentum lorem sed
            tincidunt.
          </p>
          <p className="text-gray-300 text-sm px-5 text-center mt-5">
            Initializing the application...
          </p>
          <div className="grow flex items-end">
            <img src={logo} className="w-10 h-10" draggable="false"></img>
          </div>
        </div>
      </div>
    </div>
  )
}
