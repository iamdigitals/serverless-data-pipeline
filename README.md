# Serverless Data Pipeline

A public, safely-bounded demo of an event-driven serverless pipeline: upload an image, and watch it flow through S3 → Lambda → DynamoDB in real time.

## Architecture

```
Browser
  → POST /upload-url          (Lambda signs a presigned S3 POST, validates type/size)
  → PUT directly to S3         (browser uploads straight to S3, never through Lambda)
  → S3 ObjectCreated event     (triggers processing)
  → Lambda: process            (extracts image metadata, writes DynamoDB)
  → GET /status/{id}           (Lambda reads DynamoDB, returns a presigned view URL)
```

No VPC, no NAT gateway, no servers — everything scales to zero when idle.

## Why it's safe to leave public

- **No direct write access to S3.** The browser never gets real AWS credentials — only a short-lived (60s) presigned POST scoped to one exact key, one content-type, and a hard size cap.
- **Everything expires in 24h.** Both the S3 object and its DynamoDB record auto-delete via lifecycle/TTL rules — nothing accumulates, nothing to moderate.
- **Rate-limited.** API Gateway throttles to 5 req/s sustained, burst of 10 — can't be turned into a real bill by abuse.
- **Type-checked twice.** Once client-side, once enforced server-side in the presigned POST conditions (can't be bypassed by editing the request).

## Deploying

Secrets needed in the GitHub repo (Settings → Secrets and variables → Actions):
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

Push to `main` and GitHub Actions handles the rest: installs each Lambda's dependencies, then runs `terraform apply`.

After the first successful run, grab the API endpoint:
```bash
cd terraform
terraform output api_endpoint
```

Paste that into `demo/index.html` (replace `REPLACE_WITH_API_ENDPOINT`), then deploy `demo/index.html` anywhere static (Netlify drag-and-drop works fine — no build step).

## Stack

Terraform · AWS Lambda (Node.js 20) · S3 · DynamoDB · API Gateway (HTTP API) · GitHub Actions
