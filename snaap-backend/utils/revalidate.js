// Fire-and-forget on-demand ISR trigger for the storefront.
//
// Lifted out of homepageSectionRoutes.js (P3) when product writes needed it too:
// flagging a Safaricom product left /safaricom serving a stale shelf until a
// visitor happened to load it twice after the 300s window, which reads as a
// broken feature rather than a cache.
//
// No-ops unless FRONTEND_REVALIDATE_URL and REVALIDATE_TOKEN are both set, so a
// misconfigured host degrades to the normal ISR window instead of failing the
// write. Never blocks the response and never throws into the request path.
//
// paths: array of storefront paths to refresh. Omit for the homepage.
function triggerRevalidate(paths) {
  const url = process.env.FRONTEND_REVALIDATE_URL;
  const token = process.env.REVALIDATE_TOKEN;
  if (!url || !token) return;

  const body = Array.isArray(paths) && paths.length ? { paths } : {};

  Promise.resolve()
    .then(() =>
      fetch(url, {
        method: "POST",
        headers: { "x-revalidate-token": token, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
    )
    .catch((e) => console.warn("Revalidate trigger failed:", e.message));
}

module.exports = { triggerRevalidate };
