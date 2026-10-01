/* Kira Local AI Engine
 * Runs in the browser with Transformers.js. No API key or backend is required.
 * First launch downloads the model; subsequent launches use browser cache.
 */
(function () {
  const TEXT_MODEL = 'HuggingFaceTB/SmolLM2-360M-Instruct';
  const VISION_MODEL = 'HuggingFaceTB/SmolVLM-256M-Instruct';
  let transformersPromise;
  let textPipePromise;
  let visionPipePromise;
  let captionPipePromise;
  let busy = false;

  function emit(type, detail = {}) {
    window.dispatchEvent(new CustomEvent('kira-ai-status', { detail: { type, ...detail } }));
  }

  async function transformers() {
    if (!transformersPromise) {
      transformersPromise = import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1');
    }
    return transformersPromise;
  }

  async function chooseDevice() {
    try {
      if (navigator.gpu) {
        const adapter = await navigator.gpu.requestAdapter();
        if (adapter) return 'webgpu';
      }
    } catch (_) {}
    return 'wasm';
  }

  function generationOptions(device) {
    return {
      device,
      dtype: device === 'webgpu' ? 'q4f16' : 'q4',
      progress_callback: p => emit('progress', p || {})
    };
  }

  async function getTextPipe() {
    if (!textPipePromise) {
      textPipePromise = (async () => {
        emit('loading', { model: TEXT_MODEL, kind: 'text' });
        const { pipeline, env } = await transformers();
        env.allowRemoteModels = true;
        env.allowLocalModels = false;
        const device = await chooseDevice();
        emit('device', { device, kind: 'text' });
        const pipe = await pipeline('text-generation', TEXT_MODEL, generationOptions(device));
        emit('ready', { model: TEXT_MODEL, device, kind: 'text' });
        return pipe;
      })().catch(error => {
        textPipePromise = null;
        emit('error', { kind: 'text', message: error?.message || String(error) });
        throw error;
      });
    }
    return textPipePromise;
  }

  async function getVisionPipe() {
    if (!visionPipePromise) {
      visionPipePromise = (async () => {
        emit('loading', { model: VISION_MODEL, kind: 'vision' });
        const { pipeline, env } = await transformers();
        env.allowRemoteModels = true;
        env.allowLocalModels = false;
        const device = await chooseDevice();
        emit('device', { device, kind: 'vision' });
        const pipe = await pipeline('image-text-to-text', VISION_MODEL, generationOptions(device));
        emit('ready', { model: VISION_MODEL, device, kind: 'vision' });
        return pipe;
      })().catch(error => {
        visionPipePromise = null;
        emit('error', { kind: 'vision', message: error?.message || String(error) });
        throw error;
      });
    }
    return visionPipePromise;
  }

  function cleanOutput(result) {
    if (!result) return '';
    const item = Array.isArray(result) ? result[0] : result;
    let text = item?.generated_text ?? item?.text ?? '';
    if (Array.isArray(text)) text = text.at(-1)?.content || text.at(-1)?.text || '';
    if (typeof text === 'object') text = text.content || text.text || '';
    return String(text).trim();
  }

  async function answer(messages, options = {}) {
    if (busy) throw new Error('Kira is still finishing the previous response.');
    busy = true;
    try {
      const generator = await getTextPipe();
      const system = {
        role: 'system',
        content: 'You are Kira, a helpful, clear, accurate AI assistant. Understand the user\'s entire sentence and intent. Answer directly without talking about web searching. For definitions, give a simple definition followed by an example when useful. For long questions, address every important part. Do not invent facts; say when you are unsure. Keep the answer concise unless the user asks for detail.'
      };
      const history = Array.isArray(messages) ? messages.slice(-8) : [];
      const output = await generator([system, ...history], {
        max_new_tokens: Math.min(Math.max(options.max_newTokens || 256, 64), 512),
        do_sample: false,
        return_full_text: false
      });
      return cleanOutput(output);
    } finally {
      busy = false;
    }
  }

  async function inspectImage(file, question = 'Describe this image in detail. Identify the main objects, people, scene, visible text, colors, relationships, and anything important. If something is uncertain, say so.') {
    const url = URL.createObjectURL(file);
    try {
      try {
        const pipe = await getVisionPipe();
        const messages = [{ role: 'user', content: [{ type: 'image' }, { type: 'text', text: question }] }];
        const result = await pipe(messages, { images: [url], max_new_tokens: 256, return_full_text: false, do_sample: false });
        const text = cleanOutput(result);
        if (text) return text;
      } catch (visionError) {
        console.warn('SmolVLM inspection failed; using caption fallback.', visionError);
      }

      if (!captionPipePromise) {
        captionPipePromise = (async () => {
          const { pipeline } = await transformers();
          const device = await chooseDevice();
          return pipeline('image-to-text', 'Xenova/vit-gpt2-image-captioning', { device, dtype: device === 'webgpu' ? 'q4f16' : 'q8', progress_callback: p => emit('progress', p || {}) });
        })().catch(error => { captionPipePromise = null; throw error; });
      }
      const captioner = await captionPipePromise;
      const caption = cleanOutput(await captioner(url, { max_new_tokens: 80 }));
      return caption ? `I can see: ${caption}` : 'I could not confidently understand the image.';
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  window.KiraLocalAI = {
    answer,
    inspectImage,
    preloadText: getTextPipe,
    preloadVision: getVisionPipe,
    get device() { return navigator.gpu ? 'webgpu-or-wasm' : 'wasm'; },
    models: { text: TEXT_MODEL, vision: VISION_MODEL }
  };
})();
