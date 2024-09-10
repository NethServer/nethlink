import React, { useRef, useEffect, useCallback } from 'react';
import { IPC_EVENTS } from '@shared/constants';
import classNames from 'classnames';
import { isDev } from '@shared/utils/utils';

export const ElectronDraggableWindow = ({ children }) => {

  const handleMouseDown = useCallback((e) => {
    // if (e.target.tagName.toLowerCase() === 'input' || e.target.tagName.toLowerCase() === 'button') {
    //   return;
    // }
    window.electron.send(IPC_EVENTS.START_DRAG);
  }, []);

  const handleMouseUp = useCallback(() => {
    window.electron.send(IPC_EVENTS.STOP_DRAG);
  }, []);

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseUp]);

  return (
    <div
      onMouseDown={handleMouseDown}
      className={classNames('absolute select-none top-0 left-0 h-screen w-screen z-[10000]', isDev() ? 'bg-red-700/25' : '')}
    >
      {children}
    </div>
  );
};

