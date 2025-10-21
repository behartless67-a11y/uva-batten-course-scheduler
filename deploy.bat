@echo off
echo ========================================
echo UVA Batten Course Scheduler - Deploy to Azure
echo ========================================
echo.

REM Clean previous build
echo Cleaning previous build...
if exist app\api rmdir /s /q app\api
if exist .next rmdir /s /q .next
if exist out rmdir /s /q out

REM Build the app
echo.
echo Building Next.js app...
call npm run build

REM Check if build succeeded
if not exist out (
    echo ERROR: Build failed - out folder not created
    pause
    exit /b 1
)

REM Restore API routes for local dev
echo.
echo Restoring API routes for local development...
git checkout app\api

REM Deploy to Azure
echo.
echo Deploying to Azure Static Web Apps...
call swa deploy ./out --api-location ./api --deployment-token 51d46fd6866602bd2ed60ce8ac0d96927e7e0b94568e338bd60c31239fee909103-99b90794-401d-412d-9cb3-87acf7e5e17b010042806d7e4210

echo.
echo ========================================
echo Deployment complete!
echo Site: https://green-moss-06d7e4210-preview.centralus.3.azurestaticapps.net
echo ========================================
pause
