resource "aws_security_group" "web" {
  name        = "shopkart-web-sg"
  description = "security group for shopkart web traffic"
  vpc_id      = aws_vpc.shopkart.id

  tags = {
    Name = "web-sg"
  }
}

resource "aws_security_group" "app" {
  name        = "shopkart-app-sg"
  description = "sg for shopkart application severs"
  vpc_id      = aws_vpc.shopkart.id

  tags = {
    Name = "app-sg"
  }
}

resource "aws_security_group" "db" {
  name        = "shopkart-DB-sg"
  description = "sg for shopkart RDS"
  vpc_id      = aws_vpc.shopkart.id

  tags = {
    Name = "DB-sg"
  }
}



resource "aws_vpc_security_group_ingress_rule" "web_https" {
  security_group_id = aws_security_group.web.id

  cidr_ipv4   = "0.0.0.0/0"
  from_port   = 443
  to_port     = 443
  ip_protocol = "tcp"

  description = "secure web traffic"
}

resource "aws_vpc_security_group_ingress_rule" "web_http" {
  security_group_id = aws_security_group.web.id

  cidr_ipv4   = "0.0.0.0/0"
  from_port   = 80
  to_port     = 80
  ip_protocol = "tcp"

  description = "web traffic"
}

resource "aws_vpc_security_group_ingress_rule" "web_ssh" {
  security_group_id = aws_security_group.web.id

  cidr_ipv4   = "223.185.132.17/32"
  from_port   = 22
  to_port     = 22
  ip_protocol = "tcp"

  description = "administration"
}



resource "aws_vpc_security_group_ingress_rule" "app_ssh" {
  security_group_id = aws_security_group.app.id

  referenced_security_group_id = aws_security_group.web.id

  from_port   = 22
  to_port     = 22
  ip_protocol = "tcp"

  description = "SSH from web servers"
}


resource "aws_vpc_security_group_ingress_rule" "db_mysql" {
  security_group_id = aws_security_group.db.id

  referenced_security_group_id = aws_security_group.app.id

  from_port   = 3306
  to_port     = 3306
  ip_protocol = "tcp"

  description = "shopkart app db"
}