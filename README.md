# Kira 3 — Free & Local-First

Kira's design goal is:

> **Free to use. No paid AI API required.**

## What this version does

### 🖼️ Local image understanding
Kira uses **Transformers.js** and **HuggingFaceTB/SmolVLM-256M-Instruct** directly in the browser.

- No OpenAI API key.
- No paid inference API.
- Images are sent to a Kira server: **no**.
- Inference happens locally in the browser.
- WebGPU is used when available; WASM/CPU is the fallback.
- The model is downloaded and cached by the browser.

Transformers.js supports running models in the browser and can use WebGPU for accelerated inference. Hugging Face also provides a SmolVLM WebGPU demo based on this model family.

### 🌐 Free multi-source research
Kira still uses public web sources such as:
- Wikipedia
- Wikidata
- OpenAlex
- Crossref
- DuckDuckGo Instant Answers

Web sources are separate from the local AI. They may have their own availability/rate limits.

### 📚 Long messages
Long messages are:
1. cleaned,
2. split into meaningful sentence chunks,
3. keyword-ranked,
4. searched using several smaller queries,
5. combined into a response.

## First image use

The first time Kira loads the vision model, it may take a while because the model has to download. Afterward the browser can cache it.

A device with WebGPU will generally be much better suited to local inference. On weaker phones, image analysis can be slow.

## Run locally

You need a local web server because browser module/security rules are restrictive when opening HTML directly as a `file://` page.

If Python is installed:

```bash
python -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

## GitHub Pages

The project is static and can be deployed to GitHub Pages. The browser will download the vision model from Hugging Face the first time it is needed.

## Important meaning of "unlimited"

Kira itself has no per-user AI message counter or paid API quota.

It is not literally infinite:
- your device has finite RAM/CPU/GPU,
- browser storage/cache is finite,
- downloading the model requires internet,
- public web sources can rate-limit requests.

But the AI inference does not consume a paid per-request API quota.

## Model

Vision model:
`HuggingFaceTB/SmolVLM-256M-Instruct`

License: Apache-2.0 according to the model metadata.

For a stronger local vision model, a future desktop edition can offer larger models when the user's hardware can handle them.
