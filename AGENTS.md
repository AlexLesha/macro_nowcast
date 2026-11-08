# Macro Nowcast - Agent Guidelines & Rules

## Project Structure
- `frontend/`: Web Application (Next.js 15, React 19, Tailwind CSS). Deploys to Cloudflare Pages (`https://macro-nowcast.pages.dev`).
- `backend/`: Quant engine and ingestion pipelines (FastAPI, Python).
- `android_app/`: **Local Mobile / APK Container**. Isolated native wrapper app for Android (Capacitor 7 + Gradle).

## Core Rules & Separation Directives
1. **Strict Mobile / Web Separation**:
   - All Android APK and mobile app development work files must be kept exclusively inside `android_app/`.
   - Never inject Capacitor packages, Android folders, Gradle configs, or APK artifacts into `frontend/`.
   - Keep `frontend/` dedicated purely to the web project.
2. **Exclusion from Git & Cloudflare**:
   - `android_app/` and all `*.apk` files are local-only and excluded in `.gitignore` and `.cfignore`.
   - Never stage, commit, or push native Android build trees or APK binaries to the repository.
   - Cloudflare Pages builds must never process or be affected by mobile work files.

