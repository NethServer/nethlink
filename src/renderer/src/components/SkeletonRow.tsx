import classNames from "classnames"
import { TimedComponent } from "./TimedComponent"

export const SkeletonRow = () => {
  return <TimedComponent>
    <div
      className={classNames(`relative flex flex-row justify-between items-center min-h-[44px] p-2 px-5`)}
    >
      <div className="flex gap-6 items-center">
        <div className='animate-pulse rounded-full h-12 w-12 bg-gray-300 dark:bg-gray-600'></div>
        <div className="flex flex-col gap-1">
          <div className='animate-pulse rounded-full h-4 w-[230px] bg-gray-300 dark:bg-gray-600'></div>
        </div>
      </div>
    </div>
  </TimedComponent>
}
