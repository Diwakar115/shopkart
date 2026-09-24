terraform {
  backend "s3" {
    bucket       = "shopkart-terraform-state-diwakar"
    key          = "dev/terraform.tfstate"
    region       = "us-east-1"
    use_lockfile = true
    encrypt      = true
  }
}