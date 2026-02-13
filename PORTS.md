# Port Configuration

This project uses different ports for local development and Docker to avoid conflicts.

## 🔧 Local Development (npm run dev)

| Service    | Port | URL                              |
|------------|------|----------------------------------|
| Frontend   | 3000 | http://localhost:3000            |
| Backend    | 4000 | http://localhost:4000/api/v1     |
| PostgreSQL | 5432 | localhost:5432                   |
| Redis      | 6379 | localhost:6379                   |

**To run locally:**
```bash
# Terminal 1 - Backend
cd backend
npm install
npm run dev

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

## 🐳 Docker (docker-compose up)

| Service    | External Port | Internal Port | URL                              |
|------------|---------------|---------------|----------------------------------|
| Frontend   | 3001          | 3000          | http://localhost:3001            |
| Backend    | 4001          | 4000          | http://localhost:4001/api/v1     |
| PostgreSQL | 5433          | 5432          | localhost:5433                   |
| Redis      | 6380          | 6379          | localhost:6380                   |

**To run with Docker:**
```bash
# Copy and configure .env file first
cp .env.example .env

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

## ⚙️ Configuration Files

- **Root `.env`** - Docker environment variables (uses DOCKER_* ports)
- **`backend/.env`** - Backend local development (uses port 4000)
- **`frontend/.env`** - Frontend local development (connects to backend on 4000)
- **`docker-compose.yml`** - Docker service definitions with port mappings

## 🔄 Switching Between Local and Docker

**From Local to Docker:**
1. Stop local dev servers (Ctrl+C)
2. Run `docker-compose up -d`
3. Access frontend at http://localhost:3001

**From Docker to Local:**
1. Stop Docker: `docker-compose down`
2. Start local dev servers
3. Access frontend at http://localhost:3000

## ❗ Important Notes

- **Never run both simultaneously** - They use different ports, so both CAN run at the same time, but it may cause confusion
- Docker containers communicate internally using standard ports (4000, 5432, 6379)
- External port mapping is only for host machine access
- When running locally, ensure PostgreSQL and Redis are installed and running
