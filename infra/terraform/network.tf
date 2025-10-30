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

# Verificar si la ruta ya existe
locals {
  has_internet_route = length([
    for route in data.aws_route_table.main.routes :
    route if route.cidr_block == "0.0.0.0/0"
  ]) > 0
}

# Agregar ruta a Internet Gateway solo si no existe
resource "aws_route" "internet_access" {
  count = local.has_internet_route ? 0 : 1

  route_table_id         = data.aws_route_table.main.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.main.id
}
