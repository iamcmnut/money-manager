/// <reference types="@cloudflare/workers-types" />

declare global {
  interface CloudflareEnv {
    DB: D1Database;
    FEATURE_FLAGS: KVNamespace;
    ENVIRONMENT: string;
  }
}

export {};
