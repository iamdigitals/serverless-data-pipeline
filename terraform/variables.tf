variable "project_name" {
  description = "Short name used to prefix all resources"
  type        = string
  default     = "sdp-demo"
}

variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "us-east-1"
}

variable "allowed_origin" {
  description = "Origin allowed to call the API from a browser — set to your portfolio domain once known"
  type        = string
  default     = "*"
}

variable "max_upload_bytes" {
  description = "Maximum accepted upload size in bytes"
  type        = number
  default     = 5242880 # 5 MB
}
