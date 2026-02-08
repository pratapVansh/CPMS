@echo off
REM ============================================
REM CPMS Docker Management Script
REM ============================================

echo ====================================
echo  CPMS Docker Management
echo ====================================
echo.

REM Check if in correct directory
if not exist "docker-compose.yml" (
    echo [ERROR] docker-compose.yml not found!
    echo Please run this script from the project root directory.
    echo Current directory: %CD%
    pause
    exit /b 1
)

REM Display menu
echo 1. Start all services
echo 2. Stop all services
echo 3. Restart all services
echo 4. View logs
echo 5. Rebuild and start
echo 6. Clean everything and rebuild
echo 7. Check status
echo 8. Run migrations
echo 9. Exit
echo.

set /p choice="Enter your choice (1-9): "

if "%choice%"=="1" goto start
if "%choice%"=="2" goto stop
if "%choice%"=="3" goto restart
if "%choice%"=="4" goto logs
if "%choice%"=="5" goto rebuild
if "%choice%"=="6" goto clean
if "%choice%"=="7" goto status
if "%choice%"=="8" goto migrate
if "%choice%"=="9" goto end

echo Invalid choice!
pause
exit /b 1

:start
echo.
echo [INFO] Starting all CPMS services...
docker-compose up -d
echo.
echo [SUCCESS] All services started!
docker ps --filter "name=cpms"
goto end

:stop
echo.
echo [INFO] Stopping all CPMS services...
docker-compose down
echo.
echo [SUCCESS] All services stopped!
goto end

:restart
echo.
echo [INFO] Restarting all CPMS services...
docker-compose restart
echo.
echo [SUCCESS] All services restarted!
docker ps --filter "name=cpms"
goto end

:logs
echo.
echo [INFO] Showing logs (Press Ctrl+C to exit)...
docker-compose logs -f
goto end

:rebuild
echo.
echo [INFO] Rebuilding and starting services...
docker-compose up -d --build
echo.
echo [SUCCESS] Services rebuilt and started!
docker ps --filter "name=cpms"
goto end

:clean
echo.
echo [WARNING] This will remove all containers, volumes, and rebuild!
set /p confirm="Are you sure? (yes/no): "
if not "%confirm%"=="yes" (
    echo Operation cancelled.
    goto end
)
echo.
echo [INFO] Cleaning up...
docker-compose down -v
docker system prune -f
echo.
echo [INFO] Rebuilding...
docker-compose up -d --build
echo.
echo [SUCCESS] Clean rebuild complete!
docker ps --filter "name=cpms"
goto end

:status
echo.
echo [INFO] CPMS Services Status:
echo.
docker ps --filter "name=cpms"
echo.
echo [INFO] Docker Images:
docker images | findstr cpms
goto end

:migrate
echo.
echo [INFO] Running database migrations...
docker exec -it cpms-api npx prisma migrate deploy
echo.
echo [SUCCESS] Migrations complete!
goto end

:end
echo.
pause
