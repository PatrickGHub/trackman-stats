data "aws_iam_policy_document" "lambda-role-policy" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "trackman_role" {
  name = "trackman_role"
  assume_role_policy = data.aws_iam_policy_document.lambda-role-policy.json

  inline_policy {
    name   = "trackman_role_policy"
    policy = jsonencode(
      {
        Statement = [
          {
            Action = [
              "s3:PutObject",
              "s3:GetObject"
              ]
            Effect = "Allow"
            Resource = "arn:aws:s3:::trackman-bucket/sessions.json"
          },
          {
            Action = [
              "logs:CreateLogStream",
              "logs:CreateLogGroup",
              "logs:PutLogEvents"
            ]
            Effect = "Allow"
            Resource = "*"
          }
        ]
        Version = "2012-10-17"
      }
    )
  }
}