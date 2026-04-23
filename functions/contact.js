export async function onRequestPost(context) {
  const { request, env } = context;

  // 1. Parse the form data from your Astro page
  const formData = await request.formData();
  const name = formData.get('name');
  const email = formData.get('email');
  const message = formData.get('message');

  // 2. Send the data to Resend's API
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      // IMPORTANT: Without a custom domain, you MUST use this 'from' address
      from: 'Contact Form <onboarding@resend.dev>',
      // IMPORTANT: This must be the email address you used to sign up for Resend
      to: 'alex.broley@gmail.com',
      subject: `New Portfolio Message from ${name}`,
      html: `
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Reply-To:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    }),
  });

  if (res.ok) {
    // 3. Success! Redirect to your thanks page
    return Response.redirect(`${new URL(request.url).origin}/thanks`, 303);
  } else {
    // Log error for debugging in Cloudflare dashboard
    const error = await res.text();
    console.error("Resend Error:", error);
    return new Response('Failed to send message. Please try again later.', { status: 500 });
  }
}