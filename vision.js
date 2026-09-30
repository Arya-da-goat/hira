/*
 * Kira Local Vision
 * No OpenAI/paid API is used.
 *
 * Uses Transformers.js + HuggingFaceTB/SmolVLM-256M-Instruct.
 * The model is downloaded once and cached by the browser.
 * Inference runs locally (WebGPU when available, otherwise WASM).
 */

let visionPipePromise = null;

const VISION_MODEL = 'HuggingFaceTB/SmolVLM-256M-Instruct';

function hasWebGPU() {
  return typeof navigator !== 'undefined' && !!navigator.gpu;
}

export async function loadVisionModel(onProgress = () => {}) {
  if (!visionPipePromise) {
    visionPipePromise = (async () => {
      onProgress('Loading Kira vision engine…');

      const { pipeline, env } = await import(
        'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1'
      );

      // Browser cache. Nothing is uploaded to a Kira server.
      env.allowLocalModels = false;
      env.useBrowserCache = true;

      const device = hasWebGPU() ? 'webgpu' : 'wasm';

      onProgress(
        device === 'webgpu'
          ? 'Loading local vision model (WebGPU)…'
          : 'Loading local vision model (CPU/WASM)…'
      );

      const options = {
        device,
        dtype: device === 'webgpu' ? 'q4' : 'q8',
        progress_callback: (p) => {
          if (p?.status === 'progress' && Number.isFinite(p.progress)) {
            onProgress(`Downloading vision model: ${Math.round(p.progress)}%`);
          }
        }
      };

      return await pipeline('image-text-to-text', VISION_MODEL, options);
    })().catch(error => {
      visionPipePromise = null;
      throw error;
    });
  }

  return visionPipePromise;
}

export async function inspectImages(files, prompt, onProgress = () => {}) {
  const images = files.filter(f => f?.type?.startsWith('image/')).slice(0, 6);
  if (!images.length) {
    throw new Error('No image files were provided.');
  }

  const pipe = await loadVisionModel(onProgress);
  const objectUrls = images.map(file => URL.createObjectURL(file));

  try {
    const content = [
      ...objectUrls.map(() => ({ type: 'image' })),
      {
        type: 'text',
        text: prompt?.trim() ||
          'Inspect these images carefully. Explain what is visible, identify important objects, read clearly visible text when possible, and say when something is uncertain.'
      }
    ];

    onProgress('Inspecting image locally…');

    const messages = [{
      role: 'user',
      content
    }];

    const output = await pipe(messages, {
      images: objectUrls,
      max_new_tokens: 320,
      return_full_text: false
    });

    const generated = output?.[0]?.generated_text;

    if (Array.isArray(generated)) {
      const last = generated.at(-1);
      return typeof last === 'string'
        ? last.trim()
        : last?.content?.map(x => x.text || '').join(' ').trim();
    }

    return String(generated || '').trim();
  } finally {
    objectUrls.forEach(url => URL.revokeObjectURL(url));
  }
}
