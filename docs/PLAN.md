# Multi-Agent Orchestration Plan: Option A (Codebase Housekeeping)

## 🎯 Objective
Clean up the BizTrackr PRO codebase by organizing the backend monolith, isolating management/verification scripts, and aligning the frontend with clean Code standards.

---

## 🛠️ Phase 2 Implementation Breakdown

### 1. Backend Refactor (`backend-specialist`)
* **Script Consolidation:** Move all loose `verify_*.py`, `seed_*.py`, and `debug_*.py` files from the `backend/` root into the `backend/scripts/` directory.
* **Import Corrections:** Adjust absolute/relative imports in these scripts so they can still run correctly from within the `scripts/` folder (e.g., ensuring `app.db` can be imported).

### 2. Frontend Polish (`frontend-specialist` / `@senior-frontend`)
* **Cleanup:** Run static analysis and linting across the Next.js frontend to ensure there's no major tech debt.
* **Health Check:** Profile the frontend dependencies to reduce heavy packages.

### 3. Polish & Delivery (`test-engineer` & `devops-engineer`)
* **Verification & Testing**: 
  * Execute moved scripts briefly to ensure no broken imports post-refactor.
* **Infrastructure**: 
  * Ensure Docker builds still work smoothly.

---

## 📅 Verification Strategy
- **Security Audit**: Ensure `<skill: vulnerability-scanner>` `security_scan.py` passes.
- **Lint Validation**: Ensure `<skill: lint-and-validate>` `lint_runner.py` passes.
