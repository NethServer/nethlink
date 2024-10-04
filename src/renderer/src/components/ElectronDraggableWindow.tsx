import React, { useRef, useEffect, useCallback } from 'react';
import { IPC_EVENTS } from '@shared/constants';
import classNames from 'classnames';
import { debouncer, isDev } from '@shared/utils/utils';
import { log } from '@shared/utils/logger';

export const ElectronDraggableWindow = ({ children }) => {

  const isDrag = useRef<boolean>(false)
  const passthroughEvent = useRef<boolean>(false)
  const mouseDownEvent = useRef<MouseEvent | null>(null)
  const mouseUpEvent = useRef<MouseEvent | null>(null)
  const target = useRef<EventTarget | null>(null)

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
    if (!mouseUpEvent.current) {
      mouseDownEvent.current = null
      window.electron.send(IPC_EVENTS.STOP_DRAG);
      isDrag.current = false
      mouseUpEvent.current = e
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleMouseClick, {
      capture: true,
    });
    document.addEventListener('mousedown', handleMouseDown, {
      capture: true,
    });
    document.addEventListener('mouseup', handleMouseUp, {
      capture: true,
    });

    window.electron.receive(IPC_EVENTS.ENABLE_CLICK, () => {
      if (target.current && !passthroughEvent.current) {
        passthroughEvent.current = true
        const newEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window,
        });
        //we create an untrusted event, with this property we ensure that this event was created by us
        newEvent['nethlink'] = true
        target.current.dispatchEvent(newEvent);
      }
    })

    return () => {
      document.removeEventListener('click', handleMouseClick);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseUp]);

  return (
    <div
      className={classNames('absolute select-none top-0 left-0 h-screen w-screen z-[10000]', isDev() ? 'bg-red-700/75' : '')}
    >
      {children}
    </div>
  );
};

