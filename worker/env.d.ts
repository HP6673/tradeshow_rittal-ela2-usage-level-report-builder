// Extends the ambient `cloudflare:workers` Env with the optional D1 binding
// declared in .openai/hosting.json. Keep in sync with worker/index.ts's Env.
declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
  }
}
