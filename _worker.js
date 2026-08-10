export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Keep Cloudflare system endpoints working
    if (url.pathname.startsWith("/cdn-cgi/")) {
      return env.ASSETS.fetch(request);
    }

    // ==========================================
    // SECURE MEMBER DATA API
    // members.ffredditch.co.uk/api/me
    // ==========================================
    if (
      url.hostname === "members.ffredditch.co.uk" &&
      url.pathname === "/api/me"
    ) {
const accessJwt = request.headers.get("Cf-Access-Jwt-Assertion");
      let email = "";
      if (accessJwt) {
try {
  const payloadPart = accessJwt.split(".")[1];
  const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const payload = JSON.parse(atob(padded));
  email = payload.email || payload.sub || "";
  email = String(email).trim().toLowerCase();
  } catch (e) {
  email = "";
  }
        }
      if (!email) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Authenticated member email not found"
          }),
          {
            status: 401,
            headers: {
              "content-type": "application/json; charset=UTF-8",
              "cache-control": "no-store"
            }
          }
        );
      }

      if (!env.MEMBERS_API_URL || !env.MEMBERS_API_SECRET) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Members API is not configured"
          }),
          {
            status: 500,
            headers: {
              "content-type": "application/json; charset=UTF-8",
              "cache-control": "no-store"
            }
          }
        );
      }

const apiUrl = new URL(String(env.MEMBERS_API_URL).trim());

      try {
        const googleResponse = await fetch(
          apiUrl.toString(),
          {
            method: "POST",
            body: JSON.stringify({ email: email.trim().toLowerCase(), key: String(env.MEMBERS_API_SECRET).trim() }),
            headers: {
              "accept": "application/json",
              "content-type": "application/json"
            }
          }
        );

        const body = await googleResponse.text();

        return new Response(body, {
          status: googleResponse.ok
            ? 200
            : googleResponse.status,
          headers: {
            "content-type":
              "application/json; charset=UTF-8",
            "cache-control": "no-store"
          }
        });

      } catch (error) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Could not reach members database"
          }),
          {
            status: 502,
            headers: {
              "content-type":
                "application/json; charset=UTF-8",
              "cache-control": "no-store"
            }
          }
        );
      }
    }

    // ==========================================
    // EXISTING MEMBERS SUBDOMAIN ROUTING
    // ==========================================
      if (
  url.hostname === "members.ffredditch.co.uk" &&
  (url.pathname === "/api/rankings" || url.pathname === "/api/rankings/")
) {
  try {
    const googleResponse = await fetch(
      String(env.MEMBERS_API_URL).trim(),
      {
        method: "POST",
        body: JSON.stringify({
          action: "rankings",
          key: String(env.MEMBERS_API_SECRET).trim()
        }),
        headers: {
          "accept": "application/json",
          "content-type": "application/json"
        }
      }
    );

    const body = await googleResponse.text();

    return new Response(body, {
      status: googleResponse.ok ? 200 : googleResponse.status,
      headers: {
        "content-type": "application/json; charset=UTF-8",
        "cache-control": "no-store"
      }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Could not load rankings"
      }),
      {
        status: 502,
        headers: {
          "content-type": "application/json; charset=UTF-8",
          "cache-control": "no-store"
        }
      }
    );
  }
}
      if (
    url.hostname === "members.ffredditch.co.uk"
    ) {
      const target = new URL(request.url);

      if (
        url.pathname === "/" ||
        url.pathname === ""
      ) {
        target.pathname = "/members/";

      } else if (url.pathname.startsWith("/data/")) {
        target.pathname = url.pathname;
      } else if (
        !url.pathname.startsWith("/members/")
      ) {
        target.pathname =
          "/members" + url.pathname;
      }

      return env.ASSETS.fetch(
        new Request(target, request)
      );
    }

    // Public FF Redditch website
    return env.ASSETS.fetch(request);
  }
};
