.RECIPEPREFIX := >
PY := .venv/bin/python
export PYTHONPATH := .

setup:
> python3 -m venv .venv && .venv/bin/pip install -U pip && .venv/bin/pip install -r requirements.txt
setup-ml:
> .venv/bin/pip install -r requirements-ml.txt
fixtures:
> $(PY) -m shared.make_fixtures
seed:
> $(PY) -m backend.simulator.simulate --days 30
backend:
> .venv/bin/uvicorn backend.app.main:app --reload --port 8000
mcp:
> $(PY) -m agents.mcp_server
test:
> .venv/bin/pytest -q tests
smoke:
> $(PY) scripts/smoke.py
types:
> bash scripts/gen_types.sh
check: fixtures test
> @echo "contract + tests OK"
