# Setup guide (everyone, ~15 minutes). Verify with the checklist at the bottom.

## 0. Prerequisites
- Git, Python 3.11 or 3.12 (avoid 3.13 for now: some ML wheels like OR-Tools may lag), Node 18+ (Person C), `make`.
- Windows: use **WSL2 (Ubuntu)** and run everything inside it (simplest). Native Windows cheatsheet is in section 6.
- Optional: Docker is NOT needed (we use SQLite). A Gemini API key is needed only for B (https://aistudio.google.com).

## 1. Get the code (once, by one person)
```bash
unzip waste-copilot.zip && cd waste-copilot
git init && git add . && git commit -m "scaffold"
git remote add origin <your-repo-url> && git push -u origin main     # teammates: git clone <your-repo-url>
git checkout -b a/work      # or b/work, c/work (one branch per person)
```
Then edit `.github/CODEOWNERS` with real GitHub handles.

## 2. Install and run (everyone)
```bash
cp .env.example .env        # add GEMINI_API_KEY only if you are B
make setup                  # venv + core deps
make fixtures               # regenerate mock data from schemas
make seed                   # synthetic 30-day SQLite DB at data/waste.db
make test                   # must pass (7 tests)
make backend                # API at http://localhost:8000  (docs at /docs)
make smoke                  # in a second terminal: every endpoint, schema-validated
```
Heavy ML libs (A: LightGBM, OR-Tools; B: RAG): `make setup-ml` (a few minutes; needs good wifi).

## 3. Person-specific setup
**A (backend):** after `make setup-ml`, work in `backend/app/real.py`. Flip endpoints one at a time:
`REAL_ENDPOINTS=bins,forecast make backend` (comma list: bins, readings, forecast, routes, kpis, trends, compare). `USE_MOCKS=false` flips all that are implemented.
**B (agents):** put `GEMINI_API_KEY` in `.env`; check which model is free for your key in AI Studio and set `GEMINI_MODEL`. Run `make mcp` (stdio server).
Claude Desktop config (Settings -> Developer -> Edit Config), use ABSOLUTE paths:
```json
{"mcpServers": {"campus-waste": {
  "command": "/ABS/PATH/waste-copilot/.venv/bin/python",
  "args": ["-m", "agents.mcp_server"],
  "env": {"PYTHONPATH": "/ABS/PATH/waste-copilot", "API_BASE_URL": "http://localhost:8000/api/v1"}}}}
```
Restart Claude Desktop; the backend must be running. RAG: download the rules PDFs into `agents/rag/corpus/` (see `agents/rag/manifest.yaml`).
**C (frontend):**
```bash
cd frontend
npm create vite@latest . -- --template react-ts     # choose "Ignore files and continue" when asked
npm i && npm i leaflet react-leaflet recharts openapi-typescript
cd .. && make backend &        # backend must be up
make types                     # generates frontend/src/api/types.ts from /openapi.json
cd frontend && npm run dev     # http://localhost:5173 (CORS already allowed by the backend)
```

## 4. Daily workflow
`git pull --rebase origin main` -> work on your branch -> `make test` (+ `make smoke` if backend is running) -> PR -> merge at least every 2 hours.
Changing anything in `/shared`? Tell the others first (CONTEXT.md rule), then run `make fixtures`.

## 5. Troubleshooting
- `ModuleNotFoundError: shared` -> run through `make` (it sets PYTHONPATH=.) or `export PYTHONPATH=.`.
- Port 8000 busy -> `make backend` after stopping the other process, or run uvicorn with `--port 8001` and set `API_BASE_URL`/`VITE_API_BASE`.
- Gemini `429`/quota errors -> wait, keep `LLM_CACHE` on, reduce parallel calls, or use the cached/deterministic path.
- `ortools`/`lightgbm` install fails -> use Python 3.11/3.12; `pip install -U pip` first.
- Frontend can't reach API -> backend running? `VITE_API_BASE` correct? Hit http://localhost:8000/api/v1/health.
- `make: *** missing separator` -> don't convert the Makefile's `>` recipe prefix to tabs/spaces.
- Tests fail after pulling -> `make fixtures && make test` (fixtures may have changed).

## 6. Native Windows (if you cannot use WSL2)
```bat
python -m venv .venv && .venv\Scripts\pip install -r requirements.txt
set PYTHONPATH=.
.venv\Scripts\python -m shared.make_fixtures
.venv\Scripts\python -m backend.simulator.simulate --days 30
.venv\Scripts\pytest -q tests
.venv\Scripts\uvicorn backend.app.main:app --reload --port 8000
.venv\Scripts\python scripts\smoke.py
```
(For the Claude Desktop config use `.venv\\Scripts\\python.exe` and Windows paths.)

## 7. Verification checklist (all must be true before you start building)
- [ ] `make test` -> 7 passed
- [ ] http://localhost:8000/docs opens and `/api/v1/bins` returns 40 bins
- [ ] `make smoke` -> SMOKE PASSED
- [ ] You have read CONTEXT.md, docs/FEATURES.md, and pasted the PREAMBLE from docs/PROMPTS.md into your AI
