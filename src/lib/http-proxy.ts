import { setGlobalDispatcher, ProxyAgent } from "undici";

// Node's built-in fetch (undici) ignores HTTPS_PROXY/HTTP_PROXY by default.
// When a proxy is configured in the environment (corporate egress, sandboxed
// deploys, CI), route outbound job-source requests through it. No-ops when no
// proxy is set, so normal deployments are unaffected.
let configured = false;

export function ensureProxy(): void {
  if (configured) return;
  configured = true;
  const proxy =
    process.env.HTTPS_PROXY ||
    process.env.https_proxy ||
    process.env.HTTP_PROXY ||
    process.env.http_proxy;
  if (!proxy) return;
  try {
    setGlobalDispatcher(new ProxyAgent(proxy));
  } catch (e) {
    console.error("[http-proxy] failed to install proxy dispatcher:", e);
  }
}
