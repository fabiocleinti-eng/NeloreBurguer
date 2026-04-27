/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GATEWAY_URL?: string;
  /** Opcional: protege a rota /admin no browser */
  readonly VITE_ADMIN_PASSWORD?: string;
  /** Opcional: exige código para entrar em /loja (partilhar link /preview?t=...) */
  readonly VITE_PREVIEW_TOKEN?: string;
  /** Duração da sessão de pré-visualização em horas (predefinição 8) */
  readonly VITE_PREVIEW_HOURS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
