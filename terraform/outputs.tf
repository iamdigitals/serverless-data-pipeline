output "api_endpoint" {
  description = "Base URL for the API — use this in the demo page"
  value       = aws_apigatewayv2_api.main.api_endpoint
}

output "uploads_bucket" {
  value = aws_s3_bucket.uploads.bucket
}

output "dynamodb_table" {
  value = aws_dynamodb_table.uploads.name
}
