#!/usr/bin/env node

const http = require("node:http");
const { ApiPromise, Keyring, WsProvider } = require("@polkadot/api");

const config = {
  wsEndpoint: process.env.WS_ENDPOINT || "ws://127.0.0.1:9944",
  faucetSeed: process.env.FAUCET_SEED || "",
  port: Number.parseInt(process.env.PORT || "8080", 10),
  defaultAmount: String(process.env.DEFAULT_AMOUNT || "1"),
  maxAmount: String(process.env.MAX_AMOUNT || "10"),
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
  console.log(`reef dev-cluster faucet listening on ${config.port}`);
});
