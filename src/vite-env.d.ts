/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ATTENDANCE_API_URL?: string;
  readonly VITE_USE_MOCK_API?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
