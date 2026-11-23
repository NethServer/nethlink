import { TimedComponent } from '@renderer/components/TimedComponent'

// the same geometry as a parked call
export const ParkedCallSkeleton = () => {
  return (
    <TimedComponent>
      <div className='flex flex-col gap-2 py-3'>
        <div className='flex items-start justify-between gap-4'>
          <div className='flex flex-col gap-2'>
            <div className='h-3 w-24 animate-pulse rounded-full bg-surfaceSkeleton dark:bg-surfaceSkeletonDark' />
            <div className='h-3 w-32 animate-pulse rounded-full bg-surfaceSkeleton dark:bg-surfaceSkeletonDark' />
            <div className='h-3 w-20 animate-pulse rounded-full bg-surfaceSkeleton dark:bg-surfaceSkeletonDark' />
          </div>
          <div className='h-3 w-10 animate-pulse rounded-full bg-surfaceSkeleton dark:bg-surfaceSkeletonDark' />
        </div>
        <div className='h-11 w-28 animate-pulse rounded-md bg-surfaceSkeleton dark:bg-surfaceSkeletonDark' />
      </div>
    </TimedComponent>
  )
}
