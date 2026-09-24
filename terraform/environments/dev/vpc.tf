provider "aws" {
  region = "us-east-1"
}

resource "aws_vpc" "shopkart" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = false
  instance_tenancy     = "default"

  tags = {
    Name = "shopkart-vpc"
  }
}

###subnets

resource "aws_subnet" "public_1" {
  vpc_id            = aws_vpc.shopkart.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "us-east-1a"

  tags = {
    Name = "my-public-subnet-1"
  }
}

resource "aws_subnet" "public_2" {
  vpc_id            = aws_vpc.shopkart.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "us-east-1b"

  tags = {
    Name = "my-public-subnet-2"
  }
}

resource "aws_subnet" "private_1" {
  vpc_id            = aws_vpc.shopkart.id
  cidr_block        = "10.0.11.0/24"
  availability_zone = "us-east-1a"

  tags = {
    Name = "private-subnet-1"
  }
}

resource "aws_subnet" "private_2" {
  vpc_id            = aws_vpc.shopkart.id
  cidr_block        = "10.0.12.0/24"
  availability_zone = "us-east-1b"

  tags = {
    Name = "private-subnet-2"
  }
}

####internet gateway

resource "aws_internet_gateway" "shopkart" {
  vpc_id = aws_vpc.shopkart.id

  tags = {
    Name = "shopkart-internet-gateway"
  }
}

####route tables

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.shopkart.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.shopkart.id
  }

  tags = {
    Name = "public-route-table"
  }
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.shopkart.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = "nat-03de41feb33b0f1a8"
  }

  tags = {
    Name = "private-route-table"
  }
}

resource "aws_route_table_association" "public_1" {
  subnet_id      = aws_subnet.public_1.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "public_2" {
  subnet_id      = aws_subnet.public_2.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private_1" {
  subnet_id      = aws_subnet.private_1.id
  route_table_id = aws_route_table.private.id
}

resource "aws_route_table_association" "private_2" {
  subnet_id      = aws_subnet.private_2.id
  route_table_id = aws_route_table.private.id
}

/*NAT Gateway*/

resource "aws_nat_gateway" "shopkart" {
  allocation_id = "eipalloc-0ec4c3f4ab48f4c1a"
  subnet_id     = aws_subnet.public_1.id

  tags = {
    Name = "shopkart-nat-gateway"
  }
}