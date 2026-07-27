import {
  createSessionToken,
  sessionCookieHeader,
} from "../_lib/session.js";

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const formData = await request.formData();
    const pin = formData.get("pin");
    const validPin = env.FAMILY_PIN;
    const origin = new URL(request.url).origin;

    if (!validPin) {
      console.error("CRITICAL: FAMILY_PIN environment variable is not set!");
      return Response.redirect(`${origin}/family-login?error=config`, 302);
    }

    if (!env.SESSION_SECRET) {
      console.error("CRITICAL: SESSION_SECRET environment variable is not set!");
      return Response.redirect(`${origin}/family-login?error=session`, 302);
    }

    if (pin === validPin) {
      const token = await createSessionToken(env);
      const headers = new Headers({
        Location: "/family",
        "Set-Cookie": sessionCookieHeader(token),
      });
      return new Response(null, { status: 302, headers });
    }

    return Response.redirect(`${origin}/family-login?error=1`, 302);
  } catch (err) {
    return new Response(`Error: ${err.message}`, { status: 500 });
  }
}
