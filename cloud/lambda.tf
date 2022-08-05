data "archive_file" "scraper_lambda" {
  type        = "zip"
  source_dir  = "scraper_lambda"
  output_path = "scraper_lambda.zip"
}

resource "aws_lambda_function" "scraper_lambda" {
  function_name = "scraper_lambda"
  runtime = "nodejs16.x"
  role = aws_iam_role.scraper_lambda_role.arn

  source_code_hash = data.archive_file.scraper_lambda.output_base64sha256
  filename = data.archive_file.scraper_lambda.output_path
  handler = "index.handler"
  timeout = 60
}