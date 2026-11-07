# Developer shortcuts for the iPIXEL Color integration
#   make setup   - create .venv with all dev dependencies
#   make test    - run the test suite (simulated panels, no hardware)
#   make lint    - ruff
#   make format  - ruff --fix
#   make card    - rebuild the Lovelace card bundle
#   make clean   - remove caches
#
# The pytest plugin pins the Home Assistant core it tests against; releases
# for Home Assistant 2026.3+ need Python 3.14 (make setup PYTHON=python3.14).

PYTHON ?= python3
VENV   := .venv
PY     := $(VENV)/bin/python
PIP    := $(VENV)/bin/pip
WWW    := custom_components/ipixel_color/www

# Home Assistant pins its own dependencies (bleak, habluetooth, numpy, ...).
# Installing with those constraints keeps the venv identical to a real core.
CONSTRAINTS = "$$($(PY) -c 'import homeassistant, pathlib; print(pathlib.Path(homeassistant.__file__).parent / "package_constraints.txt")')"

# manylinux wheels (numpy) need libstdc++; NixOS keeps it out of the default
# library path, so point the dynamic loader at the compiler's copy.
ifneq ($(wildcard /etc/NIXOS),)
LIBSTDCXX := $(patsubst %/,%,$(dir $(filter /%,$(shell gcc -print-file-name=libstdc++.so.6 2>/dev/null))))
ifneq ($(LIBSTDCXX),)
export LD_LIBRARY_PATH := $(LIBSTDCXX)$(if $(LD_LIBRARY_PATH),:$(LD_LIBRARY_PATH))
endif
endif

.PHONY: setup test lint format card clean

setup: $(VENV)/bin/activate

$(VENV)/bin/activate: requirements_dev.txt
	$(PYTHON) -m venv $(VENV)
	$(PIP) install --upgrade pip
	$(PIP) install "pytest-homeassistant-custom-component>=0.13.100"
	$(PIP) install -r requirements_dev.txt -c $(CONSTRAINTS)
	@touch $@

test: setup
	$(PY) -m pytest -q

lint: setup
	$(VENV)/bin/ruff check custom_components tests

format: setup
	$(VENV)/bin/ruff check --fix custom_components tests

card:
	cd $(WWW) && npm ci --no-audit --no-fund && npm run build && rm -f ipixel-display-card.js.map

clean:
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	rm -rf .pytest_cache .ruff_cache .coverage
