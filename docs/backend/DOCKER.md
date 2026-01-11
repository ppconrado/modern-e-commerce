# Docker Setup Guide

## Quick Start

### Build and Run with Docker Compose

```bash
# Build and start all services (database + app)
npm run docker:build
npm run docker:up

# View logs
npm run docker:logs

# Stop all services
npm run docker:down
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## Docker Commands

| Command                  | Description                         |
| ------------------------ | ----------------------------------- |
| `npm run docker:build`   | Build the Docker images             |
| `npm run docker:up`      | Start all services in detached mode |
| `npm run docker:down`    | Stop and remove all containers      |
| `npm run docker:logs`    | View logs from all services         |
| `npm run docker:restart` | Restart the app container           |

## Architecture

The Docker setup includes:

1. **PostgreSQL Database** (`postgres` service)

   - PostgreSQL 16 Alpine
   - Exposed on port `5433` (host) → `5432` (container)
   - Data persisted in `postgres_data` volume
   - Health checks enabled

2. **Next.js Application** (`app` service)
   - Multi-stage build for optimal image size
   - Includes frontend and API routes
   - Exposed on port `3000`
   - Auto-runs migrations and seeding on startup

## Docker Networking

Services communicate via the `ecommerce-network` bridge network:

- Database hostname: `postgres` (internal)
- App hostname: `app` (internal)
- External access: `localhost:3000` (app), `localhost:5433` (db)

## Environment Variables

Docker uses `.env.docker` for container environment:

- `DATABASE_URL`: Uses Docker service name (`postgres`) instead of `localhost`
- `NODE_ENV`: Set to `production`
- `NEXT_PUBLIC_API_URL`: Public API endpoint

## Local Development vs Docker

**Local Development:**

```bash
npm run dev                    # Start Next.js dev server
npm run db:push               # Push schema to database
npm run db:seed               # Seed database
```

**Docker:**

```bash
npm run docker:up             # Everything starts automatically
npm run docker:logs           # Monitor containers
```

## Troubleshooting

**Rebuild after code changes:**

```bash
npm run docker:down
npm run docker:build
npm run docker:up
```

**View database in container:**

```bash
docker exec -it ecommerce-postgres psql -U postgres -d ecommerce_db
```

**Access app container shell:**

```bash
docker exec -it ecommerce-app sh
```

**Clear all data and start fresh:**

```bash
docker-compose down -v        # Remove volumes
npm run docker:build
npm run docker:up
```

## Production Deployment

The Docker setup is production-ready:

- Multi-stage builds for smaller images
- Non-root user for security
- Health checks for reliability
- Standalone Next.js output
- Volume persistence for database

For cloud deployment, push to a container registry:

```bash
docker tag ecommerce-app:latest your-registry/ecommerce-app:latest
docker push your-registry/ecommerce-app:latest
```
