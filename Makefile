# Makefile for meta.json processing

.PHONY: help process-meta validate build clean install

# Default target
help:
	@echo "Available targets:"
	@echo "  process-meta    - Remove duplicates and sort meta.json alphabetically"
	@echo "  validate        - Validate meta.json structure and content"
	@echo "  build          - Run full build process (includes process-meta)"
	@echo "  install        - Install Node.js dependencies"
	@echo "  clean          - Remove backup files and temporary files"
	@echo "  help           - Show this help message"

# Install dependencies
install:
	@echo "📦 Installing dependencies..."
	@if [ -f package.json ]; then npm install; else echo "No package.json found, skipping..."; fi

# Process meta.json - remove duplicates and sort alphabetically
process-meta:
	@echo "🔧 Processing meta.json..."
	@node dedupe-and-sort-meta.js

# Validate meta.json without modifying it
validate:
	@echo "🔍 Validating meta.json..."
	@node build-scripts/process-meta.js --verbose --no-backup --output /tmp/meta-validation.json
	@echo "✅ Validation completed"

# Full build process
build: process-meta
	@echo "🏗️ Build process completed"

# Clean backup and temporary files
clean:
	@echo "🧹 Cleaning up..."
	@find . -name "meta.json.backup.*" -type f -delete 2>/dev/null || true
	@rm -f /tmp/meta-*.json 2>/dev/null || true
	@echo "✅ Cleanup completed"

# Quick check if meta.json needs processing
check:
	@echo "🔍 Quick check for duplicates and sort order..."
	@node -e "const fs=require('fs');const d=JSON.parse(fs.readFileSync('meta.json','utf8'));const ids=d.map(i=>i.id);const unique=new Set(ids);console.log('Entries:',d.length,'Unique:',unique.size,'Duplicates:',d.length-unique.size);const sorted=[...ids].sort((a,b)=>a.toLowerCase().localeCompare(b.toLowerCase()));console.log('Sorted:',JSON.stringify(ids)===JSON.stringify(sorted)?'✅':'❌');"