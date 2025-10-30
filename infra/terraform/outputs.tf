output "instance_id" {
  description = "ID of the EC2 instance"
  value       = aws_instance.frontend.id
}

output "instance_public_ip" {
  description = "Public IP of the EC2 instance"
  value       = aws_instance.frontend.public_ip
}

output "instance_public_dns" {
  description = "Public DNS of the EC2 instance"
  value       = aws_instance.frontend.public_dns
}

output "application_url" {
  description = "URL to access the application"
  value       = "http://${aws_instance.frontend.public_ip}"
}

output "secrets_manager_secret_arn" {
  description = "ARN of the Secrets Manager secret"
  value       = aws_secretsmanager_secret.app_secrets.arn
}

output "security_group_id" {
  description = "ID of the security group"
  value       = aws_security_group.frontend_ec2.id
}
