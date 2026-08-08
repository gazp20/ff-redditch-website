export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Cloudflare-managed endpoints (including Access logout) must not be
    // rewritten into the /members directory.
    if (url.pathname.startsWith("/cdn-cgi/")) {
      return env.ASSETS.fetch(request);
    }

    // The members subdomain is backed by files stored inside /members
    // in the Pages project. Rewrite members-subdomain requests there.
    if (url.hostname === "members.ffredditch.co.uk") {
      const target = new URL(request.url);

      if (url.pathname === "/" || url.pathname === "") {
        target.pathname = "/members/";
      } else if (!url.pathname.startsWith("/members/")) {
        target.pathname = "/members" + url.pathname;
      }

      return env.ASSETS.fetch(new Request(target, request));
    }

    // Public website remains unchanged.
    return env.ASSETS.fetch(request);
  }
};
