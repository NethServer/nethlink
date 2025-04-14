import { zodResolver } from "@hookform/resolvers/zod"
import { Button, TextInput } from "@renderer/components/Nethesis"
import { useNethlinkData, useSharedState } from "@renderer/store"
import { IPC_EVENTS } from "@shared/constants"
import { t } from "i18next"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

export function SettingsShortcutDialog() {
  const [account, setAccount] = useSharedState('account')
  const [, setIsShortcutDialogOpen] = useNethlinkData('isShortcutDialogOpen')
  const [combo, setCombo] = useState("");
  const [keysPressed, setKeysPressed] = useState(new Set());

  const ignoredKeys = new Set([
    "Tab",
    "CapsLock",
    "NumLock",
    "ScrollLock",
    "Pause",
    "Insert",
    "Dead",
    "Unidentified",
    "Escape"
  ]);

  const isModifierKey = (key: string) =>
    ["Control", "Alt", "Meta", "Shift"].includes(key);

  const normalizeKey = (key: string): string => {
    switch (key) {
      case "Control":
        return "Ctrl";
      case "Meta":
        return "Cmd";
      case " ":
        return "Space";
      default:
        return key.length === 1 ? key.toUpperCase() : key;
    }
  };
  
  useEffect(() => {
    setFocus('combo')
  }, [])

  useEffect(() => {
    if (account?.shortcut) {
      setCombo(account.shortcut);
    }
  }, [account?.shortcut]);

  const schema: z.ZodType<{ combo: string }> = z.object({
    combo: z
      .string()
      .trim()
      .min(1, `${t('Common.This field is required')}`)
  })

  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors }
  } = useForm({
    defaultValues: {
      combo: ''
    },
    resolver: zodResolver(schema)
  })

  function handleCancel(e) {
    e.preventDefault()
    e.stopPropagation()
    setIsShortcutDialogOpen(false)
  }

  async function submit(data) {
    const updatedAccount = { ...account!, shortcut: data.combo }
    setAccount(() => updatedAccount)
    window.electron.send(IPC_EVENTS.CHANGE_SHORTCUT, data.combo)
    setIsShortcutDialogOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.preventDefault();

    const rawKey = e.key;
    if (ignoredKeys.has(rawKey)) return;

    const newKeys = new Set(keysPressed);

    if (e.ctrlKey) newKeys.add("Ctrl");
    if (e.altKey) newKeys.add("Alt");
    if (e.metaKey) newKeys.add("Cmd");
    if (e.shiftKey) newKeys.add("Shift");

    if (!isModifierKey(rawKey)) {
      newKeys.add(normalizeKey(rawKey));
    }

    setKeysPressed(newKeys);

    const orderedModifiers = ["Ctrl", "Alt", "Cmd", "Shift"];
    const modifiers = orderedModifiers.filter((k) => newKeys.has(k));
    const others = [...newKeys].filter((k) => !orderedModifiers.includes(k as any));
    setCombo([...modifiers, ...others].join("+"));
  };

  const handleKeyUp = () => {
    setKeysPressed(new Set());
  };

  return (
    <div className='absolute top-0 left-0 w-screen h-screen flex justify-center items-center z-[205] pointer-events-none'>
      <div className=" bg-bgLight dark:bg-bgDark text-bgDark dark:text-bgLight rounded-lg m-8 p-0 pointer-events-auto">
        <div className="p-4  flex flex-col gap-2">
          <div>{t('TopBar.Enter keyboard shortcut to start call')}</div>
          <div>
            <form onSubmit={handleSubmit(submit)}>
              <TextInput
                {...register('combo')}
                placeholder={t('Common.Shortcut') as string}
                className="font-normal text-[14px] leading-5"
                helper={errors.combo?.message || undefined}
                error={!!errors.combo?.message}
                value={combo}
                onKeyDown={handleKeyDown}
                onKeyUp={handleKeyUp}
                onChange={() => {}}
                readOnly
              />
            </form>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t('Settings.ShortcutHelp')}
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t('Settings.ShortcutHelpDesc')}
          </p>
        </div>
        <div className="flex flex-row justify-end gap-2 dark:bg-gray-800 p-2 w-full rounded-b-lg">
          <Button variant="white" onClick={handleCancel}>
            {t('Common.Cancel')}
          </Button>
          <Button
            variant="primary"
            type="button"
            onClick={(e) => {
              e.preventDefault()
              submit({ combo })
            }}
          >
            {t('Common.Save')}
          </Button>
        </div>
      </div>
    </div>
  )
}
