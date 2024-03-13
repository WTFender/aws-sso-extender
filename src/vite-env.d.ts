/* eslint-disable no-unused-vars */
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_EXT_ID: string
  readonly VITE_EXT_NAME: string
  readonly VITE_EXT_SHORT_NAME: string
  readonly VITE_EXT_DEBUG: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
