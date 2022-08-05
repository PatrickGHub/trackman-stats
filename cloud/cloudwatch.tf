resource "aws_cloudwatch_log_group" "trackman" {
  name = "/aws/lambda/${aws_lambda_function.trackman.function_name}"
  retention_in_days = "5"
}