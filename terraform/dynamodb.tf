resource "aws_dynamodb_table" "uploads" {
  name         = "${var.project_name}-uploads"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  # Matches the S3 lifecycle expiry — records disappear the same day the
  # underlying file does, so status lookups for old ids just come back empty.
  ttl {
    attribute_name = "expiresAt"
    enabled        = true
  }
}
