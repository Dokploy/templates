#!/usr/bin/env node

const http = require("node:http");
const { ApiPromise, Keyring, WsProvider } = require("@polkadot/api");

const config = {
  wsEndpoint: process.env.WS_ENDPOINT || "ws://127.0.0.1:9944",
  evmRpcUrl: process.env.EVM_RPC_URL || "",
  faucetSeed: process.env.FAUCET_SEED || "",
  port: Number.parseInt(process.env.PORT || "8080", 10),
  defaultAmount: String(process.env.DEFAULT_AMOUNT || "2000"),
  maxAmount: String(process.env.MAX_AMOUNT || "2000"),
  serviceName: process.env.SERVICE_NAME || "reef-faucet",
};

if (!config.faucetSeed) {
  throw new Error("FAUCET_SEED is required");
}

let contextPromise = null;
let requestQueue = Promise.resolve();

function normalizeEvmAddress(value) {
  const normalized = String(value || "").trim();
  if (!/^0x[0-9a-fA-F]{40}$/.test(normalized)) {
    throw new Error(`Invalid EVM address: ${value}`);
  }
  return normalized;
}

function parseUnits(value, decimals) {
  const input = String(value).trim();
  if (!/^\d+(\.\d+)?$/.test(input)) {
    throw new Error(`Invalid decimal amount: ${value}`);
  }

  const [whole, fraction = ""] = input.split(".");
  if (fraction.length > decimals) {
    throw new Error(`Too many decimal places in ${value}`);
  }

  const wholeUnits = BigInt(whole) * 10n ** BigInt(decimals);
  const fractionUnits = fraction ? BigInt(fraction.padEnd(decimals, "0")) : 0n;
  return wholeUnits + fractionUnits;
}

function formatUnits(value, decimals) {
  const negative = value < 0n;
  const abs = negative ? -value : value;
  const base = 10n ** BigInt(decimals);
  const whole = abs / base;
  const fraction = abs % base;

  if (fraction === 0n) {
    return `${negative ? "-" : ""}${whole.toString()}`;
  }

  return `${negative ? "-" : ""}${whole.toString()}.${fraction
    .toString()
    .padStart(decimals, "0")
    .replace(/0+$/, "")}`;
}

function fallbackAccountFromEvm(evmAddress) {
  return `0x${evmAddress.slice(2).toLowerCase()}${"ee".repeat(12)}`;
}

function decodeDispatchError(api, dispatchError) {
  if (dispatchError && dispatchError.isModule) {
    const decoded = api.registry.findMetaError(dispatchError.asModule);
    return `${decoded.section}.${decoded.name}: ${decoded.docs.join(" ")}`;
  }

  return dispatchError && dispatchError.toString ? dispatchError.toString() : String(dispatchError);
}

async function signAndWait(api, tx, signer) {
  return new Promise(async (resolve, reject) => {
    let unsubscribe = null;

    try {
      unsubscribe = await tx.signAndSend(signer, ({ dispatchError, events, status, txHash }) => {
        if (dispatchError) {
          if (unsubscribe) {
            unsubscribe();
          }
          reject(new Error(decodeDispatchError(api, dispatchError)));
          return;
        }

        if (status.isFinalized) {
          if (unsubscribe) {
            unsubscribe();
          }
          resolve({
            txHash: txHash.toHex(),
            finalizedBlock: status.asFinalized.toHex(),
            eventCount: events.length,
          });
        }
      });
    } catch (error) {
      if (unsubscribe) {
        unsubscribe();
      }
      reject(error);
    }
  });
}

async function maybeClaimDefaultAccount(api, signer) {
  const storage = api.query && api.query.evmAccounts && api.query.evmAccounts.evmAddresses;
  const extrinsic = api.tx && api.tx.evmAccounts && api.tx.evmAccounts.claimDefaultAccount;

  if (!storage || !extrinsic) {
    return null;
  }

  const current = await storage(signer.address);
  if (!current.isEmpty) {
    return current.toString();
  }

  await signAndWait(api, extrinsic(), signer);
  return (await storage(signer.address)).toString();
}

function buildReviveTransfer(api, signerAddress, targetEvm, amountUnits) {
  const reviveTransfer = api.tx && api.tx.revive && api.tx.revive.transfer;
  if (!reviveTransfer) {
    return null;
  }

  const metaArgs = reviveTransfer.meta.toJSON().args || [];
  const names = metaArgs.map((arg) => String((arg && arg.name) || "").toLowerCase());
  const types = metaArgs.map((arg) => JSON.stringify((arg && arg.type) || "").toLowerCase());
  const haystack = `${names.join(",")}|${types.join(",")}`;

  if (metaArgs.length === 2 && haystack.includes("h160")) {
    return {
      strategy: "revive.transfer(H160, Balance)",
      tx: reviveTransfer(targetEvm, amountUnits),
    };
  }

  if (metaArgs.length === 3 && haystack.includes("accountid") && haystack.includes("h160")) {
    return {
      strategy: "revive.transfer(AccountId, H160, Balance)",
      tx: reviveTransfer(signerAddress, targetEvm, amountUnits),
    };
  }

  return {
    strategy: "revive.transfer(fallback call signature)",
    tx: reviveTransfer(targetEvm, amountUnits),
  };
}

async function getContext() {
  if (!contextPromise) {
    contextPromise = (async () => {
      const provider = new WsProvider(config.wsEndpoint);
      const api = await ApiPromise.create({ provider });
      const keyring = new Keyring({ type: "sr25519" });
      const sender = keyring.addFromUri(config.faucetSeed);
      const nativeDecimals = api.registry.chainDecimals[0] || 12;
      const tokenSymbol = api.registry.chainTokens[0] || "REEF";

      return { api, nativeDecimals, provider, sender, tokenSymbol };
    })();
  }

  return contextPromise;
}

function jsonResponse(response, statusCode, body) {
  response.writeHead(statusCode, { "Content-Type": "application/json" });
  response.end(JSON.stringify(body));
}

function htmlResponse(response, statusCode, body) {
  response.writeHead(statusCode, { "Content-Type": "text/html; charset=utf-8" });
  response.end(body);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function wantsHtml(request) {
  const accept = String(request.headers.accept || "");
  return accept.includes("text/html");
}

function buildInfoPayload() {
  return {
    service: config.serviceName,
    status: "ok",
    defaults: {
      defaultAmount: config.defaultAmount,
      maxAmount: config.maxAmount,
    },
    upstream: {
      wsEndpoint: config.wsEndpoint,
      evmRpcUrl: config.evmRpcUrl || null,
    },
    endpoints: {
      health: {
        method: "GET",
        path: "/health",
      },
      drip: {
        method: "POST",
        path: "/drip",
        body: {
          to: "0x0000000000000000000000000000000000000000",
          amount: config.defaultAmount,
        },
      },
    },
  };
}

function buildFrontendHtml() {
  const bootPayload = JSON.stringify(buildInfoPayload());
  const title = escapeHtml(config.serviceName);
  const defaultAmount = escapeHtml(config.defaultAmount);
  const maxAmount = escapeHtml(config.maxAmount);
  const wsEndpoint = escapeHtml(config.wsEndpoint);
  const evmRpcUrl = escapeHtml(config.evmRpcUrl || "Not configured");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${title}</title>
    <style>
      :root {
        color-scheme: dark;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: #07111f;
        color: #e5eefb;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        background:
          radial-gradient(circle at top, rgba(58, 123, 213, 0.22), transparent 42%),
          linear-gradient(180deg, #07111f 0%, #0d1728 100%);
      }

      main {
        width: min(100%, 760px);
        margin: 0 auto;
        padding: 32px 16px 48px;
      }

      .panel {
        border: 1px solid rgba(148, 163, 184, 0.24);
        border-radius: 8px;
        background: rgba(7, 17, 31, 0.82);
        box-shadow: 0 22px 60px rgba(2, 6, 23, 0.35);
        overflow: hidden;
      }

      .hero {
        padding: 28px 24px 18px;
        border-bottom: 1px solid rgba(148, 163, 184, 0.16);
      }

      .eyebrow {
        margin: 0 0 10px;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #7dd3fc;
      }

      h1 {
        margin: 0 0 10px;
        font-size: 30px;
        line-height: 1.1;
      }

      .lede {
        margin: 0;
        color: #cbd5e1;
        line-height: 1.6;
      }

      .meta {
        display: grid;
        gap: 12px;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        padding: 18px 24px 0;
      }

      .meta-item {
        padding: 14px;
        border: 1px solid rgba(148, 163, 184, 0.16);
        border-radius: 8px;
        background: rgba(15, 23, 42, 0.55);
      }

      .meta-item span {
        display: block;
        font-size: 12px;
        color: #94a3b8;
        margin-bottom: 8px;
      }

      .meta-item strong,
      .meta-item code {
        font-size: 14px;
        color: #f8fafc;
        word-break: break-word;
      }

      form {
        display: grid;
        gap: 16px;
        padding: 24px;
      }

      label {
        display: grid;
        gap: 8px;
        color: #cbd5e1;
        font-size: 14px;
      }

      input {
        width: 100%;
        padding: 12px 14px;
        border: 1px solid rgba(148, 163, 184, 0.22);
        border-radius: 8px;
        background: rgba(15, 23, 42, 0.9);
        color: #f8fafc;
        font: inherit;
      }

      input:focus {
        outline: 2px solid rgba(56, 189, 248, 0.45);
        outline-offset: 1px;
      }

      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
      }

      button {
        appearance: none;
        border: 0;
        border-radius: 8px;
        padding: 12px 16px;
        font: inherit;
        font-weight: 600;
        cursor: pointer;
      }

      button[type="submit"] {
        background: #38bdf8;
        color: #082032;
      }

      button[type="button"] {
        background: rgba(148, 163, 184, 0.14);
        color: #e2e8f0;
      }

      button:disabled {
        cursor: wait;
        opacity: 0.7;
      }

      .status-wrap {
        padding: 0 24px 24px;
      }

      .status {
        margin: 0;
        min-height: 168px;
        padding: 16px;
        border-radius: 8px;
        background: rgba(2, 6, 23, 0.68);
        border: 1px solid rgba(148, 163, 184, 0.16);
        color: #dbeafe;
        font: 13px/1.55 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        white-space: pre-wrap;
        word-break: break-word;
      }

      .footer {
        padding: 0 24px 24px;
        color: #94a3b8;
        font-size: 13px;
        line-height: 1.7;
      }

      .footer code {
        color: #e2e8f0;
      }

      @media (max-width: 640px) {
        main {
          padding: 20px 12px 32px;
        }

        .hero,
        .meta,
        form,
        .status-wrap,
        .footer {
          padding-left: 16px;
          padding-right: 16px;
        }

        h1 {
          font-size: 24px;
        }

        .actions {
          flex-direction: column;
        }
      }
    </style>
  </head>
  <body>
    <main>
      <section class="panel">
        <div class="hero">
          <p class="eyebrow">Reef Faucet</p>
          <h1>${title}</h1>
          <p class="lede">Send test REEF to any EVM address without reaching for curl first.</p>
        </div>

        <div class="meta">
          <div class="meta-item">
            <span>Default amount</span>
            <strong>${defaultAmount} REEF</strong>
          </div>
          <div class="meta-item">
            <span>Max amount</span>
            <strong>${maxAmount} REEF</strong>
          </div>
          <div class="meta-item">
            <span>WS upstream</span>
            <code>${wsEndpoint}</code>
          </div>
          <div class="meta-item">
            <span>EVM upstream</span>
            <code>${evmRpcUrl}</code>
          </div>
        </div>

        <form data-form>
          <label>
            EVM address
            <input name="to" placeholder="0x0000000000000000000000000000000000000000" autocomplete="off" required>
          </label>

          <label>
            Amount
            <input name="amount" value="${defaultAmount}" inputmode="decimal" required>
          </label>

          <div class="actions">
            <button type="submit">Send drip</button>
            <button type="button" data-health>Refresh health</button>
          </div>
        </form>

        <div class="status-wrap">
          <pre class="status" data-status>Ready.</pre>
        </div>

        <div class="footer">
          <div><code>GET /health</code> checks the service.</div>
          <div><code>POST /drip</code> accepts <code>{"to":"0x...","amount":"${defaultAmount}"}</code>.</div>
        </div>
      </section>
    </main>

    <script>
      const bootConfig = ${bootPayload};
      const form = document.querySelector("[data-form]");
      const statusNode = document.querySelector("[data-status]");
      const healthButton = document.querySelector("[data-health]");
      const submitButton = form.querySelector('button[type="submit"]');

      function setStatus(label, payload) {
        const lines = [];
        if (label) {
          lines.push(label);
        }
        if (payload !== undefined) {
          if (typeof payload === "string") {
            lines.push(payload);
          } else {
            lines.push(JSON.stringify(payload, null, 2));
          }
        }
        statusNode.textContent = lines.join("\\n\\n");
      }

      async function loadHealth() {
        setStatus("Checking faucet health...");
        const response = await fetch("/health");
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || "Health check failed");
        }
        setStatus("Faucet is healthy.", {
          service: bootConfig.service,
          health: payload,
          defaults: bootConfig.defaults,
        });
      }

      async function handleSubmit(event) {
        event.preventDefault();

        const formData = new FormData(form);
        const payload = {
          to: String(formData.get("to") || "").trim(),
          amount: String(formData.get("amount") || "").trim() || bootConfig.defaults.defaultAmount,
        };

        submitButton.disabled = true;
        healthButton.disabled = true;
        setStatus("Submitting drip request...", payload);

        try {
          const response = await fetch("/drip", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });
          const body = await response.json();
          if (!response.ok) {
            throw new Error(body.error || "Drip request failed");
          }
          setStatus("Drip sent.", body);
        } catch (error) {
          setStatus("Request failed.", error.message || String(error));
        } finally {
          submitButton.disabled = false;
          healthButton.disabled = false;
        }
      }

      form.addEventListener("submit", handleSubmit);
      healthButton.addEventListener("click", () => {
        healthButton.disabled = true;
        loadHealth()
          .catch((error) => {
            setStatus("Health check failed.", error.message || String(error));
          })
          .finally(() => {
            healthButton.disabled = false;
          });
      });

      loadHealth().catch((error) => {
        setStatus("Health check failed.", error.message || String(error));
      });
    </script>
  </body>
</html>`;
}

async function parseRequestBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function executeDrip(targetEvm, amountText) {
  const { api, nativeDecimals, sender, tokenSymbol } = await getContext();
  const amountUnits = parseUnits(amountText, nativeDecimals);
  const maxUnits = parseUnits(config.maxAmount, nativeDecimals);

  if (amountUnits <= 0n) {
    throw new Error("Amount must be greater than zero");
  }

  if (amountUnits > maxUnits) {
    throw new Error(`Amount exceeds MAX_AMOUNT (${config.maxAmount})`);
  }

  await maybeClaimDefaultAccount(api, sender);

  const senderBefore = (await api.query.system.account(sender.address)).data.free.toBigInt();

  let strategy = "";
  let result = null;

  try {
    const revive = buildReviveTransfer(api, sender.address, targetEvm, amountUnits);
    if (!revive) {
      throw new Error("revive.transfer unavailable");
    }
    strategy = revive.strategy;
    result = await signAndWait(api, revive.tx, sender);
  } catch (error) {
    strategy = "balances.transferAllowDeath(AccountId32 fallback)";
    result = await signAndWait(
      api,
      api.tx.balances.transferAllowDeath(fallbackAccountFromEvm(targetEvm), amountUnits),
      sender
    );
  }

  const senderAfter = (await api.query.system.account(sender.address)).data.free.toBigInt();

  return {
    amount: amountText,
    strategy,
    tokenSymbol,
    txHash: result.txHash,
    finalizedBlock: result.finalizedBlock,
    eventCount: result.eventCount,
    sender: sender.address,
    senderNativeBefore: formatUnits(senderBefore, nativeDecimals),
    senderNativeAfter: formatUnits(senderAfter, nativeDecimals),
  };
}

function enqueue(task) {
  const current = requestQueue.then(task, task);
  requestQueue = current.catch(() => undefined);
  return current;
}

const server = http.createServer(async (request, response) => {
  try {
    if (request.method === "GET" && request.url === "/favicon.ico") {
      response.writeHead(204);
      response.end();
      return;
    }

    if (request.method === "GET" && request.url === "/") {
      if (wantsHtml(request)) {
        htmlResponse(response, 200, buildFrontendHtml());
      } else {
        jsonResponse(response, 200, buildInfoPayload());
      }
      return;
    }

    if (request.method === "GET" && request.url === "/health") {
      jsonResponse(response, 200, { status: "ok" });
      return;
    }

    if (request.method === "POST" && request.url === "/drip") {
      const payload = await parseRequestBody(request);
      const targetEvm = normalizeEvmAddress(payload.to);
      const amount = payload.amount ? String(payload.amount) : config.defaultAmount;
      const result = await enqueue(() => executeDrip(targetEvm, amount));
      jsonResponse(response, 200, result);
      return;
    }

    jsonResponse(response, 404, { error: "Not found" });
  } catch (error) {
    jsonResponse(response, 400, { error: error.message });
  }
});

server.listen(config.port, "0.0.0.0", () => {
  console.log(`${config.serviceName} listening on ${config.port}`);
});
