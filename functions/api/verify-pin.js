export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const formData = await request.formData();
    const pin = formData.get('pin');

    // The actual PIN is stored securely in Cloudflare Environment Variables
    const validPin = env.FAMILY_PIN;

    // IMPORTANT: If you forget to set the environment variable, we deny access to be safe
    if (!validPin) {
      console.error("CRITICAL: FAMILY_PIN environment variable is not set!");
      return Response.redirect(`${new URL(request.url).origin}/family-login?error=config`, 302);
    }

    if (pin === validPin) {
      // Pin is correct!
      // We set a cookie named 'family_auth' that lasts for 30 days
      const headers = new Headers({
        'Location': '/family',
        'Set-Cookie': `family_auth=valid_session; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000` 
      });
      return new Response(null, { status: 302, headers });
    } else {
      // Pin is incorrect, redirect back to login page with an error query parameter
      return Response.redirect(`${new URL(request.url).origin}/family-login?error=1`, 302);
    }
  } catch (err) {
    return new Response(`Error: ${err.message}`, { status: 500 });
  }
}
