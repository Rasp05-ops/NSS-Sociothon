#!/usr/bin/env bash
# OWNER: C. Regenerates TS types from the running backend. Never hand-write API types.
set -euo pipefail
cd "$(dirname "$0")/../frontend"
npx openapi-typescript "${API_BASE_URL%/api/v1}/openapi.json" -o src/api/types.ts 2>/dev/null \
  || npx openapi-typescript http://localhost:8000/openapi.json -o src/api/types.ts
echo "wrote frontend/src/api/types.ts"
