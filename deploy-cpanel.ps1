# Quiz Spark - cPanel Deployment Script (PowerShell)
# Author: Prince Soni
# Usage: .\deploy-cpanel.ps1

Write-Host "🚀 Quiz Spark - cPanel Deployment Script" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Function to print colored output
function Print-Success {
    param($Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Print-Error {
    param($Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Print-Info {
    param($Message)
    Write-Host "ℹ $Message" -ForegroundColor Yellow
}

# Get script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Step 1: Backend Setup
Write-Host ""
Write-Host "📦 Step 1: Backend Setup" -ForegroundColor Cyan
Write-Host "------------------------" -ForegroundColor Cyan

$BackendDir = Join-Path $ScriptDir "backend"
if (Test-Path $BackendDir) {
    Set-Location $BackendDir
    Print-Success "Backend directory found"
} else {
    Print-Error "Backend directory not found!"
    exit 1
}

# Check for package.json
if (-not (Test-Path "package.json")) {
    Print-Error "package.json not found!"
    exit 1
}

# Install dependencies
Print-Info "Installing backend dependencies..."
try {
    npm install
    Print-Success "Backend dependencies installed successfully"
} catch {
    Print-Error "Failed to install backend dependencies"
    exit 1
}

# Check for .env file
if (-not (Test-Path ".env")) {
    Print-Info ".env file not found. Creating from .env.example..."
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Print-Success ".env file created"
        Print-Info "Please edit .env file with your configuration"
        Write-Host ""
        Write-Host "Required variables:" -ForegroundColor Yellow
        Write-Host "  - MONGO_URI" -ForegroundColor White
        Write-Host "  - JWT_SECRET" -ForegroundColor White
        Write-Host "  - GMAIL_USER" -ForegroundColor White
        Write-Host "  - GMAIL_PASS" -ForegroundColor White
        Write-Host ""
        
        # Open .env file in notepad
        Print-Info "Opening .env file in notepad..."
        Start-Process notepad.exe ".env"
        
        Read-Host "Press Enter after editing .env file"
    } else {
        Print-Error ".env.example not found!"
        exit 1
    }
} else {
    Print-Success ".env file found"
}

# Create backend.zip for upload
Print-Info "Creating backend.zip for upload to cPanel..."
$BackendZip = Join-Path $ScriptDir "backend-deploy.zip"
if (Test-Path $BackendZip) {
    Remove-Item $BackendZip -Force
}

# Files to include in zip
$FilesToZip = @(
    "server.js",
    "emailService.js",
    "package.json",
    "package-lock.json",
    ".env"
)

# Create zip using PowerShell
Compress-Archive -Path $FilesToZip -DestinationPath $BackendZip -Force
Print-Success "backend-deploy.zip created at: $BackendZip"

Write-Host ""
Print-Success "Backend preparation completed!"

# Step 2: Frontend Setup
Write-Host ""
Write-Host "🎨 Step 2: Frontend Setup" -ForegroundColor Cyan
Write-Host "-------------------------" -ForegroundColor Cyan

Set-Location $ScriptDir
$FrontendDir = Join-Path $ScriptDir "Frontend"
if (Test-Path $FrontendDir) {
    Set-Location $FrontendDir
    Print-Success "Frontend directory found"
} else {
    Print-Error "Frontend directory not found!"
    exit 1
}

# Get backend URL from user
Write-Host ""
$BackendURL = Read-Host "Enter your backend URL (e.g., https://yourdomain.com:3000)"

# Create .env file for frontend
Print-Info "Creating frontend .env file..."
"VITE_API_URL=$BackendURL" | Out-File -FilePath ".env" -Encoding UTF8
Print-Success "Frontend .env created with backend URL"

# Install frontend dependencies
Print-Info "Installing frontend dependencies..."
try {
    npm install
    Print-Success "Frontend dependencies installed"
} catch {
    Print-Error "Failed to install frontend dependencies"
    exit 1
}

# Build frontend
Print-Info "Building frontend for production..."
try {
    npm run build
    Print-Success "Frontend build completed"
} catch {
    Print-Error "Frontend build failed"
    exit 1
}

# Create .htaccess for frontend
Print-Info "Creating .htaccess file..."
$HtaccessContent = @"
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
"@

$HtaccessPath = Join-Path "dist" ".htaccess"
$HtaccessContent | Out-File -FilePath $HtaccessPath -Encoding UTF8
Print-Success ".htaccess file created"

# Create frontend.zip for upload
Print-Info "Creating frontend-deploy.zip for upload to cPanel..."
$FrontendZip = Join-Path $ScriptDir "frontend-deploy.zip"
if (Test-Path $FrontendZip) {
    Remove-Item $FrontendZip -Force
}

$DistPath = Join-Path $FrontendDir "dist\*"
Compress-Archive -Path $DistPath -DestinationPath $FrontendZip -Force
Print-Success "frontend-deploy.zip created at: $FrontendZip"

# Create deployment instructions
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "🎉 Build Completed Successfully!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$InstructionsFile = Join-Path $ScriptDir "DEPLOYMENT_INSTRUCTIONS.txt"
$Instructions = @"
Quiz Spark - cPanel Deployment Instructions
============================================

✅ Build completed successfully!

📦 Files Created:
1. backend-deploy.zip  - Backend files
2. frontend-deploy.zip - Frontend files

📋 Deployment Steps:

STEP 1: Upload Backend to cPanel
---------------------------------
1. Login to cPanel
2. Go to File Manager
3. Navigate to public_html/
4. Create folder: quiz-spark-backend
5. Upload backend-deploy.zip to this folder
6. Extract the zip file
7. Delete the zip file after extraction

STEP 2: Setup Node.js Application
----------------------------------
1. In cPanel, go to "Setup Node.js App"
2. Click "Create Application"
3. Configuration:
   - Node.js Version: 18.x or higher
   - Application Mode: Production
   - Application Root: quiz-spark-backend
   - Application URL: yourdomain.com/api
   - Application Startup File: server.js
4. Click "Create"
5. Click "Run NPM Install"
6. Click "Start Application"

STEP 3: Upload Frontend to cPanel
----------------------------------
1. In File Manager, go to public_html/
2. Upload frontend-deploy.zip
3. Extract the zip file
4. Delete the zip file after extraction
5. Make sure .htaccess file is present

STEP 4: Configure Environment Variables
----------------------------------------
1. In Node.js App Manager, click on your app
2. Add environment variables:
   - MONGO_URI: Your MongoDB connection string
   - JWT_SECRET: Your secret key
   - GMAIL_USER: Your Gmail address
   - GMAIL_PASS: Your Gmail app password
   - PORT: 3000
   - NODE_ENV: production

STEP 5: Test Your Application
------------------------------
1. Frontend: https://yourdomain.com
2. Backend: https://yourdomain.com:3000
3. Test registration, login, quiz features

🔧 Useful Commands (via SSH):
------------------------------
pm2 status              - Check application status
pm2 logs quiz-spark     - View application logs
pm2 restart quiz-spark  - Restart application
pm2 stop quiz-spark     - Stop application

📞 Support:
-----------
Email: princesoni.it@gmail.com
GitHub: https://github.com/Princesoni-IT/Quiz-spark

🚀 Happy Deploying!
"@

$Instructions | Out-File -FilePath $InstructionsFile -Encoding UTF8
Print-Success "Deployment instructions saved to: DEPLOYMENT_INSTRUCTIONS.txt"

Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Upload backend-deploy.zip to cPanel" -ForegroundColor White
Write-Host "   Location: $BackendZip" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Upload frontend-deploy.zip to cPanel" -ForegroundColor White
Write-Host "   Location: $FrontendZip" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Follow instructions in DEPLOYMENT_INSTRUCTIONS.txt" -ForegroundColor White
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Open deployment instructions
Print-Info "Opening deployment instructions..."
Start-Process notepad.exe $InstructionsFile

# Open folder with zip files
Print-Info "Opening folder with deployment files..."
Start-Process explorer.exe $ScriptDir

Write-Host ""
Print-Success "All done! Happy Deploying! 🚀" -ForegroundColor Green
Write-Host ""

# Return to original directory
Set-Location $ScriptDir
