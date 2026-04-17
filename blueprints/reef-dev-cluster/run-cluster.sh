#!/usr/bin/env bash

set -euo pipefail

NODE_BIN="${NODE_BIN:-reef-node}"
CHAIN_TEMPLATE="${CHAIN_TEMPLATE:-testnet-new}"
WORK_DIR="${WORK_DIR:-/tmp/reef-dev-cluster}"
STATE_DIR="${STATE_DIR:-/workspace/state}"
SEED_DIR="${SEED_DIR:-$STATE_DIR/seeds}"
NODE_KEY_DIR="${NODE_KEY_DIR:-$STATE_DIR/node-keys}"
OUTPUT_DIR="${OUTPUT_DIR:-/workspace/download}"
PLAIN_SPEC="${PLAIN_SPEC:-$WORK_DIR/local-chain-spec.json}"
UPDATED_SPEC="${UPDATED_SPEC:-$WORK_DIR/local-chain-spec-updated.json}"
SPEC_FILE="${SPEC_FILE:-$OUTPUT_DIR/local-chain-spec-raw.json}"
SPEC_HTTP_PORT="${SPEC_HTTP_PORT:-8001}"
BOOTNODE_P2P_PORT="${BOOTNODE_P2P_PORT:-30335}"
VALIDATOR1_P2P_PORT="${VALIDATOR1_P2P_PORT:-30333}"
VALIDATOR2_P2P_PORT="${VALIDATOR2_P2P_PORT:-30334}"
VALIDATOR3_P2P_PORT="${VALIDATOR3_P2P_PORT:-30336}"
RPC_NODE_P2P_PORT="${RPC_NODE_P2P_PORT:-30337}"
RPC_NODE_WS_PORT="${RPC_NODE_WS_PORT:-9944}"
ETH_RPC_PORT="${ETH_RPC_PORT:-8545}"
FAUCET_PORT="${FAUCET_PORT:-8080}"
BOOTNODE_PROMETHEUS_PORT="${BOOTNODE_PROMETHEUS_PORT:-9615}"
VALIDATOR1_PROMETHEUS_PORT="${VALIDATOR1_PROMETHEUS_PORT:-9616}"
VALIDATOR2_PROMETHEUS_PORT="${VALIDATOR2_PROMETHEUS_PORT:-9617}"
VALIDATOR3_PROMETHEUS_PORT="${VALIDATOR3_PROMETHEUS_PORT:-9618}"
RPC_NODE_PROMETHEUS_PORT="${RPC_NODE_PROMETHEUS_PORT:-9619}"
DEFAULT_AMOUNT="${DEFAULT_AMOUNT:-1}"
MAX_AMOUNT="${MAX_AMOUNT:-10}"
TEMPLATE_ASSET_REF="${TEMPLATE_ASSET_REF:-reef-chain}"
TEMPLATE_ASSET_BASE_URL="${TEMPLATE_ASSET_BASE_URL:-https://raw.githubusercontent.com/anukulpandey/dokploy-templates/${TEMPLATE_ASSET_REF}/blueprints/reef-dev-cluster}"
FAUCET_DIR="${FAUCET_DIR:-/workspace/faucet}"
BOOTNODE_PEER_ID_FILE="$OUTPUT_DIR/bootnode_peer_id.txt"
BOOTNODE_COMPAT_FILE="$OUTPUT_DIR/bootnode_node_key.txt"
CLUSTER_INFO_FILE="$OUTPUT_DIR/cluster-info.json"

PIDS=()
TAIL_PID=""

cleanup() {
	kill "$TAIL_PID" 2>/dev/null || true
	if [ "${#PIDS[@]}" -gt 0 ]; then
		kill "${PIDS[@]}" 2>/dev/null || true
	fi
}

trap cleanup EXIT

trim_whitespace() {
	printf '%s' "$1" | tr -d '[:space:]'
}

canonicalize_seed() {
	local name="$1"
	local value
	value=$(trim_whitespace "${2:-}")

	if [ -z "$value" ]; then
		printf '\n'
		return 0
	fi

	if [[ "$value" =~ ^0x[0-9A-Fa-f]{64}$ ]]; then
		printf '0x%s\n' "$(printf '%s' "${value#0x}" | tr '[:upper:]' '[:lower:]')"
		return 0
	fi

	if [[ "$value" =~ ^[0-9A-Fa-f]{64}$ ]]; then
		printf '0x%s\n' "$(printf '%s' "$value" | tr '[:upper:]' '[:lower:]')"
		return 0
	fi

	echo "Invalid seed for $name. Expected 64 hex bytes with optional 0x prefix." >&2
	exit 1
}

write_secret_file() {
	local file="$1"
	local value="$2"

	mkdir -p "$(dirname "$file")"
	printf '%s\n' "$value" > "$file"
	chmod 600 "$file"
}

generate_seed() {
	printf '0x%s\n' "$(od -An -N32 -tx1 /dev/urandom | tr -d ' \n' | tr '[:upper:]' '[:lower:]')"
}

resolve_seed() {
	local env_name="$1"
	local file_name="$2"
	local file="$SEED_DIR/$file_name"
	local raw_value normalized source

	raw_value=$(trim_whitespace "${!env_name:-}")
	if [ -n "$raw_value" ]; then
		normalized=$(canonicalize_seed "$env_name" "$raw_value")
		source="env"
		write_secret_file "$file" "$normalized"
	elif [ -f "$file" ]; then
		normalized=$(canonicalize_seed "$env_name" "$(cat "$file")")
		source="persisted"
		write_secret_file "$file" "$normalized"
	else
		normalized=$(generate_seed)
		source="generated"
		write_secret_file "$file" "$normalized"
	fi

	printf '%s|%s\n' "$normalized" "$source"
}

resolve_optional_seed() {
	local env_name="$1"
	local file_name="$2"
	local file="$SEED_DIR/$file_name"
	local raw_value normalized source

	raw_value=$(trim_whitespace "${!env_name:-}")
	if [ -n "$raw_value" ]; then
		normalized=$(canonicalize_seed "$env_name" "$raw_value")
		source="env"
		write_secret_file "$file" "$normalized"
	elif [ -f "$file" ]; then
		normalized=$(canonicalize_seed "$env_name" "$(cat "$file")")
		source="persisted"
		write_secret_file "$file" "$normalized"
	else
		normalized=""
		source="shared-v1"
	fi

	printf '%s|%s\n' "$normalized" "$source"
}

read_seed_result() {
	local var_prefix="$1"
	local result="$2"
	local seed="${result%%|*}"
	local source="${result##*|}"

	printf -v "${var_prefix}_SEED" '%s' "$seed"
	printf -v "${var_prefix}_SOURCE" '%s' "$source"
}

ensure_node_key_file() {
	local name="$1"
	local file="$NODE_KEY_DIR/${name}.key"

	if [ ! -s "$file" ]; then
		mkdir -p "$NODE_KEY_DIR"
		"$NODE_BIN" key generate-node-key --chain local > "$file"
		chmod 600 "$file"
	fi

	printf '%s\n' "$file"
}

derive_address() {
	local suri="$1"
	local scheme="${2:-Sr25519}"

	"$NODE_BIN" key inspect --scheme "$scheme" "$suri" --output-type json \
		| grep -o '"ss58Address": "[^"]*"' \
		| cut -d'"' -f4
}

insert_keys() {
	local base_path="$1"
	local seed="$2"

	"$NODE_BIN" key insert --base-path "$base_path" --chain "$SPEC_FILE" --scheme Sr25519 --suri "$seed//babe" --key-type babe
	"$NODE_BIN" key insert --base-path "$base_path" --chain "$SPEC_FILE" --scheme Ed25519 --suri "$seed//grandpa" --key-type gran
	"$NODE_BIN" key insert --base-path "$base_path" --chain "$SPEC_FILE" --scheme Sr25519 --suri "$seed//im_online" --key-type imon
	"$NODE_BIN" key insert --base-path "$base_path" --chain "$SPEC_FILE" --scheme Sr25519 --suri "$seed//authority_discovery" --key-type audi
}

start_logged() {
	local log_file="$1"
	shift

	"$@" >"$log_file" 2>&1 &
	PIDS+=("$!")
}

write_cluster_info() {
	python3 - "$CLUSTER_INFO_FILE" \
		"$V1_ADDR" "$V1_SOURCE" "$VALIDATOR1_P2P_PORT" \
		"$V2_ADDR" "$V2_SOURCE" "$VALIDATOR2_P2P_PORT" \
		"$V3_ADDR" "$V3_SOURCE" "$VALIDATOR3_P2P_PORT" \
		"$FAUCET_ADDR" "$FAUCET_SOURCE" "$FAUCET_PORT" \
		"$BOOTNODE_PEER_ID" "$BOOTNODE_P2P_PORT" \
		"$RPC_NODE_P2P_PORT" "$RPC_NODE_WS_PORT" "$ETH_RPC_PORT" \
		"$SPEC_HTTP_PORT" "$STATE_DIR" <<'PY'
import json
import sys

output_file = sys.argv[1]

cluster_info = {
    "validators": [
        {
            "name": "Validator1",
            "ss58Address": sys.argv[2],
            "seedSource": sys.argv[3],
            "p2pPort": int(sys.argv[4]),
        },
        {
            "name": "Validator2",
            "ss58Address": sys.argv[5],
            "seedSource": sys.argv[6],
            "p2pPort": int(sys.argv[7]),
        },
        {
            "name": "Validator3",
            "ss58Address": sys.argv[8],
            "seedSource": sys.argv[9],
            "p2pPort": int(sys.argv[10]),
        },
    ],
    "faucet": {
        "ss58Address": sys.argv[11],
        "seedSource": sys.argv[12],
        "httpPort": int(sys.argv[13]),
    },
    "bootnodePeerId": sys.argv[14],
    "ports": {
        "bootnodeP2P": int(sys.argv[15]),
        "rpcNodeP2P": int(sys.argv[16]),
        "rpcWs": int(sys.argv[17]),
        "ethRpcHttp": int(sys.argv[18]),
        "specHttp": int(sys.argv[19]),
    },
    "statePath": sys.argv[20],
}

with open(output_file, "w", encoding="utf-8") as handle:
    json.dump(cluster_info, handle, indent=2)
PY
}

mkdir -p "$STATE_DIR" "$SEED_DIR" "$NODE_KEY_DIR" "$OUTPUT_DIR"
chmod 700 "$STATE_DIR" "$SEED_DIR" "$NODE_KEY_DIR"

read_seed_result "V1" "$(resolve_seed v1sec v1sec)"
read_seed_result "V2" "$(resolve_seed v2sec v2sec)"
read_seed_result "V3" "$(resolve_seed v3sec v3sec)"
read_seed_result "FAUCET_OVERRIDE" "$(resolve_optional_seed faucetsec faucetsec)"

if [ -n "$FAUCET_OVERRIDE_SEED" ]; then
	FAUCET_SEED="$FAUCET_OVERRIDE_SEED"
	FAUCET_SOURCE="$FAUCET_OVERRIDE_SOURCE"
else
	FAUCET_SEED="$V1_SEED"
	FAUCET_SOURCE="shared-v1"
fi

V1_ADDR=$(derive_address "$V1_SEED")
V1_BABE=$(derive_address "$V1_SEED//babe")
V1_GRAN=$(derive_address "$V1_SEED//grandpa" Ed25519)
V1_IMON=$(derive_address "$V1_SEED//im_online")
V1_AUDI=$(derive_address "$V1_SEED//authority_discovery")

V2_ADDR=$(derive_address "$V2_SEED")
V2_BABE=$(derive_address "$V2_SEED//babe")
V2_GRAN=$(derive_address "$V2_SEED//grandpa" Ed25519)
V2_IMON=$(derive_address "$V2_SEED//im_online")
V2_AUDI=$(derive_address "$V2_SEED//authority_discovery")

V3_ADDR=$(derive_address "$V3_SEED")
V3_BABE=$(derive_address "$V3_SEED//babe")
V3_GRAN=$(derive_address "$V3_SEED//grandpa" Ed25519)
V3_IMON=$(derive_address "$V3_SEED//im_online")
V3_AUDI=$(derive_address "$V3_SEED//authority_discovery")

FAUCET_ADDR=$(derive_address "$FAUCET_SEED")

rm -rf "$WORK_DIR" /tmp/validator1 /tmp/validator2 /tmp/validator3 /tmp/rpc-node /tmp/bootnode "$FAUCET_DIR"
mkdir -p "$WORK_DIR" "$FAUCET_DIR"
find "$OUTPUT_DIR" -mindepth 1 -maxdepth 1 -exec rm -rf {} + 2>/dev/null || true

echo "Resolved validator addresses:"
echo " - Validator1: $V1_ADDR ($V1_SOURCE)"
echo " - Validator2: $V2_ADDR ($V2_SOURCE)"
echo " - Validator3: $V3_ADDR ($V3_SOURCE)"
echo " - Faucet: $FAUCET_ADDR ($FAUCET_SOURCE)"
echo "Private state directory: $STATE_DIR"

echo "Downloading local faucet sources..."
wget -q -O "$FAUCET_DIR/package.json" \
	"${TEMPLATE_ASSET_BASE_URL}/faucet/package.json"
wget -q -O "$FAUCET_DIR/server.js" \
	"${TEMPLATE_ASSET_BASE_URL}/faucet/server.js"

echo "Installing faucet dependencies..."
(
	cd "$FAUCET_DIR"
	npm install --omit=dev --no-fund --no-audit
)

echo "Generating chain spec..."
"$NODE_BIN" build-spec --chain "$CHAIN_TEMPLATE" --disable-default-bootnode > "$PLAIN_SPEC"

python3 - "$PLAIN_SPEC" "$UPDATED_SPEC" \
	"$V1_ADDR" "$V1_BABE" "$V1_GRAN" "$V1_IMON" "$V1_AUDI" \
	"$V2_ADDR" "$V2_BABE" "$V2_GRAN" "$V2_IMON" "$V2_AUDI" \
	"$V3_ADDR" "$V3_BABE" "$V3_GRAN" "$V3_IMON" "$V3_AUDI" \
	"$FAUCET_ADDR" "$V1_ADDR" <<'PY'
import json
import sys

input_file = sys.argv[1]
output_file = sys.argv[2]

v1_addr, v1_babe, v1_gran, v1_imon, v1_audi = sys.argv[3:8]
v2_addr, v2_babe, v2_gran, v2_imon, v2_audi = sys.argv[8:13]
v3_addr, v3_babe, v3_gran, v3_imon, v3_audi = sys.argv[13:18]
faucet_addr = sys.argv[18]
default_faucet_addr = sys.argv[19]

AMOUNT = 100000000000000000000000000
STAKE = 1000000000000000000000000

with open(input_file, "r", encoding="utf-8") as handle:
    spec = json.load(handle)

balances = spec["genesis"]["runtimeGenesis"]["patch"]["balances"]["balances"]

def upsert_balance(address, amount):
    for entry in balances:
        if entry[0] == address:
            entry[1] = max(int(entry[1]), amount)
            return
    balances.append([address, amount])

for address in (v1_addr, v2_addr, v3_addr):
    upsert_balance(address, AMOUNT)

if faucet_addr != default_faucet_addr:
    upsert_balance(faucet_addr, AMOUNT)

spec["genesis"]["runtimeGenesis"]["patch"]["session"]["keys"] = [
    [
        v1_addr,
        v1_addr,
        {
            "authority_discovery": v1_audi,
            "babe": v1_babe,
            "grandpa": v1_gran,
            "im_online": v1_imon,
        },
    ],
    [
        v2_addr,
        v2_addr,
        {
            "authority_discovery": v2_audi,
            "babe": v2_babe,
            "grandpa": v2_gran,
            "im_online": v2_imon,
        },
    ],
    [
        v3_addr,
        v3_addr,
        {
            "authority_discovery": v3_audi,
            "babe": v3_babe,
            "grandpa": v3_gran,
            "im_online": v3_imon,
        },
    ],
]

spec["genesis"]["runtimeGenesis"]["patch"]["staking"]["invulnerables"] = [
    v1_addr,
    v2_addr,
    v3_addr,
]

spec["genesis"]["runtimeGenesis"]["patch"]["staking"]["stakers"] = [
    [v1_addr, v1_addr, STAKE, "Validator"],
    [v2_addr, v2_addr, STAKE, "Validator"],
    [v3_addr, v3_addr, STAKE, "Validator"],
]

with open(output_file, "w", encoding="utf-8") as handle:
    json.dump(spec, handle, indent=2)
PY

"$NODE_BIN" build-spec \
	--chain "$UPDATED_SPEC" \
	--disable-default-bootnode \
	--raw > "$SPEC_FILE"

BOOTNODE_NODE_KEY_FILE=$(ensure_node_key_file bootnode)
V1_NODE_KEY_FILE=$(ensure_node_key_file validator1)
V2_NODE_KEY_FILE=$(ensure_node_key_file validator2)
V3_NODE_KEY_FILE=$(ensure_node_key_file validator3)
RPC_NODE_KEY_FILE=$(ensure_node_key_file rpc-node)

BOOTNODE_PEER_ID=$("$NODE_BIN" key inspect-node-key --file "$BOOTNODE_NODE_KEY_FILE" 2>/dev/null | tail -n1 | tr -d '\r')
if [ -z "$BOOTNODE_PEER_ID" ]; then
	echo "Failed to derive bootnode peer id" >&2
	exit 1
fi

printf '%s\n' "$BOOTNODE_PEER_ID" > "$BOOTNODE_PEER_ID_FILE"
printf '%s\n' "$BOOTNODE_PEER_ID" > "$BOOTNODE_COMPAT_FILE"
write_cluster_info

echo "Bootnode peer ID: $BOOTNODE_PEER_ID"

insert_keys /tmp/validator1 "$V1_SEED"
insert_keys /tmp/validator2 "$V2_SEED"
insert_keys /tmp/validator3 "$V3_SEED"

python3 -m http.server "$SPEC_HTTP_PORT" --bind 0.0.0.0 --directory "$OUTPUT_DIR" >/tmp/spec-server.log 2>&1 &
PIDS+=("$!")

BOOTNODE_MULTIADDR="/ip4/127.0.0.1/tcp/${BOOTNODE_P2P_PORT}/p2p/${BOOTNODE_PEER_ID}"

start_logged /tmp/bootnode.log \
	"$NODE_BIN" \
	--base-path /tmp/bootnode \
	--chain "$SPEC_FILE" \
	--port "$BOOTNODE_P2P_PORT" \
	--prometheus-port "$BOOTNODE_PROMETHEUS_PORT" \
	--rpc-port 0 \
	--node-key-file "$BOOTNODE_NODE_KEY_FILE" \
	--name Bootnode \
	--no-telemetry

start_logged /tmp/validator1.log \
	"$NODE_BIN" \
	--base-path /tmp/validator1 \
	--chain "$SPEC_FILE" \
	--port "$VALIDATOR1_P2P_PORT" \
	--prometheus-port "$VALIDATOR1_PROMETHEUS_PORT" \
	--rpc-port 0 \
	--node-key-file "$V1_NODE_KEY_FILE" \
	--bootnodes "$BOOTNODE_MULTIADDR" \
	--validator \
	--name Validator1 \
	--no-telemetry

start_logged /tmp/validator2.log \
	"$NODE_BIN" \
	--base-path /tmp/validator2 \
	--chain "$SPEC_FILE" \
	--port "$VALIDATOR2_P2P_PORT" \
	--prometheus-port "$VALIDATOR2_PROMETHEUS_PORT" \
	--rpc-port 0 \
	--node-key-file "$V2_NODE_KEY_FILE" \
	--bootnodes "$BOOTNODE_MULTIADDR" \
	--validator \
	--name Validator2 \
	--no-telemetry

start_logged /tmp/validator3.log \
	"$NODE_BIN" \
	--base-path /tmp/validator3 \
	--chain "$SPEC_FILE" \
	--port "$VALIDATOR3_P2P_PORT" \
	--prometheus-port "$VALIDATOR3_PROMETHEUS_PORT" \
	--rpc-port 0 \
	--node-key-file "$V3_NODE_KEY_FILE" \
	--bootnodes "$BOOTNODE_MULTIADDR" \
	--validator \
	--name Validator3 \
	--no-telemetry

start_logged /tmp/rpc-node.log \
	"$NODE_BIN" \
	--base-path /tmp/rpc-node \
	--chain "$SPEC_FILE" \
	--port "$RPC_NODE_P2P_PORT" \
	--prometheus-port "$RPC_NODE_PROMETHEUS_PORT" \
	--node-key-file "$RPC_NODE_KEY_FILE" \
	--bootnodes "$BOOTNODE_MULTIADDR" \
	--experimental-rpc-endpoint "listen-addr=0.0.0.0:${RPC_NODE_WS_PORT},cors=all,methods=unsafe,max-connections=10000" \
	--pruning archive \
	--name rpc-node \
	--no-telemetry

start_logged /tmp/faucet.log \
	env \
		PORT="$FAUCET_PORT" \
		WS_ENDPOINT="ws://127.0.0.1:${RPC_NODE_WS_PORT}" \
		FAUCET_SEED="$FAUCET_SEED" \
		DEFAULT_AMOUNT="$DEFAULT_AMOUNT" \
		MAX_AMOUNT="$MAX_AMOUNT" \
		npm --prefix "$FAUCET_DIR" start

tail -F /tmp/spec-server.log /tmp/bootnode.log /tmp/validator1.log /tmp/validator2.log /tmp/validator3.log /tmp/rpc-node.log /tmp/faucet.log &
TAIL_PID=$!

wait -n "${PIDS[@]}"
STATUS=$?
exit "$STATUS"
