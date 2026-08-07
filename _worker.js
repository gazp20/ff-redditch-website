
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.hostname === "members.ffredditch.co.uk" && (url.pathname === "/" || url.pathname === "")) {
      return env.ASSETS.fetch(new URL("/members/", request.url));
    }

    return env.ASSETS.fetch(request);
  }
};
