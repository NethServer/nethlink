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
  faDisplay,
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
        'flex flex-col gap-2 p-2 rounded-lg text-left border-2 transition-colors focus-visible:ring-2 focus-visible:ring-primaryRing dark:focus-visible:ring-primaryRingDark',
        isSelected
          ? 'border-primary dark:border-primaryDark bg-primary/5 dark:bg-primaryDark/5'
          : 'border-transparent hover:bg-hoverLight dark:hover:bg-hoverDark',
      )}
    >
      <div className='w-full aspect-video rounded-md bg-hoverLight dark:bg-hoverDark overflow-hidden flex items-center justify-center'>
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
          className='text-sm font-medium leading-5 dark:text-titleDark text-titleLight truncate'
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
      ? t('ScreenShare.Screen number', { number: index + 1 })
      : t('ScreenShare.Screen')
  }

  const tabs: { id: SourceTab; label: string; icon: IconDefinition }[] = [
    { id: 'screen', label: t('ScreenShare.Screens'), icon: faDisplay },
    { id: 'window', label: t('ScreenShare.Windows'), icon: faWindowMaximize },
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
            className='flex flex-col gap-1 px-6 pt-6 pb-4'
            style={{ WebkitAppRegion: 'drag' } as CSSProperties}
          >
            <h1 className='font-medium text-lg leading-7 dark:text-titleDark text-titleLight'>
              {t('ScreenShare.Title')}
            </h1>
            <p className='text-sm leading-5 text-textSecondaryNeutral dark:text-textSecondaryNeutralDark'>
              {t('ScreenShare.Description')}
            </p>
          </div>

          {screens.length > 0 && windows.length > 0 && (
            <div className='flex gap-2 px-6 pb-2'>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type='button'
                  onClick={() => changeTab(tab.id)}
                  className={classNames(
                    'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium leading-5 transition-colors focus-visible:ring-2 focus-visible:ring-primaryRing dark:focus-visible:ring-primaryRingDark',
                    activeTab === tab.id
                      ? 'bg-hoverLight dark:bg-hoverDark text-titleLight dark:text-titleDark'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-hoverLight dark:hover:bg-hoverDark',
                  )}
                >
                  <FontAwesomeIcon icon={tab.icon} className='h-4 w-4' />
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          <div className='flex-1 overflow-y-auto px-6 py-2'>
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

          <div className='flex flex-row-reverse gap-3 px-6 pt-4 pb-6'>
            <Button
              variant='primary'
              disabled={!selectedId}
              onClick={onShare}
              className='font-medium disabled:opacity-50'
            >
              {t('ScreenShare.Share')}
            </Button>
            <Button
              variant='ghost'
              onClick={onCancel}
              className='font-medium text-textBlueLight dark:text-textBlueDark'
            >
              {t('Common.Cancel')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
