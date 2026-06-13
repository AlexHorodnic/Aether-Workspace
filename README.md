# Aether Workspace

A privacy-first AI workspace that runs an open-source language model directly in the browser. Aether combines local streaming chat, reusable prompt templates, and document-grounded answers without sending prompts or files to an application server.

## Why it is different

- **No paid inference API:** WebLLM runs the selected open-source model with WebGPU on the visitor's device.
- **No exposed API key:** there is no shared AI endpoint or browser credential to steal.
- **Private knowledge retrieval:** PDF and text content is extracted locally, chunked, and stored in IndexedDB.
- **Cited answers:** relevant chunks are selected locally and included as named sources in chat.
- **Abuse-resistant architecture:** compute cost belongs to each device, while prompt length, duplicate, cooldown, and per-minute limits prevent accidental local spam.

## Local model profiles

Aether offers four browser-local profiles:

- **Fast:** SmolLM2 1.7B
- **Balanced:** Llama 3.2 3B
- **Smart:** Qwen 2.5 3B
- **High Quality:** Qwen 3 4B

Larger profiles require more GPU memory and take longer to download. When a non-compatibility model load fails, Aether releases the failed worker and retries with the Fast profile. Missing WebGPU is reported directly because switching models cannot fix an unsupported device.

Gemma 3 4B is not listed because it is not currently available in WebLLM's supported prebuilt model catalog. Online search, weather, news, market data, and unrestricted browsing are also intentionally excluded from the frontend-only build: those capabilities require a secured gateway, provider contracts, rate limits, and monitoring rather than exposed browser credentials.

## Product flow

1. Activate the local model from Chat. The first run downloads model assets and caches them in the browser.
2. Add PDF, Markdown, text, CSV, JSON, or source-code files in Knowledge.
3. Assign sources to workspace collections.
4. Ask a question. Aether retrieves matching local chunks and streams a source-grounded response.

## Architecture

- Angular 21 standalone components with feature-first lazy routes
- Signals and computed state for UI and workspace stores
- Web Worker-based WebLLM inference to keep generation off the UI thread
- PDF.js and browser file APIs for local extraction
- IndexedDB for document contents; guarded local storage for lightweight preferences and chat history
- Lexical retrieval with ranked chunks and inline source references
- Vitest behavioral tests and GitHub Actions CI

The AI and PDF engines are dynamically loaded. The production initial bundle remains below the configured 500 kB warning budget.

## Local development

Requirements: Node.js 24, npm 11, and a current Chromium browser with WebGPU.

```bash
npm ci
npm start
```

Open `http://localhost:4200`.

## Verification

```bash
npm run typecheck
npm run test:ci
npm run build
npm audit --omit=dev
```

## Privacy and limitations

- Documents, prompts, and conversations remain in the current browser profile.
- Model files are downloaded from the WebLLM/Hugging Face distribution used by the library.
- WebGPU support, model availability, download size, and generation speed depend on the browser and device GPU.
- Local models are less capable than large hosted models and can still produce inaccurate output.
- Retrieval is intentionally lightweight and local; it is not a hosted vector database.
- Clearing browser site data removes stored workspace content.

## Security

Aether does not accept or store API keys. Uploaded content is processed locally and is never sent to the application host. File type and size checks limit processing risk, generated output is rendered as text rather than trusted HTML, and CI runs type checking, tests, and production builds on every change.
