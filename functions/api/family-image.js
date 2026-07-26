import { AwsClient } from "aws4fetch";
import { allowlist } from "../_data/family-photos.js";
import {
  isAllowlistedFamilyPath,
  normalizeFamilyImagePath,
} from "../_lib/family-path.js";
import { verifySession } from "../_lib/session.js";

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const session = await verifySession(request, env);
  if (!session.ok) {
    return new Response("Unauthorized. Please enter the PIN first.", {
      status: 403,
    });
  }

  const imagePath = normalizeFamilyImagePath(url.searchParams.get("path"));
  if (!imagePath || !isAllowlistedFamilyPath(imagePath, allowlist)) {
    return new Response("Invalid image path.", { status: 400 });
  }

  const awsAccessKey = env.AWS_ACCESS_KEY_ID;
  const awsSecretKey = env.AWS_SECRET_ACCESS_KEY;
  const awsRegion = env.AWS_REGION || "us-west-2";
  const bucketName = env.PRIVATE_S3_BUCKET;

  if (!awsAccessKey || !awsSecretKey || !bucketName) {
    console.error("Missing AWS environment variables for private image fetching.");
    return new Response("Server configuration error.", { status: 500 });
  }

  const aws = new AwsClient({
    accessKeyId: awsAccessKey,
    secretAccessKey: awsSecretKey,
    region: awsRegion,
  });

  const s3Url = `https://${bucketName}.s3.${awsRegion}.amazonaws.com/${imagePath}`;

  try {
    const s3Response = await aws.fetch(s3Url);

    if (!s3Response.ok) {
      return new Response(
        `Error fetching image from S3: ${s3Response.statusText}`,
        { status: s3Response.status },
      );
    }

    const headers = new Headers();
    headers.set(
      "Content-Type",
      s3Response.headers.get("Content-Type") || "image/jpeg",
    );
    headers.set("Cache-Control", "private, max-age=86400");

    return new Response(s3Response.body, {
      status: 200,
      headers,
    });
  } catch (err) {
    return new Response(`Failed to fetch image: ${err.message}`, {
      status: 500,
    });
  }
}
