resource "aws_db_subnet_group" "shopkart" {
  name = "subnet-shopkart-db"
  subnet_ids = [
    aws_subnet.private_1.id,
    aws_subnet.private_2.id
  ]

  tags = {
    Name = "shopkart-db-subnet-group"
  }
}


resource "aws_db_instance" "shopkart" {
  identifier = "shopkart-database"

  engine         = "mysql"
  engine_version = "8.4.9"

  instance_class    = "db.t4g.micro"
  allocated_storage = 20
  storage_type      = "gp2"

  max_allocated_storage = 1000

  username = var.db_username
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.shopkart.name
  vpc_security_group_ids = [aws_security_group.db.id]

  publicly_accessible = false

  storage_encrypted = true

  backup_retention_period = 1

  multi_az = false

  auto_minor_version_upgrade = true
  copy_tags_to_snapshot      = true

  deletion_protection = false

  skip_final_snapshot = true

  lifecycle {
    prevent_destroy = true

    ignore_changes = [
      username,
      password,
      apply_immediately
    ]
  }
}