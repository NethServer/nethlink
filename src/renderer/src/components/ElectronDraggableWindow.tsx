import { useRef, useEffect } from 'react';
import { IPC_EVENTS } from '@shared/constants';
import classNames from 'classnames';
import { isDev } from '@shared/utils/utils';

export const ElectronDraggableWindow = ({ children }) => {

  const isDrag = useRef<boolean>(false)
  const passthroughEvent = useRef<boolean>(false)
  const mouseDownEvent = useRef<MouseEvent | null>(null)
  const mouseUpEvent = useRef<MouseEvent | null>(null)
  const target = useRef<EventTarget | null>(null)
  const lastMouseDownTime = useRef<number>(0)

  const handleMouseClick = (e: MouseEvent) => {
    if (e['pointerId'] !== -1) {
      if (e.isTrusted || !e['nethlink']) {
        e.stopImmediatePropagation()
        e.stopPropagation()
        e.preventDefault()
      } else if (e['nethlink'] && target.current && passthroughEvent.current) {
        target.current = null
        passthroughEvent.current = false
      }
    } else {
      target.current = null
      passthroughEvent.current = false
    }
  };

  const handleMouseDown = (e: MouseEvent) => {
    const now = Date.now();
    if (now - lastMouseDownTime.current < 100) {
      return;
    }
    lastMouseDownTime.current = now;

    if (!isDrag.current && !mouseDownEvent.current) {
      target.current = e.target
      passthroughEvent.current = false
      window.electron.send(IPC_EVENTS.START_DRAG);
      mouseDownEvent.current = e
      mouseUpEvent.current = null
      isDrag.current = true
    }
  };

  const handleMouseUp = (e: MouseEvent) => {
    mouseDownEvent.current = null
    window.electron.send(IPC_EVENTS.STOP_DRAG);
    isDrag.current = false
    mouseUpEvent.current = e
  };

  const handleMouseLeave = () => {
    if (isDrag.current) {
      window.electron.send(IPC_EVENTS.STOP_DRAG);
      isDrag.current = false;
      mouseDownEvent.current = null;
    }
  };

  const handleWindowBlur = () => {
    if (isDrag.current) {
      isDrag.current = false;
      mouseDownEvent.current = null;
      window.electron.send(IPC_EVENTS.STOP_DRAG);
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleMouseClick, { capture: true });
    document.addEventListener('mousedown', handleMouseDown, { capture: true });
    document.addEventListener('mouseup', handleMouseUp, { capture: true });
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('blur', handleWindowBlur);

    window.electron.receive(IPC_EVENTS.ENABLE_CLICK, () => {
      if (target.current && !passthroughEvent.current) {
        passthroughEvent.current = true
        const newEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window,
        });
        newEvent['nethlink'] = true
        target.current.dispatchEvent(newEvent);
      }
    });

    return () => {
      document.removeEventListener('click', handleMouseClick);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, []);

  return (
    <div
      className={classNames('select-none h-[inherit] w-[inherit] z-[10000]', isDev() ? 'bg-red-700/75' : '')}
    >
      {children}
    </div>
  );
};