# Label Studio

Label Studio is the standard open-source platform for data labeling and annotation. It handles text, image, audio, video, HTML and time-series data with configurable labeling interfaces, supports ML backends for pre-labeling and active learning, and exports annotations in all common ML formats (COCO, YOLO, Pascal VOC, JSON and more).

## How this deployment works

This template deploys Label Studio's **official image** (`heartexlabs/label-studio:1.23.2`) as a single container:

- **Built-in SQLite by default.** Projects, tasks, annotations and uploaded files persist in the `labelstudio-data` volume (`/label-studio/data`). This is upstream's default single-container configuration and is right for small and medium labeling projects.
- `LABEL_STUDIO_HOST` is wired to the Dokploy domain so generated links and exports point at the right public address.
- The app listens on port 8080 internally; the domain is wired in `template.toml`.

## First run

1. Open your Dokploy domain and create the first account on the sign-up screen — do this immediately, before sharing the link; the first account administers the instance.
2. Create a project, pick a labeling template for your data type, and import your tasks.

## Notes

- For large teams or heavy workloads, upstream supports an external PostgreSQL database (`POSTGRE_*` environment variables on the same image) instead of the built-in SQLite; it is intentionally not wired in this single-container template.
- Label Studio Community Edition is Apache-2.0-licensed open source. (The vendor also sells a separate commercial Cloud/Enterprise product; nothing in this template depends on it.)
