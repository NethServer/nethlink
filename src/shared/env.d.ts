/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEV: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
