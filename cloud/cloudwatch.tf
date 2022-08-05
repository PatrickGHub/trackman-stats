resource "aws_cloudwatch_log_group" "scraper_lambda" {
  name = "/aws/lambda/${aws_lambda_function.scraper_lambda.function_name}"
  retention_in_days = "5"
}