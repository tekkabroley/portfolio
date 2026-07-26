import { verifySession } from "../_lib/session.js";

export async function onRequest(context) {
  const { request, next, env } = context;
  const url = new URL(request.url);
  const session = await verifySession(request, env);

  if (session.ok) {
    return next();
  }

  return Response.redirect(`${url.origin}/family-login`, 302);
}
