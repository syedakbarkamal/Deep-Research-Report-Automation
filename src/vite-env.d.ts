/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// types/google.d.ts
declare namespace google {
  namespace accounts {
    namespace oauth2 {
      interface TokenClient {
        callback: (tokenResponse: TokenResponse) => void;
        requestAccessToken(): void;
      }

      interface TokenResponse {
        access_token: string;
        error?: string;
        expires_in?: number;
        scope?: string;
        token_type?: string;
      }

      function initTokenClient(config: {
        client_id: string;
        scope: string;
        callback: (tokenResponse: TokenResponse) => void;
      }): TokenClient;

      function revoke(token: string, callback: () => void): void;
    }
  }
}