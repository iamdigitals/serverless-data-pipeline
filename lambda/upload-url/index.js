const { S3Client } = require("@aws-sdk/client-s3");
const { createPresignedPost } = require("@aws-sdk/s3-presigned-post");
const crypto = require("crypto");

const s3 = new S3Client({});
const BUCKET = process.env.BUCKET_NAME;
const MAX_BYTES = parseInt(process.env.MAX_UPLOAD_BYTES || "5242880", 10);
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

exports.handler = async (event) => {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const contentType = body.contentType;

    if (!ALLOWED_TYPES.includes(contentType)) {
      return respond(400, {
        error: `contentType must be one of: ${ALLOWED_TYPES.join(", ")}`,
      });
    }

    const id = crypto.randomUUID();
    const ext = contentType.split("/")[1];
    const key = `incoming/${id}/original.${ext}`;

    const { url, fields } = await createPresignedPost(s3, {
      Bucket: BUCKET,
      Key: key,
      Conditions: [
        ["content-length-range", 0, MAX_BYTES],
        ["eq", "$Content-Type", contentType],
      ],
      Fields: {
        "Content-Type": contentType,
      },
      Expires: 60,
    });

    return respond(200, { id, url, fields });
  } catch (err) {
    console.error(err);
    return respond(500, { error: "Failed to create upload URL" });
  }
};

function respond(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}
