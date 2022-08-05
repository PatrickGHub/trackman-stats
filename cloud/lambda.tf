data "archive_file" "trackman" {
  type        = "zip"
  source_dir  = "trackman"
  output_path = "trackman.zip"
}

resource "aws_lambda_function" "trackman" {
  function_name = "trackman"
  runtime = "nodejs16.x"
  role = aws_iam_role.trackman_role.arn

  source_code_hash = data.archive_file.trackman.output_base64sha256
  filename = data.archive_file.trackman.output_path
  handler = "index.handler"
  timeout = 60
}