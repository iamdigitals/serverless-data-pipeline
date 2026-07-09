const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand } = require("@aws-sdk/lib-dynamodb");

const s3 = new S3Client({});
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.TABLE_NAME;

exports.handler = async (event) => {
  const id = event.pathParameters && event.pathParameters.id;
  if (!id) return respond(400, { error: "Missing id" });

  const result = await ddb.send(new GetCommand({ TableName: TABLE, Key: { id } }));

  // No record yet almost always means the S3 event hasn't fired/finished —
  // treat it as still processing rather than a hard error.
  if (!result.Item) {
    return respond(200, { id, status: "processing" });
  }

  const item = result.Item;

  if (item.status === "completed") {
    const viewUrl = await getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: item.bucket, Key: item.key }),
      { expiresIn: 300 }
    );
    return respond(200, {
      id,
      status: "completed",
      width: item.width,
      height: item.height,
      format: item.format,
      contentLength: item.contentLength,
      contentType: item.contentType,
      viewUrl,
    });
  }

  if (item.status === "failed") {
    return respond(200, { id, status: "failed", error: item.errorMessage });
  }

  return respond(200, { id, status: "processing" });
};

function respond(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}
