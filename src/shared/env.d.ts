/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEV: string
  readonly VITE_DEVTOOLS: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
