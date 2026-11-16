# OpenAlgo

OpenAlgo is an open-source algorithmic trading platform that provides a unified API layer across 38+ broker plugins (Zerodha, Fyers, Angel One, Dhan, Upstox, Delta Exchange, and more). It includes a web UI for broker configuration, Python strategies, a visual flow builder, charting, and live trading, and it integrates with TradingView, Amibroker, Excel, and Python clients.

## Deploy

The template runs a single service from the official `marketcalls/openalgo` image and routes your domain to the web UI on port `5000`.

Dokploy generates the three application secrets (`APP_KEY`, `API_KEY_PEPPER`, `FERNET_SALT`) at deploy time, so no placeholder keys are ever used.

## First run

There is no preset account. After deploying, open the app and complete the setup to create your administrator account.

Broker keys are **optional** at deploy time — leave them empty, sign in, and add your broker under **Broker Configuration**. `REDIRECT_URL` is pre-filled with your domain for the broker login callbacks.

## Notes

- The app also runs a WebSocket proxy for live market data on port `8765`; it is exposed inside the deployment, and the web UI is served over the domain on port `5000`.
- The timezone defaults to `Asia/Kolkata`, matching the markets OpenAlgo targets; change `TZ` in the environment if needed.
- Data persists in named volumes: databases (`/app/db`), strategies (`/app/strategies`), logs (`/app/log`), and API keys/certificates (`/app/keys`).

## Tested on Dokploy

Deployed from this template on a live Dokploy instance (OpenAlgo v2.0.3.3), completed the first-run setup, and verified the app serves over HTTPS.
