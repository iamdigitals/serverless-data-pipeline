data "archive_file" "upload_url" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda/upload-url"
  output_path = "${path.module}/build/upload-url.zip"
  excludes    = ["package-lock.json"]
}

resource "aws_lambda_function" "upload_url" {
  function_name    = "${var.project_name}-upload-url"
  role             = aws_iam_role.upload_url.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  filename         = data.archive_file.upload_url.output_path
  source_code_hash = data.archive_file.upload_url.output_base64sha256
  timeout          = 10
  memory_size      = 128

  environment {
    variables = {
      BUCKET_NAME      = aws_s3_bucket.uploads.bucket
      MAX_UPLOAD_BYTES = var.max_upload_bytes
    }
  }
}

data "archive_file" "process" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda/process"
  output_path = "${path.module}/build/process.zip"
  excludes    = ["package-lock.json"]
}

resource "aws_lambda_function" "process" {
  function_name    = "${var.project_name}-process"
  role             = aws_iam_role.process.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  filename         = data.archive_file.process.output_path
  source_code_hash = data.archive_file.process.output_base64sha256
  timeout          = 30
  memory_size      = 256

  environment {
    variables = {
      TABLE_NAME = aws_dynamodb_table.uploads.name
    }
  }
}

data "archive_file" "status" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda/status"
  output_path = "${path.module}/build/status.zip"
  excludes    = ["package-lock.json"]
}

resource "aws_lambda_function" "status" {
  function_name    = "${var.project_name}-status"
  role             = aws_iam_role.status.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  filename         = data.archive_file.status.output_path
  source_code_hash = data.archive_file.status.output_base64sha256
  timeout          = 10
  memory_size      = 128

  environment {
    variables = {
      TABLE_NAME = aws_dynamodb_table.uploads.name
    }
  }
}

resource "aws_lambda_permission" "allow_s3" {
  statement_id  = "AllowS3Invoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.process.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.uploads.arn
}
