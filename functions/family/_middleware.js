export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);

  // Parse cookies from the request headers
  const cookieString = request.headers.get('Cookie') || '';
  const cookies = {};
  cookieString.split(';').forEach(cookie => {
    const [name, value] = cookie.split('=').map(c => c.trim());
    if (name) {
      cookies[name] = value;
    }
  });

  // Check if the user has our valid authentication cookie
  if (cookies['family_auth'] === 'valid_session') {
    // If they have the cookie, let them see the family page
    return next();
  }

  // If no cookie or invalid, redirect them to the login page
  return Response.redirect(`${url.origin}/family-login`, 302);
}
