# marimo

marimo is an open-source reactive Python notebook. Unlike Jupyter, marimo notebooks are stored as pure Python files — readable, runnable as scripts, and easy to version with git. The notebook is reactive: when you change a cell, marimo automatically re-runs the cells that depend on it, so code and outputs never go stale. Notebooks can also be deployed as interactive web apps.

## How this deployment works

This template deploys marimo's **official prebuilt image** (`ghcr.io/marimo-team/marimo`), running the marimo **edit server** on port 2718:

- **Token authentication is on.** The image's own default command runs with `--no-token`, which is fine locally but unsafe on a public domain — anyone could open the editor and execute Python. This template instead generates a token at deploy time and starts the server with `--token-password`.
- **Notebooks persist.** The server works in the image's working directory `/app`, which is backed by the `marimo_data` volume, so your notebook `.py` files survive restarts and redeploys.
- This is the base image variant (marimo only). Upstream also publishes `0.25.2-data` (pandas, numpy, altair and the recommended extras preinstalled) and `0.25.2-sql` (adds SQL support) — change the image tag in the compose file if you prefer one of those.

## First run

1. Open your Dokploy domain — you will land on marimo's login page.
2. Find the token in Dokploy: open this app → **Environment** → the `MARIMO_TOKEN` value (generated automatically when the template was deployed). Paste it into the login page. You can also open `https://<your-domain>/?access_token=<MARIMO_TOKEN>` directly.
3. Create your first notebook from the file browser. It is saved as a plain `.py` file in the volume.

## Notes

- Treat the token like a root password: whoever has it can run arbitrary Python code inside the container. Keep the domain and token private, and rotate the token by changing `MARIMO_TOKEN` in the app's environment and redeploying.
- Packages you install from marimo's built-in package manager go into the container's own Python environment, which is **not** in the volume — they are lost when the container is recreated. Notebooks themselves persist. For permanent dependencies, build your own image `FROM ghcr.io/marimo-team/marimo:0.25.2` with the packages installed, as upstream's prebuilt-containers guide describes.
- The public origin is passed to the server with `--allow-origins` (per upstream's Docker guidance). If you change the app's domain in Dokploy afterwards, redeploy so the variable is regenerated.
