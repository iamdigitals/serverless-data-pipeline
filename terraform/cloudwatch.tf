resource "aws_cloudwatch_log_group" "upload_url" {
  name              = "/aws/lambda/${aws_lambda_function.upload_url.function_name}"
  retention_in_days = 3
}

resource "aws_cloudwatch_log_group" "process" {
  name              = "/aws/lambda/${aws_lambda_function.process.function_name}"
  retention_in_days = 3
}

resource "aws_cloudwatch_log_group" "status" {
  name              = "/aws/lambda/${aws_lambda_function.status.function_name}"
  retention_in_days = 3
}
