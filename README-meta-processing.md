# Meta.json Processing Tools

This directory contains production-ready tools for processing `meta.json` files, specifically designed to:

- ✅ Remove duplicate entries based on `id` field
- 🔤 Sort entries alphabetically by `id`
- 🛡️ Validate JSON structure and required fields
- 💾 Create automatic backups before processing
- 🚀 Integrate with CI/CD pipelines

## Quick Start

### Simple Processing

```bash
# Process meta.json (removes duplicates, sorts alphabetically)
node dedupe-and-sort-meta.js

# Or using npm
npm run process-meta
```

### Advanced Processing

```bash
# Verbose output with validation
node build-scripts/process-meta.js --verbose

# Process different file
node build-scripts/process-meta.js --input data/meta.json --output dist/meta.json

# No backup creation
node build-scripts/process-meta.js --no-backup
```

### Using Make

```bash
# Process meta.json
make process-meta

# Validate without changes
make validate

# Quick check for issues
make check

# Full build process
make build
```

## Available Scripts

### Core Scripts

1. **`dedupe-and-sort-meta.js`** - Simple, standalone script

   - Removes duplicates (keeps first occurrence)
   - Sorts alphabetically by ID
   - Creates automatic backup
   - Provides processing statistics

2. **`build-scripts/process-meta.js`** - Production-ready script
   - All features of the simple script
   - Schema validation
   - Configurable options
   - CLI argument parsing
   - Detailed logging

### NPM Scripts

```json
{
  "process-meta": "Remove duplicates and sort meta.json",
  "process-meta-verbose": "Process with detailed output",
  "validate-meta": "Validate structure without changes",
  "build": "Full production build process"
}
```

### Make Targets

- `make process-meta` - Process the meta.json file
- `make validate` - Validate without modifying
- `make check` - Quick duplicate/sort check
- `make build` - Full build process
- `make clean` - Remove backup files

## CLI Options

```bash
Usage: node build-scripts/process-meta.js [options]

Options:
  -i, --input <file>         Input file path (default: meta.json)
  -o, --output <file>        Output file path (default: same as input)
  --no-backup               Don't create backup file
  -v, --verbose             Verbose output
  --no-schema-validation    Skip schema validation
  -h, --help                Show help message
```

## Examples

### Basic Usage

```bash
# Process current meta.json
node dedupe-and-sort-meta.js

# Output:
# 🔧 Processing meta.json...
# 📊 Found 241 total entries
# 💾 Backup created: meta.json.backup.1755066142618
# ✅ Processing completed successfully!
# 📈 Statistics:
#    • Original entries: 241
#    • Duplicates removed: 0
#    • Final entries: 241
#    • Entries sorted alphabetically by ID
# 🔤 ID range: ackee ... zitadel
```

### Production Build Integration

```bash
# In your CI/CD pipeline
npm run build

# Or with Make
make build
```

### Validation Only

```bash
# Check for issues without modifying
make validate

# Or with node directly
node build-scripts/process-meta.js --no-backup --verbose --output /tmp/test.json
```

## CI/CD Integration

### GitHub Actions

The included `.github/workflows/validate-meta.yml` workflow automatically:

- ✅ Validates JSON structure
- 🔍 Checks for duplicates
- 📋 Verifies required fields
- 🔤 Ensures alphabetical sorting
- ❌ Fails build if issues found

### Integration Examples

**Docker Build:**

```dockerfile
COPY package.json ./
COPY dedupe-and-sort-meta.js ./
COPY meta.json ./
RUN npm run process-meta
```

**Shell Script:**

```bash
#!/bin/bash
echo "Processing meta.json for production..."
node dedupe-and-sort-meta.js
if [ $? -eq 0 ]; then
    echo "✅ Meta.json processed successfully"
else
    echo "❌ Meta.json processing failed"
    exit 1
fi
```

## Schema Validation

The tools validate these required fields:

- `id` (string, unique)
- `name` (string)
- `version` (string)
- `description` (string)
- `links` (object with github property)
- `logo` (string)
- `tags` (array)

## Backup Strategy

- Automatic backups created with timestamp: `meta.json.backup.{timestamp}`
- Backups can be disabled with `--no-backup` flag
- Use `make clean` to remove old backup files

## Performance

- Processes 240+ entries in ~50ms
- Memory efficient (streams JSON)
- No external dependencies required
- Node.js 14+ compatible

## Troubleshooting

### Common Issues

1. **File not found**: Ensure `meta.json` exists in current directory
2. **Invalid JSON**: Check JSON syntax with `node -c meta.json`
3. **Permission denied**: Check file write permissions
4. **Duplicates found**: Review duplicate entries in output logs

### Debug Mode

```bash
# Enable verbose logging
node build-scripts/process-meta.js --verbose

# Check file quickly
make check
```

## License

MIT License - See project root for details.
