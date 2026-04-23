export async function onRequestPost(context) {
  try {
    const formData = await context.request.formData();
    const data = Object.fromEntries(formData.entries());

    console.log("Contact form submission received:", data);

    // Here you would typically integrate with an email service like Resend
    // Example: await resend.Emails.send({ ... })

    return Response.redirect(`${new URL('/thanks', context.request.url)}`, 302);
  } catch (err) {
    return new Response(`Error processing form: ${err.message}`, { status: 500 });
  }
}
