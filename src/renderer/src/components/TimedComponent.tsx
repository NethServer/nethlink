import classNames from "classnames"
import { ReactElement, useEffect, useRef, useState } from "react"

export const TimedComponent = ({ children, timer }: { children: ReactElement, timer?: number }) => {
  const timerRef = useRef<number | NodeJS.Timeout | undefined>()
  const [isVisible, setIsVisible] = useState(false)
  useEffect(() => {
    if (!timerRef.current)
      timerRef.current = setTimeout(() => {
        setIsVisible(true)
      }, timer || 500)
  })

  return <div className={classNames(isVisible ? '' : 'hidden')}>
    {children}
  </div>
}
