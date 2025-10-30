# Internet Gateway para la VPC
resource "aws_internet_gateway" "main" {
  vpc_id = data.aws_vpc.default.id

  tags = {
    Name      = "${var.app_name}-igw"
    ManagedBy = "terraform"
  }
}

# Obtener la route table principal de la VPC
data "aws_route_table" "main" {
  vpc_id = data.aws_vpc.default.id
  filter {
    name   = "association.main"
    values = ["true"]
  }
}

# Agregar ruta a Internet Gateway
resource "aws_route" "internet_access" {
  route_table_id         = data.aws_route_table.main.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.main.id
}
