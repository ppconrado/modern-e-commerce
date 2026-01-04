#!/bin/bash

# Production Deployment Helper Script
# This script helps with common deployment tasks

set -e

echo "🚀 E-Commerce Production Deployment Helper"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored messages
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Menu
echo "Select an option:"
echo "1. Prepare for deployment (update package.json)"
echo "2. Test build locally"
echo "3. Run production migrations (requires .env.production)"
echo "4. Seed production database (requires .env.production)"
echo "5. Generate secure AUTH_SECRET"
echo "6. Verify environment variables"
echo "7. Exit"
echo ""

read -p "Enter option (1-7): " option

case $option in
    1)
        echo ""
        print_warning "Checking package.json scripts..."
        
        # Check if postinstall exists
        if grep -q '"postinstall"' package.json; then
            print_success "package.json already configured for production"
        else
            print_warning "Adding postinstall script..."
            # This would require jq or manual editing
            print_warning "Please manually add to package.json:"
            echo "  \"postinstall\": \"prisma generate\""
        fi
        ;;
        
    2)
        echo ""
        print_warning "Testing production build..."
        npm run build
        
        if [ $? -eq 0 ]; then
            print_success "Build successful! Ready for deployment."
            echo ""
            print_warning "To test the production build locally:"
            echo "  npm run start"
        else
            print_error "Build failed. Fix errors before deploying."
        fi
        ;;
        
    3)
        echo ""
        if [ ! -f .env.production ]; then
            print_error ".env.production not found!"
            print_warning "Copy .env.production.example and configure it first."
            exit 1
        fi
        
        print_warning "Running production migrations..."
        export $(cat .env.production | xargs)
        npx prisma migrate deploy
        
        if [ $? -eq 0 ]; then
            print_success "Migrations completed successfully!"
        else
            print_error "Migration failed!"
        fi
        ;;
        
    4)
        echo ""
        if [ ! -f .env.production ]; then
            print_error ".env.production not found!"
            print_warning "Copy .env.production.example and configure it first."
            exit 1
        fi
        
        read -p "Are you sure you want to seed production database? (y/n): " confirm
        if [ "$confirm" = "y" ]; then
            print_warning "Seeding production database..."
            export $(cat .env.production | xargs)
            npm run db:seed
            
            if [ $? -eq 0 ]; then
                print_success "Database seeded successfully!"
            else
                print_error "Seeding failed!"
            fi
        else
            print_warning "Seeding cancelled."
        fi
        ;;
        
    5)
        echo ""
        print_warning "Generating secure AUTH_SECRET..."
        secret=$(openssl rand -base64 32)
        echo ""
        print_success "Generated AUTH_SECRET:"
        echo "$secret"
        echo ""
        print_warning "Add this to your Vercel environment variables:"
        echo "  AUTH_SECRET=$secret"
        ;;
        
    6)
        echo ""
        print_warning "Checking required environment variables..."
        
        required_vars=(
            "DATABASE_URL"
            "AUTH_SECRET"
            "NEXTAUTH_URL"
            "CLOUDINARY_CLOUD_NAME"
            "CLOUDINARY_API_KEY"
            "CLOUDINARY_API_SECRET"
        )
        
        missing=0
        
        if [ -f .env.production ]; then
            source .env.production
            
            for var in "${required_vars[@]}"; do
                if [ -z "${!var}" ]; then
                    print_error "$var is not set"
                    missing=$((missing + 1))
                else
                    print_success "$var is set"
                fi
            done
            
            if [ $missing -eq 0 ]; then
                print_success "All required variables are configured!"
            else
                print_error "$missing required variable(s) missing"
            fi
        else
            print_error ".env.production not found!"
            print_warning "Copy .env.production.example and configure it first."
        fi
        ;;
        
    7)
        print_warning "Exiting..."
        exit 0
        ;;
        
    *)
        print_error "Invalid option"
        exit 1
        ;;
esac

echo ""
print_success "Done!"
