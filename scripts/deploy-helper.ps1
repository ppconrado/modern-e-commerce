# Production Deployment Helper Script (PowerShell)
# This script helps with common deployment tasks

$ErrorActionPreference = "Stop"

Write-Host "🚀 E-Commerce Production Deployment Helper" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

function Print-Success {
    param($Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Print-Warning {
    param($Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

function Print-Error {
    param($Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

# Menu
Write-Host "Select an option:"
Write-Host "1. Prepare for deployment (update package.json)"
Write-Host "2. Test build locally"
Write-Host "3. Run production migrations (requires .env.production)"
Write-Host "4. Seed production database (requires .env.production)"
Write-Host "5. Generate secure AUTH_SECRET"
Write-Host "6. Verify environment variables"
Write-Host "7. Exit"
Write-Host ""

$option = Read-Host "Enter option (1-7)"

switch ($option) {
    "1" {
        Write-Host ""
        Print-Warning "Checking package.json scripts..."
        
        $packageJson = Get-Content package.json -Raw | ConvertFrom-Json
        
        if ($packageJson.scripts.postinstall) {
            Print-Success "package.json already configured for production"
        } else {
            Print-Warning "Please add to package.json scripts:"
            Write-Host '  "postinstall": "prisma generate"' -ForegroundColor Cyan
        }
    }
    
    "2" {
        Write-Host ""
        Print-Warning "Testing production build..."
        
        try {
            npm run build
            Print-Success "Build successful! Ready for deployment."
            Write-Host ""
            Print-Warning "To test the production build locally:"
            Write-Host "  npm run start" -ForegroundColor Cyan
        } catch {
            Print-Error "Build failed. Fix errors before deploying."
        }
    }
    
    "3" {
        Write-Host ""
        if (-not (Test-Path .env.production)) {
            Print-Error ".env.production not found!"
            Print-Warning "Copy .env.production.example and configure it first."
            exit 1
        }
        
        Print-Warning "Running production migrations..."
        
        # Load .env.production
        Get-Content .env.production | ForEach-Object {
            if ($_ -match '^([^=]+)=(.*)$') {
                $name = $matches[1]
                $value = $matches[2]
                [Environment]::SetEnvironmentVariable($name, $value, "Process")
            }
        }
        
        try {
            npx prisma migrate deploy
            Print-Success "Migrations completed successfully!"
        } catch {
            Print-Error "Migration failed!"
        }
    }
    
    "4" {
        Write-Host ""
        if (-not (Test-Path .env.production)) {
            Print-Error ".env.production not found!"
            Print-Warning "Copy .env.production.example and configure it first."
            exit 1
        }
        
        $confirm = Read-Host "Are you sure you want to seed production database? (y/n)"
        
        if ($confirm -eq "y") {
            Print-Warning "Seeding production database..."
            
            # Load .env.production
            Get-Content .env.production | ForEach-Object {
                if ($_ -match '^([^=]+)=(.*)$') {
                    $name = $matches[1]
                    $value = $matches[2]
                    [Environment]::SetEnvironmentVariable($name, $value, "Process")
                }
            }
            
            try {
                npm run db:seed
                Print-Success "Database seeded successfully!"
            } catch {
                Print-Error "Seeding failed!"
            }
        } else {
            Print-Warning "Seeding cancelled."
        }
    }
    
    "5" {
        Write-Host ""
        Print-Warning "Generating secure AUTH_SECRET..."
        
        # Generate random base64 string
        $bytes = New-Object byte[] 32
        $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
        $rng.GetBytes($bytes)
        $secret = [Convert]::ToBase64String($bytes)
        
        Write-Host ""
        Print-Success "Generated AUTH_SECRET:"
        Write-Host $secret -ForegroundColor Cyan
        Write-Host ""
        Print-Warning "Add this to your Vercel environment variables:"
        Write-Host "  AUTH_SECRET=$secret" -ForegroundColor Cyan
    }
    
    "6" {
        Write-Host ""
        Print-Warning "Checking required environment variables..."
        
        $requiredVars = @(
            "DATABASE_URL",
            "AUTH_SECRET",
            "NEXTAUTH_URL",
            "CLOUDINARY_CLOUD_NAME",
            "CLOUDINARY_API_KEY",
            "CLOUDINARY_API_SECRET"
        )
        
        $missing = 0
        
        if (Test-Path .env.production) {
            # Load environment variables
            $envVars = @{}
            Get-Content .env.production | ForEach-Object {
                if ($_ -match '^([^=]+)=(.*)$') {
                    $envVars[$matches[1]] = $matches[2]
                }
            }
            
            foreach ($var in $requiredVars) {
                if ($envVars[$var]) {
                    Print-Success "$var is set"
                } else {
                    Print-Error "$var is not set"
                    $missing++
                }
            }
            
            if ($missing -eq 0) {
                Print-Success "All required variables are configured!"
            } else {
                Print-Error "$missing required variable(s) missing"
            }
        } else {
            Print-Error ".env.production not found!"
            Print-Warning "Copy .env.production.example and configure it first."
        }
    }
    
    "7" {
        Print-Warning "Exiting..."
        exit 0
    }
    
    default {
        Print-Error "Invalid option"
        exit 1
    }
}

Write-Host ""
Print-Success "Done!"
