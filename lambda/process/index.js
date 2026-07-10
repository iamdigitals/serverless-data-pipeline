const { S3Client, GetObjectCommand, HeadObjectCommand } = require("@aws-sdk/client-s3");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { imageSize } = require("image-size");

const s3 = new S3Client({});
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.TABLE_NAME;
const TTL_SECONDS = 60 * 60 * 24; // 24h, matches the S3 lifecycle expiry

exports.handler = async (event) => {
  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));
    const match = key.match(/^incoming\/([^/]+)\//);
    if (!match) continue;
    const id = match[1];

    try {
      const head = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
      const obj = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));

      const chunks = [];
      for await (const chunk of obj.Body) chunks.push(chunk);
      const buffer = Buffer.concat(chunks);

      let dimensions = { width: null, height: null, format: null };
      try {
        const size = imageSize(buffer);
        dimensions = { width: size.width, height: size.height, format: size.type };
      } catch (e) {
        console.warn("Could not read image dimensions:", e.message);
      }

      await ddb.send(
        new UpdateCommand({
          TableName: TABLE,
          Key: { id },
          UpdateExpression:
            "SET #status = :status, #bucket = :bucket, #key = :key, contentLength = :len, contentType = :type, width = :w, height = :h, #fmt = :fmt, processedAt = :now, expiresAt = :exp",
          ExpressionAttributeNames: { "#status": "status", "#bucket": "bucket", "#key": "key", "#fmt": "format" },
          ExpressionAttributeValues: {
            ":status": "completed",
            ":bucket": bucket,
            ":key": key,
            ":len": head.ContentLength,
            ":type": head.ContentType,
            ":w": dimensions.width,
            ":h": dimensions.height,
            ":fmt": dimensions.format,
            ":now": new Date().toISOString(),
            ":exp": Math.floor(Date.now() / 1000) + TTL_SECONDS,
          },
        })
      );
    } catch (err) {
      console.error("Processing failed for", id, err);
      await ddb.send(
        new UpdateCommand({
          TableName: TABLE,
          Key: { id },
          UpdateExpression: "SET #status = :status, errorMessage = :err, expiresAt = :exp",
          ExpressionAttributeNames: { "#status": "status" },
          ExpressionAttributeValues: {
            ":status": "failed",
            ":err": String(err.message || err),
            ":exp": Math.floor(Date.now() / 1000) + TTL_SECONDS,
          },
        })
      );
    }
  }
};
