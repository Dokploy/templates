#!/bin/bash
# Unit test for dokploy-prom-monitoring-extension template

set -e

TEMPLATE_ID="dokploy-prom-monitoring-extension"
TEMPLATE_DIR="blueprints/$TEMPLATE_ID"

echo "========================================"
echo "Testing: $TEMPLATE_ID"
echo "========================================"

# Test 1: Directory structure
echo ""
echo "Test 1: Validate directory structure"
if [ ! -d "$TEMPLATE_DIR" ]; then
  echo "❌ FAIL: Template directory does not exist"
  exit 1
fi
echo "✅ PASS: Template directory exists"

# Test 2: Required files
echo ""
echo "Test 2: Validate required files exist"
FILES=("docker-compose.yml" "template.toml" "logo.svg" "README.md")
for file in "${FILES[@]}"; do
  if [ ! -f "$TEMPLATE_DIR/$file" ]; then
    echo "❌ FAIL: Missing required file: $file"
    exit 1
  fi
  echo "✅ PASS: Found $file"
done

# Test 3: docker-compose.yml validation
echo ""
echo "Test 3: Validate docker-compose.yml syntax"
cd "$TEMPLATE_DIR"
if ! docker compose config > /dev/null 2>&1; then
  echo "❌ FAIL: docker-compose.yml has syntax errors"
  exit 1
fi
echo "✅ PASS: docker-compose.yml is valid"
cd - > /dev/null

# Test 4: Check service image
echo ""
echo "Test 4: Validate service image"
IMAGE=$(grep "image:" "$TEMPLATE_DIR/docker-compose.yml" | head -1 | awk '{print $2}')
if [ -z "$IMAGE" ]; then
  echo "❌ FAIL: No image specified in docker-compose.yml"
  exit 1
fi
echo "✅ PASS: Image specified: $IMAGE"

# Test 5: Check for Docker socket mount
echo ""
echo "Test 5: Validate Docker socket mount"
if ! grep -q "/var/run/docker.sock" "$TEMPLATE_DIR/docker-compose.yml"; then
  echo "❌ FAIL: Docker socket mount not found"
  exit 1
fi
echo "✅ PASS: Docker socket mount found"

# Test 6: Validate template.toml has required sections
echo ""
echo "Test 6: Validate template.toml structure"
if ! grep -q "\[variables\]" "$TEMPLATE_DIR/template.toml"; then
  echo "❌ FAIL: Missing [variables] section in template.toml"
  exit 1
fi
if ! grep -q "\[\[config.domains\]\]" "$TEMPLATE_DIR/template.toml"; then
  echo "❌ FAIL: Missing [[config.domains]] section in template.toml"
  exit 1
fi
if ! grep -q "\[\[config.env\]\]" "$TEMPLATE_DIR/template.toml"; then
  echo "❌ FAIL: Missing [[config.env]] section in template.toml"
  exit 1
fi
echo "✅ PASS: template.toml has required sections"

# Test 7: Validate environment variables
echo ""
echo "Test 7: Validate METRICS_CONFIG in template.toml"
if ! grep -q "METRICS_CONFIG" "$TEMPLATE_DIR/template.toml"; then
  echo "❌ FAIL: METRICS_CONFIG environment variable not found"
  exit 1
fi
# Note: Using string matching to verify JSON structure is embedded correctly
# This is intentional - we're validating the template configuration, not runtime JSON
# Check for key configuration fields in METRICS_CONFIG
for field in "refreshRate" "port" "token" "urlCallback" "retentionDays" "thresholds" "prometheus"; do
  if ! grep -q "\"$field\"" "$TEMPLATE_DIR/template.toml"; then
    echo "❌ FAIL: Missing $field in METRICS_CONFIG"
    exit 1
  fi
done
echo "✅ PASS: METRICS_CONFIG has all required fields"

# Test 8: Validate meta.json entry
echo ""
echo "Test 8: Validate meta.json entry"
if ! jq -e ".[] | select(.id == \"$TEMPLATE_ID\")" meta.json > /dev/null; then
  echo "❌ FAIL: Template entry not found in meta.json"
  exit 1
fi
echo "✅ PASS: Template entry found in meta.json"

# Test 9: Validate meta.json required fields
echo ""
echo "Test 9: Validate meta.json entry has all required fields"
ENTRY=$(jq ".[] | select(.id == \"$TEMPLATE_ID\")" meta.json)
for field in "id" "name" "version" "description" "logo" "links" "tags"; do
  if ! echo "$ENTRY" | jq -e ".$field" > /dev/null; then
    echo "❌ FAIL: Missing required field in meta.json: $field"
    exit 1
  fi
done
echo "✅ PASS: All required fields present in meta.json"

# Test 10: Validate logo file matches meta.json
echo ""
echo "Test 10: Validate logo file"
LOGO=$(jq -r ".[] | select(.id == \"$TEMPLATE_ID\") | .logo" meta.json)
if [ ! -f "$TEMPLATE_DIR/$LOGO" ]; then
  echo "❌ FAIL: Logo file not found: $TEMPLATE_DIR/$LOGO"
  exit 1
fi
# Verify it's an SVG file
if ! file "$TEMPLATE_DIR/$LOGO" | grep -q "SVG"; then
  echo "❌ FAIL: Logo is not an SVG file"
  exit 1
fi
echo "✅ PASS: Logo file is valid SVG"

# Test 11: Validate tags
echo ""
echo "Test 11: Validate template tags"
TAGS=$(jq -r ".[] | select(.id == \"$TEMPLATE_ID\") | .tags | length" meta.json)
if [ "$TAGS" -eq 0 ]; then
  echo "❌ FAIL: Template has no tags"
  exit 1
fi
# Check for monitoring-related tags
if ! jq -e ".[] | select(.id == \"$TEMPLATE_ID\") | .tags | map(select(. == \"monitoring\" or . == \"prometheus\")) | length > 0" meta.json > /dev/null; then
  echo "⚠️  WARNING: Template should have monitoring or prometheus tags"
fi
echo "✅ PASS: Template has $TAGS tags"

# Test 12: Validate README exists and has content
echo ""
echo "Test 12: Validate README.md"
if [ ! -s "$TEMPLATE_DIR/README.md" ]; then
  echo "❌ FAIL: README.md is empty or missing"
  exit 1
fi
# Check for key sections
for section in "Features" "Configuration" "Quick Start"; do
  if ! grep -qi "$section" "$TEMPLATE_DIR/README.md"; then
    echo "⚠️  WARNING: README should include $section section"
  fi
done
echo "✅ PASS: README.md exists and has content"

# Test 13: Validate Prometheus endpoint is mentioned
echo ""
echo "Test 13: Validate Prometheus integration"
if ! grep -q "/metrics/prometheus" "$TEMPLATE_DIR/README.md"; then
  echo "❌ FAIL: Prometheus metrics endpoint not documented"
  exit 1
fi
if ! grep -q "prometheus" "$TEMPLATE_DIR/template.toml"; then
  echo "❌ FAIL: Prometheus configuration not found in template.toml"
  exit 1
fi
echo "✅ PASS: Prometheus integration is documented and configured"

# Test 14: Validate configurable variables
echo ""
echo "Test 14: Validate configurable variables"
REQUIRED_VARS=("main_domain" "monitoring_token" "refresh_rate" "callback_url" "server_type" "retention_days" "cpu_threshold" "memory_threshold")
for var in "${REQUIRED_VARS[@]}"; do
  if ! grep -q "^$var = " "$TEMPLATE_DIR/template.toml"; then
    echo "❌ FAIL: Missing required variable: $var"
    exit 1
  fi
done
echo "✅ PASS: All required variables are defined"

echo ""
echo "========================================"
echo "✅ ALL TESTS PASSED"
echo "========================================"
echo ""
echo "Summary:"
echo "  Template ID: $TEMPLATE_ID"
echo "  Image: $IMAGE"
echo "  Logo: $LOGO"
echo "  Tags: $(jq -r ".[] | select(.id == \"$TEMPLATE_ID\") | .tags | join(\", \")" meta.json)"
echo ""
