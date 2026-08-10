export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/cdn-cgi/")) {
      return env.ASSETS.fetch(request);
    }

    if (url.hostname === "members.ffredditch.co.uk") {
      const target = new URL(request.url);

      if (url.pathname === "/" || url.pathname === "") {
        target.pathname = "/members/";
      } else if (!url.pathname.startsWith("/members/")) {
        target.pathname = "/members" + url.pathname;
      }

      return env.ASSETS.fetch(new Request(target, request));
    }

    return env.ASSETS.fetch(request);
  }
};
