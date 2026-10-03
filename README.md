# Kira v19 — Professional Local

Kira is a local-first browser assistant designed for GitHub Pages. This build focuses on a polished chat experience, privacy, deterministic local reasoning, file/image inspection, personalization and optional browser-based research navigation.

## Highlights
- Natural adaptive conversation and follow-up context.
- Local personalization stored in browser storage.
- Local calculations, conversions and curated knowledge.
- Image diagnostics using browser APIs; no automatic reverse-search redirect.
- Explicit reverse-search buttons only.
- File/text inspection in-browser.
- Optional multi-source research links without a search API.
- Conversation search, share/copy, TXT export and JSON export.
- Responsive mobile/desktop settings UI.
- Theme and accent preferences.
- No OpenAI, Gemini, Hugging Face or other AI API.

## Privacy
Normal questions and local analysis remain in the browser. Research links open external websites only when research is requested. Export files are generated locally.

## GitHub Pages
Upload the project contents to a repository and enable GitHub Pages. The site is static and does not require a server.

## Important limitation
A static browser application without local model weights cannot provide unrestricted generative intelligence comparable to a hosted frontier model. Kira therefore uses deterministic local reasoning and curated knowledge rather than pretending that it has access to a hidden AI service.


## Kira v20 personalization and voices

Kira v20 adds persistent local personalization and browser-native voice selection. Voice synthesis uses the device's Web Speech API and does not require a voice API. Available voices depend on the browser/OS. Preferences are stored locally in the browser.


## Kira v21 UI fix

Personalization and voice controls are now contained inside the Settings subpages instead of being injected into the chat screen. Browser-native voice selection, preview, speed and pitch are persisted locally. The main chat layout remains clean and mobile-friendly.
