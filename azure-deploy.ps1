# Azure Static Web Apps Deployment Script
# Run this in PowerShell after installing Azure CLI

# Login to Azure
Write-Host "Logging into Azure..." -ForegroundColor Cyan
az login

# Set variables
$resourceGroup = "batten-scheduler-rg"
$appName = "uva-batten-scheduler"
$location = "eastus2"
$githubRepo = "https://github.com/behartless67-a11y/uva-batten-course-scheduler"

# Create resource group
Write-Host "Creating resource group..." -ForegroundColor Cyan
az group create --name $resourceGroup --location $location

# Create Static Web App
Write-Host "Creating Static Web App..." -ForegroundColor Cyan
az staticwebapp create `
  --name $appName `
  --resource-group $resourceGroup `
  --source $githubRepo `
  --location $location `
  --branch main `
  --app-location "/" `
  --output-location "out" `
  --login-with-github

Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host "Your app will be available at: https://$appName.azurestaticapps.net" -ForegroundColor Yellow
