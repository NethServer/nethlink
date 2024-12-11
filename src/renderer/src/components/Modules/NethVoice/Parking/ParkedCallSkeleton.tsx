import { TimedComponent } from "@renderer/components/TimedComponent"

export const ParkedCallSkeleton = () => {

  return (
    <TimedComponent>
      <div className={`relative flex flex-row justify-between items-center min-h-[44px] py-3 px-5 animate-pulse`}>
        <div className="flex flex-col gap-2">
          <div className="flex flex-row items-center  gap-2">
            <div className=' rounded-md h-5 w-5 bg-gray-300 dark:bg-gray-600'></div>
            <div className=' rounded-full h-4 w-[80px] bg-gray-300 dark:bg-gray-600'></div>
          </div>
          <div className="flex flex-col gap-1">
            <div className='rounded-full h-4 w-[90px] bg-gray-300 dark:bg-gray-600'></div>
          </div>
        </div>
        <div className=' rounded-md h-6 bg-gray-300 dark:bg-gray-600 w-[40px]'></div>
        <div className=' rounded-md h-8 bg-gray-300 dark:bg-gray-600 w-[100px]'></div>
      </div>
    </TimedComponent>
  )
}
