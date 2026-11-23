import { TimedComponent } from './TimedComponent'

// the same geometry as a list row: avatar, two lines of text
export const SkeletonRow = () => {
  return (
    <TimedComponent>
      <div className='flex min-h-14 items-center gap-3 px-4 py-3'>
        <div className='size-8 shrink-0 animate-pulse rounded-full bg-surfaceSkeleton dark:bg-surfaceSkeletonDark' />
        <div className='flex flex-1 flex-col gap-2'>
          <div className='h-3 w-2/3 animate-pulse rounded-full bg-surfaceSkeleton dark:bg-surfaceSkeletonDark' />
          <div className='h-3 w-1/3 animate-pulse rounded-full bg-surfaceSkeleton dark:bg-surfaceSkeletonDark' />
        </div>
      </div>
    </TimedComponent>
  )
}
