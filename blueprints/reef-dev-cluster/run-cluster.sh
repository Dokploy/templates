#!/usr/bin/env bash

set -euo pipefail

NODE_BIN="${NODE_BIN:-reef-node}"
CHAIN_TEMPLATE="${CHAIN_TEMPLATE:-testnet-new}"
WORK_DIR="${WORK_DIR:-/tmp/reef-dev-cluster}"
OUTPUT_DIR="${OUTPUT_DIR:-/workspace/download}"
PLAIN_SPEC="${PLAIN_SPEC:-$WORK_DIR/local-chain-spec.json}"
UPDATED_SPEC="${UPDATED_SPEC:-$WORK_DIR/local-chain-spec-updated.json}"
SPEC_FILE="${SPEC_FILE:-$OUTPUT_DIR/local-chain-spec-raw.json}"
SPEC_HTTP_PORT="${SPEC_HTTP_PORT:-8001}"
RPC_NODE_P2P_PORT="${RPC_NODE_P2P_PORT:-30337}"
RPC_NODE_WS_PORT="${RPC_NODE_WS_PORT:-9944}"
FAUCET_PORT="${FAUCET_PORT:-8080}"
DEFAULT_AMOUNT="${DEFAULT_AMOUNT:-1}"
MAX_AMOUNT="${MAX_AMOUNT:-10}"
FAUCET_SEED="${faucetsec:-${v1sec:-}}"
SCRIPTS_COMMIT="52c3e30d06bba10936aea2db9740eafd76b3ac40"
TEMPLATE_ASSET_REF="${TEMPLATE_ASSET_REF:-reef-chain}"
TEMPLATE_ASSET_BASE_URL="${TEMPLATE_ASSET_BASE_URL:-https://raw.githubusercontent.com/anukulpandey/dokploy-templates/${TEMPLATE_ASSET_REF}/blueprints/reef-dev-cluster}"

for var in v1sec v2sec v3sec; do
	if [ -z "${!var:-}" ]; then
		echo "Missing required environment variable: $var" >&2
		exit 1
	fi
done

if [ -z "$FAUCET_SEED" ]; then
	echo "Missing required faucet seed. Set faucetsec or v1sec." >&2
	exit 1
fi

PIDS=()
TAIL_PID=""

cleanup() {
	kill "$TAIL_PID" 2>/dev/null || true
	if [ "${#PIDS[@]}" -gt 0 ]; then
		kill "${PIDS[@]}" 2>/dev/null || true
	fi
}

trap cleanup EXIT

derive_address() {
	local suri="$1"

	"$NODE_BIN" key inspect --scheme Sr25519 "$suri" --output-type json \
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

V1_ADDR=$(derive_address "$v1sec")
V2_ADDR=$(derive_address "$v2sec")
V3_ADDR=$(derive_address "$v3sec")

HELPER_DIR="$WORK_DIR/spec-generator"
FAUCET_DIR="/workspace/faucet"

rm -rf "$WORK_DIR" "$OUTPUT_DIR" /tmp/validator1 /tmp/validator2 /tmp/validator3 /tmp/rpc-node /tmp/bootnode
mkdir -p "$HELPER_DIR" "$OUTPUT_DIR" "$FAUCET_DIR"

echo "Downloading self-contained cluster helpers..."
wget -q -O "$HELPER_DIR/update-spec.py" \
	"https://raw.githubusercontent.com/anukulpandey/dokploy-reef-chain-scripts/${SCRIPTS_COMMIT}/spec-generator/scripts/update-spec.py"
wget -q -O "$HELPER_DIR/update-spec.sh" \
	"https://raw.githubusercontent.com/anukulpandey/dokploy-reef-chain-scripts/${SCRIPTS_COMMIT}/spec-generator/scripts/update-spec.sh"
chmod +x "$HELPER_DIR/update-spec.sh"

echo "Downloading local faucet sources..."
wget -q -O "$FAUCET_DIR/package.json" \
	"${TEMPLATE_ASSET_BASE_URL}/faucet/package.json"
wget -q -O "$FAUCET_DIR/server.js" \
	"${TEMPLATE_ASSET_BASE_URL}/faucet/server.js"

echo "Installing faucet dependencies..."
(
	cd "$FAUCET_DIR"
	npm install --omit=dev
)

echo "Generating chain spec..."
"$NODE_BIN" build-spec --chain "$CHAIN_TEMPLATE" --disable-default-bootnode > "$PLAIN_SPEC"

"$HELPER_DIR/update-spec.sh" \
	--v1_addr "$V1_ADDR" --v1_sec "$v1sec" \
	--v2_addr "$V2_ADDR" --v2_sec "$v2sec" \
	--v3_addr "$V3_ADDR" --v3_sec "$v3sec" \
	--input "$PLAIN_SPEC" \
	--output "$UPDATED_SPEC"

"$NODE_BIN" build-spec \
	--chain "$UPDATED_SPEC" \
	--disable-default-bootnode \
	--raw > "$SPEC_FILE"

echo "Generating node identities..."
BOOTNODE_NODE_KEY_FILE="$WORK_DIR/bootnode_node_key.txt"
V1_NODE_KEY_FILE="$WORK_DIR/v1_node_key.txt"
V2_NODE_KEY_FILE="$WORK_DIR/v2_node_key.txt"
V3_NODE_KEY_FILE="$WORK_DIR/v3_node_key.txt"
RPC_NODE_KEY_FILE="$WORK_DIR/rpc_node_key.txt"

"$NODE_BIN" key generate-node-key --chain local > "$BOOTNODE_NODE_KEY_FILE"
"$NODE_BIN" key generate-node-key --chain local > "$V1_NODE_KEY_FILE"
"$NODE_BIN" key generate-node-key --chain local > "$V2_NODE_KEY_FILE"
"$NODE_BIN" key generate-node-key --chain local > "$V3_NODE_KEY_FILE"
"$NODE_BIN" key generate-node-key --chain local > "$RPC_NODE_KEY_FILE"

BOOTNODE_PEER_ID=$("$NODE_BIN" key inspect-node-key --file "$BOOTNODE_NODE_KEY_FILE" 2>/dev/null | tail -n1 | tr -d '\r')
if [ -z "$BOOTNODE_PEER_ID" ]; then
	echo "Failed to derive bootnode peer id" >&2
	exit 1
fi

printf '%s\n' "$BOOTNODE_PEER_ID" > "$OUTPUT_DIR/bootnode_node_key.txt"
printf '%s\n' "$BOOTNODE_PEER_ID" > "$OUTPUT_DIR/bootnode_peer_id.txt"

insert_keys /tmp/validator1 "$v1sec"
insert_keys /tmp/validator2 "$v2sec"
insert_keys /tmp/validator3 "$v3sec"

python3 -m http.server "$SPEC_HTTP_PORT" --bind 0.0.0.0 --directory "$OUTPUT_DIR" >/tmp/spec-server.log 2>&1 &
PIDS+=("$!")

BOOTNODE_MULTIADDR="/ip4/127.0.0.1/tcp/30335/p2p/$BOOTNODE_PEER_ID"

start_logged /tmp/bootnode.log \
	"$NODE_BIN" \
	--base-path /tmp/bootnode \
	--chain "$SPEC_FILE" \
	--port 30335 \
	--node-key-file "$BOOTNODE_NODE_KEY_FILE" \
	--name Bootnode \
	--no-telemetry

start_logged /tmp/validator1.log \
	"$NODE_BIN" \
	--base-path /tmp/validator1 \
	--chain "$SPEC_FILE" \
	--port 30333 \
	--node-key-file "$V1_NODE_KEY_FILE" \
	--bootnodes "$BOOTNODE_MULTIADDR" \
	--validator \
	--name Validator1 \
	--no-telemetry

start_logged /tmp/validator2.log \
	"$NODE_BIN" \
	--base-path /tmp/validator2 \
	--chain "$SPEC_FILE" \
	--port 30334 \
	--node-key-file "$V2_NODE_KEY_FILE" \
	--bootnodes "$BOOTNODE_MULTIADDR" \
	--validator \
	--name Validator2 \
	--no-telemetry

start_logged /tmp/validator3.log \
	"$NODE_BIN" \
	--base-path /tmp/validator3 \
	--chain "$SPEC_FILE" \
	--port 30336 \
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
	--node-key-file "$RPC_NODE_KEY_FILE" \
	--bootnodes "$BOOTNODE_MULTIADDR" \
	--rpc-external \
	--rpc-port "$RPC_NODE_WS_PORT" \
	--rpc-cors all \
	--rpc-methods Unsafe \
	--rpc-max-connections 10000 \
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
