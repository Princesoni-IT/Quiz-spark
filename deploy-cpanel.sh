#!/bin/bash

# Quiz Spark - cPanel Deployment Script
# Author: Prince Soni
# Usage: bash deploy-cpanel.sh

echo "🚀 Quiz Spark - cPanel Deployment Script"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check if running on cPanel server
print_info "Checking environment..."

# Step 1: Backend Setup
echo ""
echo "📦 Step 1: Backend Setup"
echo "------------------------"

# Navigate to backend directory
if [ -d "backend" ]; then
    cd backend
    print_success "Backend directory found"
else
    print_error "Backend directory not found!"
    exit 1
fi

# Check for package.json
if [ ! -f "package.json" ]; then
    print_error "package.json not found!"
    exit 1
fi

# Install dependencies
print_info "Installing dependencies..."
if npm install; then
    print_success "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Check for .env file
if [ ! -f ".env" ]; then
    print_info ".env file not found. Creating from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_success ".env file created"
        print_info "Please edit .env file with your configuration"
        echo ""
        echo "Required variables:"
        echo "  - MONGO_URI"
        echo "  - JWT_SECRET"
        echo "  - GMAIL_USER"
        echo "  - GMAIL_PASS"
        echo ""
        read -p "Press Enter after editing .env file..."
    else
        print_error ".env.example not found!"
        exit 1
    fi
else
    print_success ".env file found"
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    print_info "PM2 not found. Installing PM2..."
    if npm install -g pm2; then
        print_success "PM2 installed successfully"
    else
        print_error "Failed to install PM2"
        print_info "You may need sudo access. Try: sudo npm install -g pm2"
    fi
else
    print_success "PM2 is already installed"
fi

# Start application with PM2
print_info "Starting application with PM2..."
pm2 delete quiz-spark 2>/dev/null  # Delete if already exists
if pm2 start server.js --name quiz-spark; then
    print_success "Application started successfully"
    pm2 save
    print_success "PM2 configuration saved"
else
    print_error "Failed to start application"
    exit 1
fi

# Enable PM2 startup
print_info "Enabling PM2 startup..."
pm2 startup

echo ""
print_success "Backend deployment completed!"
echo ""

# Get backend URL
read -p "Enter your backend URL (e.g., https://yourdomain.com:3000): " BACKEND_URL

# Step 2: Frontend Setup
echo ""
echo "🎨 Step 2: Frontend Setup"
echo "-------------------------"

cd ..
if [ -d "Frontend" ]; then
    cd Frontend
    print_success "Frontend directory found"
else
    print_error "Frontend directory not found!"
    exit 1
fi

# Create .env file for frontend
print_info "Creating frontend .env file..."
echo "VITE_API_URL=$BACKEND_URL" > .env
print_success "Frontend .env created with backend URL"

# Install frontend dependencies
print_info "Installing frontend dependencies..."
if npm install; then
    print_success "Frontend dependencies installed"
else
    print_error "Failed to install frontend dependencies"
    exit 1
fi

# Build frontend
print_info "Building frontend for production..."
if npm run build; then
    print_success "Frontend build completed"
    print_success "Build files are in: Frontend/dist/"
else
    print_error "Frontend build failed"
    exit 1
fi

# Create .htaccess for frontend
print_info "Creating .htaccess file..."
cat > dist/.htaccess << 'EOF'
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

<IfModule mod_headers.c>
  Header set Access-Control-Allow-Origin "*"
  Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
  Header set Access-Control-Allow-Headers "Content-Type, Authorization"
</IfModule>

<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript
</IfModule>

<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>
EOF
print_success ".htaccess file created"

echo ""
echo "=========================================="
echo "🎉 Deployment Completed Successfully!"
echo "=========================================="
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Upload Frontend files to cPanel:"
echo "   - Copy all files from: Frontend/dist/"
echo "   - To: public_html/ (or your domain folder)"
echo ""
echo "2. Check Backend Status:"
echo "   pm2 status"
echo "   pm2 logs quiz-spark"
echo ""
echo "3. Test Your Application:"
echo "   Frontend: https://yourdomain.com"
echo "   Backend: $BACKEND_URL"
echo ""
echo "4. Monitor Application:"
echo "   pm2 monit"
echo ""
echo "=========================================="
echo ""
print_info "Useful Commands:"
echo "  pm2 status              - Check application status"
echo "  pm2 logs quiz-spark     - View application logs"
echo "  pm2 restart quiz-spark  - Restart application"
echo "  pm2 stop quiz-spark     - Stop application"
echo "  pm2 delete quiz-spark   - Remove application"
echo ""
print_success "Happy Deploying! 🚀"
