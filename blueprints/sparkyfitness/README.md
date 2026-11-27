# SparkyFitness

SparkyFitness is a self-hosted fitness and nutrition tracking platform — a privacy-respecting alternative to MyFitnessPal. Log food (with a large built-in food database and barcode-style search via public food APIs), exercise, body measurements, water intake and sleep; set nutrition and fitness goals; and follow your progress with reports, charts and trends. It supports multiple users, so a household can share one instance.

## How this deployment works

This template follows upstream's own production Docker Compose layout, using the **official prebuilt images** (`codewithcj/sparkyfitness:v1.12.1` for the frontend, `codewithcj/sparkyfitness_server:v1.12.1` for the backend):

- **Three services:** the frontend (an nginx-served app whose built-in proxy forwards `/api` to the backend — one domain is all you need), the Node.js server on internal port 3010, and PostgreSQL.
- **PostgreSQL 18 data path.** The database volume mounts `/var/lib/postgresql`, because postgres:18 keeps PGDATA in `/var/lib/postgresql/18/docker`; mounting the pre-18 `.../data` path would silently not persist.
- **Four generated secrets, nothing to configure.** Dokploy generates both database passwords (the superuser and the application role the server creates for itself), the API encryption key (`hash:64`, the 64-character hex format upstream requires) and the auth secret at deploy time; all are wired through `template.toml`.
- **Persistence:** uploads (profile and exercise images) and server backups live in their own volumes, next to the database volume.
- The optional Garmin Connect microservice from upstream's compose is not included — upstream itself ships it disabled as work in progress.

## First run

1. Open your Dokploy domain and register the first account — it becomes the instance's first user; consider disabling public sign-up afterwards from the admin settings (`SPARKY_FITNESS_DISABLE_SIGNUP` exists upstream for this).
2. Complete your profile (measurements, goals) and start logging.

## Notes

- The database passwords are only read by PostgreSQL when the database first initialises. If you change them later in the app's Environment tab, the server will fail to connect until you also update the role passwords inside PostgreSQL — upstream documents the same caveat.
- SparkyFitness is MIT-licensed open source.
