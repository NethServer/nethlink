import {
  CSSProperties,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
} from 'react'
import { t } from 'i18next'
import classNames from 'classnames'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  IconDefinition,
  faDesktop,
  faWindowMaximize,
} from '@fortawesome/free-solid-svg-icons'
import { IPC_EVENTS } from '@shared/constants'
import { ScreenShareSource } from '@shared/types'
import { useSharedState } from '@renderer/store'
import { parseThemeToClassName } from '@renderer/utils'
import { Button } from '@renderer/components/Nethesis'
import { CustomThemedTooltip } from '@renderer/components/Nethesis/CustomThemedTooltip'
import { useIsTruncated } from '@renderer/hooks/useIsTruncated'

type SourceTab = 'screen' | 'window'

const SourceCard = ({
  source,
  label,
  isSelected,
  onSelect,
  onConfirm,
}: {
  source: ScreenShareSource
  label: string
  isSelected: boolean
  onSelect: () => void
  onConfirm: () => void
}) => {
  const tooltipId = useId()
  const [labelRef, isLabelTruncated] = useIsTruncated<HTMLSpanElement>([label])

  return (
    <button
      type='button'
      data-source-card={source.id}
      onClick={onSelect}
      onDoubleClick={onConfirm}
      className={classNames(
        'flex flex-col gap-2 p-2 rounded-lg text-left focus:outline-none border-2 transition-colors',
        isSelected
          ? 'border-primary dark:border-primaryDark bg-gray-100 dark:bg-gray-800'
          : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-800',
      )}
    >
      <div className='w-full aspect-video rounded-md bg-gray-200 dark:bg-gray-700 overflow-hidden flex items-center justify-center'>
        <img
          src={source.thumbnail}
          alt=''
          className='max-w-full max-h-full object-contain'
          draggable={false}
        />
      </div>
      <div className='flex items-center gap-2 min-w-0 w-full'>
        {source.appIcon && (
          <img
            src={source.appIcon}
            alt=''
            className='h-4 w-4 shrink-0'
            draggable={false}
          />
        )}
        <span
          ref={labelRef}
          className='text-sm font-normal leading-5 dark:text-titleDark text-titleLight truncate'
          data-tooltip-id={isLabelTruncated ? tooltipId : undefined}
          data-tooltip-content={isLabelTruncated ? label : undefined}
        >
          {label}
        </span>
        {isLabelTruncated && <CustomThemedTooltip id={tooltipId} place='top' />}
      </div>
    </button>
  )
}

export function ScreenSharePickerPage() {
  const [theme] = useSharedState('theme')
  const [sources, setSources] = useState<ScreenShareSource[]>([])
  const [activeTab, setActiveTab] = useState<SourceTab>('screen')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const screens = useMemo(
    () => sources.filter((s) => s.type === 'screen'),
    [sources],
  )
  const windows = useMemo(
    () => sources.filter((s) => s.type === 'window'),
    [sources],
  )
  const visibleSources = activeTab === 'screen' ? screens : windows

  useEffect(() => {
    window.electron.receive(
      IPC_EVENTS.SCREEN_SHARE_PICKER_SOURCES,
      (receivedSources: ScreenShareSource[]) => {
        setSources(receivedSources)
        setActiveTab(
          receivedSources.some((s) => s.type === 'screen')
            ? 'screen'
            : 'window',
        )
      },
    )
    window.electron.send(IPC_EVENTS.SCREEN_SHARE_PICKER_SOURCES)
    return () => {
      window.electron.removeAllListeners(IPC_EVENTS.SCREEN_SHARE_PICKER_SOURCES)
    }
  }, [])

  const select = useCallback((sourceId: string | null) => {
    window.electron.send(IPC_EVENTS.SCREEN_SHARE_PICKER_SELECT, sourceId)
  }, [])

  const onCancel = useCallback(() => select(null), [select])

  const onShare = useCallback(() => {
    if (selectedId) select(selectedId)
  }, [select, selectedId])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel()
      } else if (e.key === 'Enter') {
        const target = e.target as HTMLElement
        const card = target.closest('[data-source-card]')
        if (
          card
            ? card.getAttribute('data-source-card') !== selectedId
            : target.closest('button')
        ) {
          return
        }
        e.preventDefault()
        onShare()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onCancel, onShare, selectedId])

  const changeTab = (tab: SourceTab) => {
    setActiveTab(tab)
    setSelectedId(null)
  }

  const getLabel = (source: ScreenShareSource, index: number) => {
    if (source.type === 'window') return source.name
    return screens.length > 1
      ? t('ScreenShare.Screen', { number: index + 1 })
      : t('ScreenShare.Entire screen')
  }

  const tabs: { id: SourceTab; label: string; icon: IconDefinition }[] = [
    { id: 'screen', label: t('ScreenShare.Entire screen'), icon: faDesktop },
    { id: 'window', label: t('ScreenShare.Window'), icon: faWindowMaximize },
  ]

  return (
    <div
      className={classNames(
        parseThemeToClassName(theme),
        'font-Poppins h-screen overflow-hidden',
      )}
    >
      <div className='h-full rounded-xl p-[1px] bg-borderLight dark:bg-borderDark'>
        <div className='h-full rounded-[11px] bg-bgLight dark:bg-bgDark flex flex-col overflow-hidden'>
          <div
            className='px-6 pt-5 pb-3'
            style={{ WebkitAppRegion: 'drag' } as CSSProperties}
          >
            <h1 className='font-medium text-lg leading-7 dark:text-titleDark text-titleLight'>
              {t('ScreenShare.Title')}
            </h1>
          </div>

          {screens.length > 0 && windows.length > 0 && (
            <div className='flex gap-4 px-6 border-b dark:border-borderDark border-borderLight'>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type='button'
                  onClick={() => changeTab(tab.id)}
                  className={classNames(
                    'flex items-center gap-2 py-2 -mb-px border-b-2 text-sm font-medium leading-5 focus:outline-none',
                    activeTab === tab.id
                      ? 'border-primary dark:border-primaryDark text-primary dark:text-primaryDark'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200',
                  )}
                >
                  <FontAwesomeIcon icon={tab.icon} className='h-4 w-4' />
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          <div className='flex-1 overflow-y-auto px-6 py-4'>
            <div
              className={classNames(
                'grid gap-4',
                activeTab === 'screen' ? 'grid-cols-2' : 'grid-cols-3',
              )}
            >
              {visibleSources.map((source, index) => (
                <SourceCard
                  key={source.id}
                  source={source}
                  label={getLabel(source, index)}
                  isSelected={selectedId === source.id}
                  onSelect={() => setSelectedId(source.id)}
                  onConfirm={() => select(source.id)}
                />
              ))}
            </div>
          </div>

          <div className='flex justify-end gap-3 px-6 py-4 border-t dark:border-borderDark border-borderLight'>
            <Button variant='ghost' onClick={onCancel}>
              {t('Common.Cancel')}
            </Button>
            <Button variant='primary' disabled={!selectedId} onClick={onShare}>
              {t('ScreenShare.Share')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
