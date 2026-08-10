export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Let Cloudflare-managed endpoints work normally.
    if (url.pathname.startsWith("/cdn-cgi/")) {
      return env.ASSETS.fetch(request);
    }

    // Members subdomain always serves files from /members.
    if (url.hostname === "members.ffredditch.co.uk") {
      const target = new URL(request.url);

      if (url.pathname === "/" || url.pathname === "") {
        target.pathname = "/members/";
      } else if (!url.pathname.startsWith("/members/")) {
        target.pathname = "/members" + url.pathname;
      }

      return env.ASSETS.fetch(new Request(target, request));
    }

    // Explicit public-page routes.
    // This prevents /eleven being mistaken for data/eleven.json.
    const pageRoutes = {
      "/eleven": "/eleven.html",
      "/eleven/": "/eleven.html",
      "/tnf": "/tnf.html",
      "/tnf/": "/tnf.html",
      "/community": "/community.html",
      "/community/": "/community.html",
      "/join": "/join.html",
      "/join/": "/join.html",
      "/progress": "/progress.html",
      "/progress/": "/progress.html"
    };

    if (pageRoutes[url.pathname]) {
      const target = new URL(request.url);
      target.pathname = pageRoutes[url.pathname];
      return env.ASSETS.fetch(new Request(target, request));
    }

    // Everything else (assets, JSON data, homepage, etc.) stays untouched.
    return env.ASSETS.fetch(request);
  }
};
