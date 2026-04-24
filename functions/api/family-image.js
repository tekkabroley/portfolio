import { AwsClient } from 'aws4fetch';

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // 1. Check for authentication cookie
  const cookieString = request.headers.get('Cookie') || '';
  const cookies = {};
  cookieString.split(';').forEach(cookie => {
    const [name, value] = cookie.split('=').map(c => c.trim());
    if (name) {
      cookies[name] = value;
    }
  });

  if (cookies['family_auth'] !== 'valid_session') {
    return new Response('Unauthorized. Please enter the PIN first.', { status: 403 });
  }

  // 2. Get the requested image path from the query string (e.g., ?path=beach-trip/photo1.jpg)
  const imagePath = url.searchParams.get('path');
  if (!imagePath) {
    return new Response('Missing "path" query parameter.', { status: 400 });
  }

  // 3. Setup AWS configuration from Environment Variables
  const awsAccessKey = env.AWS_ACCESS_KEY_ID;
  const awsSecretKey = env.AWS_SECRET_ACCESS_KEY;
  const awsRegion = env.AWS_REGION || 'us-west-2'; // Defaulting to your public bucket's region
  const bucketName = env.PRIVATE_S3_BUCKET;

  if (!awsAccessKey || !awsSecretKey || !bucketName) {
    console.error('Missing AWS environment variables for private image fetching.');
    return new Response('Server configuration error.', { status: 500 });
  }

  // 4. Use aws4fetch to sign the request to the private S3 bucket
  const aws = new AwsClient({
    accessKeyId: awsAccessKey,
    secretAccessKey: awsSecretKey,
    region: awsRegion,
  });

  // Construct the S3 URL
  const s3Url = `https://${bucketName}.s3.${awsRegion}.amazonaws.com/${imagePath}`;

  try {
    // 5. Fetch the image from S3
    const s3Response = await aws.fetch(s3Url);

    // If S3 returns an error (e.g., 404 Not Found, 403 Forbidden because of bad keys)
    if (!s3Response.ok) {
      return new Response(`Error fetching image from S3: ${s3Response.statusText}`, { 
        status: s3Response.status 
      });
    }

    // 6. Stream the image back to the browser, keeping the original content-type
    const headers = new Headers();
    headers.set('Content-Type', s3Response.headers.get('Content-Type') || 'image/jpeg');
    headers.set('Cache-Control', 'private, max-age=86400'); // Cache privately in browser for 1 day

    return new Response(s3Response.body, {
      status: 200,
      headers: headers
    });

  } catch (err) {
    return new Response(`Failed to fetch image: ${err.message}`, { status: 500 });
  }
}
