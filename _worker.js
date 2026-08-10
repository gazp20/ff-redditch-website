export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Let Cloudflare-managed endpoints work normally.
    if (url.pathname.startsWith("/cdn-cgi/")) {
      return env.ASSETS.fetch(request);
    }

    // Members subdomain: serve from /members.
    if (url.hostname === "members.ffredditch.co.uk") {
      const target = new URL(request.url);

      if (url.pathname === "/" || url.pathname === "") {
        target.pathname = "/members/";
      } else if (!url.pathname.startsWith("/members/")) {
        target.pathname = "/members" + url.pathname;
      }

      return env.ASSETS.fetch(new Request(target, request));
    }

    // HARD redirects for clean public page URLs.
    // This avoids any collision with data/eleven.json.
    const redirects = {
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

    if (redirects[url.pathname]) {
      return Response.redirect(
        `${url.protocol}//${url.host}${redirects[url.pathname]}`,
        302
      );
    }

    return env.ASSETS.fetch(request);
  }
};
