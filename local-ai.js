/* Kira v13 — advanced local intelligence engine
 * No AI APIs, no hosted inference, no model CDN.
 * Uses deterministic reasoning, a curated offline knowledge base, conversation memory,
 * document understanding, calculations and browser-native image analysis.
 */
(() => {
  const memoryKey = 'kira-local-memory-v13';
  let busy = false;
  const emit = (type, detail = {}) => window.dispatchEvent(new CustomEvent('kira-ai-status', { detail: { type, ...detail } }));
  const clean = s => String(s ?? '').replace(/\s+/g, ' ').trim();
  const words = s => clean(s).toLowerCase().split(/[^a-z0-9]+/).filter(x => x.length > 1);
  const cap = (s,n=7000) => clean(s).slice(0,n);
  function getSettings(override={}) {
    let stored={};
    try { stored=JSON.parse(localStorage.getItem('kira-settings-v1')||'{}')||{}; } catch (_) {}
    return { name:'Arya', style:'natural', detail:'balanced', emojis:false, context:true, memory:true, smartSearch:true, multiSource:true, ...stored, ...override };
  }
  const sentenceCount = text => (String(text||'').match(/[.!?]+(?=\s|$)/g)||[]).length;
  function applyDetail(text, detail='balanced') {
    if (!text) return text;
    if (detail === 'detailed') return text;
    if (detail === 'concise') {
      const parts=String(text).split(/\n\s*\n/);
      return parts.slice(0,2).join('\n\n').slice(0,1400);
    }
    return text.length>4500 ? text.slice(0,4500).replace(/\s+$/,'')+'…' : text;
  }
  function personalize(text, settings={}) {
    let out=String(text||'');
    const style=settings.style||'natural';
    if(style==='professional') out=out.replace(/\bYep[!,.]?\s*/gi,'').replace(/\bAwesome[!.]?\s*/gi,'').replace(/😊|😄|👍|👋/g,'');
    if(style==='direct') out=out.replace(/^(Sure[.!]?|Absolutely[.!]?|Yep[!.]?|Here’s the simple version:\s*)/i,'');
    if(settings.emojis && !/[\u{1F300}-\u{1FAFF}]/u.test(out) && /^(Sure|Here|The|I’m|I'm|You’re|You're)/i.test(out)) out += ' ✨';
    return applyDetail(out,settings.detail);
  }

  const identity = {
    name: 'Kira',
    type: 'browser-based personal AI assistant',
    mode: 'local-first with optional normal web research links',
    apiPolicy: 'Kira does not use AI APIs or hosted inference.',
    creator: 'You can customize this answer in the Kira knowledge file.',
    purpose: 'Answer questions, explain concepts, calculate, help with code, inspect local files/images, and organize research.'
  };

  const knowledge = {
    'photosynthesis': 'Photosynthesis is the process by which plants, algae and some bacteria use light energy to convert carbon dioxide and water into chemical energy, mainly glucose, releasing oxygen as a by-product.',
    'gravity': 'Gravity is the attraction between masses. Near Earth’s surface, objects in free fall accelerate at about 9.81 m/s².',
    'evaporation': 'Evaporation is the change of a liquid into gas at its surface. It can occur below the boiling point.',
    'boiling': 'Boiling is rapid vaporization throughout a liquid when its vapor pressure reaches the surrounding pressure.',
    'democracy': 'Democracy is a system in which political power is exercised by the people, directly or through representatives chosen in elections.',
    'algorithm': 'An algorithm is a finite, ordered procedure for solving a problem or performing a computation.',
    'variable': 'A variable is a named value or storage location whose value can change while a program runs.',
    'html': 'HTML (HyperText Markup Language) structures content on the web. CSS controls presentation and JavaScript adds behavior.',
    'css': 'CSS (Cascading Style Sheets) controls the visual presentation and layout of HTML documents.',
    'javascript': 'JavaScript is a programming language used for interactive web pages, servers, apps and many other environments.',
    'python': 'Python is a high-level programming language known for readable syntax and a large ecosystem of libraries.',
    'machine learning': 'Machine learning is a field of computing in which models learn patterns from data to make predictions or decisions.',
    'artificial intelligence': 'Artificial intelligence is the broad field of building systems that perform tasks associated with capabilities such as reasoning, perception, language and planning.',
    'internet': 'The Internet is a global network of interconnected computer networks that communicate using standardized protocols such as IP and TCP.',
    'web': 'The World Wide Web is a system of interlinked resources accessed over the Internet, commonly using HTTP and web browsers.',
    'cpu': 'A CPU (central processing unit) executes program instructions and performs arithmetic, logic, control and data-processing operations.',
    'gpu': 'A GPU (graphics processing unit) is a processor designed for highly parallel workloads, especially graphics and many numerical computations.',
    'ram': 'RAM (random-access memory) is fast, volatile working memory used to hold data and instructions that active programs need.',
    'photosynthesis equation': 'A simplified photosynthesis equation is: 6 CO₂ + 6 H₂O + light energy → C₆H₁₂O₆ + 6 O₂.',
    'water': 'Water is H₂O: two hydrogen atoms bonded to one oxygen atom. At standard atmospheric pressure, pure water freezes near 0°C and boils near 100°C.',
    'earth': 'Earth is the third planet from the Sun and the only astronomical body currently known to support life.',
    'moon': 'The Moon is Earth’s natural satellite. Its phases are caused by changing viewing geometry between the Sun, Moon and Earth.',
    'sun': 'The Sun is a star at the center of our solar system. It is a roughly 4.6-billion-year-old G-type main-sequence star.',
    'solar system': 'The Solar System consists of the Sun and the objects gravitationally bound to it, including eight recognized planets, dwarf planets, moons, asteroids and comets.',
    'atom': 'An atom has a nucleus containing protons and usually neutrons, surrounded by electrons in quantum states.',
    'molecule': 'A molecule is a group of two or more atoms held together by chemical bonds and acting as a distinct unit.',
    'cell': 'A cell is the basic structural and functional unit of living organisms. Cells may be prokaryotic or eukaryotic.',
    'dna': 'DNA (deoxyribonucleic acid) stores hereditary information in most organisms. Its sequence is built from four main bases: A, C, G and T.',
    'mitosis': 'Mitosis is a type of cell division in which one eukaryotic cell produces two daughter cells with generally matching chromosome sets.',
    'ecosystem': 'An ecosystem is a community of organisms interacting with one another and with the physical environment.',
    'continent': 'A continent is one of Earth’s major continuous landmasses. Common geographic models identify seven: Africa, Antarctica, Asia, Europe, North America, South America and Australia.',
    'equator': 'The Equator is the imaginary circle around Earth halfway between the North and South Poles, at 0° latitude.',
    'democracy vs monarchy': 'A democracy derives political authority from citizens and elections or direct participation. A monarchy has a monarch as head of state, with the monarch’s actual political power varying greatly by country.',
    'india': 'India is a country in South Asia. Its capital is New Delhi, and it is a federal parliamentary democratic republic.',
    'tamil nadu': 'Tamil Nadu is a state in southern India. Its capital and largest city is Chennai.',
    'chennai': 'Chennai is the capital of Tamil Nadu, India, on the Coromandel Coast along the Bay of Bengal.',
    'world wide web': 'The World Wide Web was invented by Tim Berners-Lee at CERN. It uses technologies including URLs, HTTP and HTML.',
    'binary': 'Binary is a base-2 numeral system using only 0 and 1. Computers commonly represent digital information with binary states.',
    'json': 'JSON (JavaScript Object Notation) is a lightweight text format for representing structured data using objects, arrays, strings, numbers, booleans and null.',
    'api': 'An API (application programming interface) is a defined way for software components to communicate. A web API commonly exposes operations or data over HTTP.',
    'github': 'GitHub is a platform for hosting and collaborating on software projects, commonly using Git repositories, issues, pull requests and Actions.',
    'git': 'Git is a distributed version-control system used to track changes to files and collaborate on software projects.',
    'browser': 'A web browser retrieves and renders web resources and executes web technologies such as HTML, CSS and JavaScript.',
    'http': 'HTTP is an application-layer protocol used to transfer resources and messages between clients and servers on the web.',
    'https': 'HTTPS is HTTP protected by TLS, providing encryption and authentication for network communication.',
    'database': 'A database is an organized collection of data managed so it can be stored, queried, updated and maintained efficiently.',
    'indexeddb': 'IndexedDB is a browser storage system for structured data, designed for larger client-side datasets than simple key-value storage.',
    'webgpu': 'WebGPU is a modern browser API for accessing GPU capabilities for graphics and general-purpose parallel computation.',
    'webassembly': 'WebAssembly is a compact binary instruction format designed to run code efficiently in web environments and other runtimes.',
    'percentage': 'A percentage expresses a quantity as a fraction of 100. For example, 25% means 25 out of 100, or one quarter.',
    'pi': 'π (pi) is the ratio of a circle’s circumference to its diameter. It is approximately 3.141592653589793.',
    'speed': 'Speed is distance divided by time. The SI unit is metres per second (m/s).',
    'density': 'Density is mass divided by volume: ρ = m/V.',
    'force': 'In classical mechanics, net force is related to acceleration by F = ma, where m is mass and a is acceleration.',
    'energy': 'Energy is the capacity to cause change or perform work. It is measured in joules in the SI system.',
    'newton': 'The newton (N) is the SI unit of force. One newton is one kilogram metre per second squared.',
    'photosynthesis': 'Photosynthesis uses light energy to turn carbon dioxide and water into chemical energy, producing oxygen as a by-product in oxygenic photosynthesis.',
    'kira': 'Kira is your browser-based personal AI assistant. Its name is Kira, and this build is designed to work locally without an AI API.',
    'your name': 'My name is Kira.',
    'who made you': 'I am Kira, a customizable browser-based assistant. The exact creator/owner is determined by the person who deployed this Kira project.',
    'what can you do': 'I can answer basic questions, calculate, convert units, explain concepts, help with programming, remember useful local conversation context, inspect images locally, and help organize web research.',
    'offline': 'Offline mode means Kira can use its local reasoning and browser capabilities without sending your question to an AI service.',
    'api free': 'This Kira build does not use an AI API. Web research can use ordinary website pages/search links instead of an AI API.',
    'school': 'I can help with school subjects, explanations, practice questions, summaries and projects. I will try to keep explanations appropriate to the requested level.',
    'capital of india': 'The capital of India is New Delhi.',
    'capital of tamil nadu': 'The capital of Tamil Nadu is Chennai.',
    'largest planet': 'Jupiter is the largest planet in the Solar System by diameter and mass.',
    'smallest planet': 'Mercury is the smallest recognized planet in the Solar System by diameter and mass.',
    'speed of light': 'In vacuum, light travels at exactly 299,792,458 metres per second.',
    'human heart': 'The human heart is a muscular organ that pumps blood through the circulatory system.',
    'water formula': 'The chemical formula of water is H₂O.',
    'html meaning': 'HTML stands for HyperText Markup Language.',
    'css meaning': 'CSS stands for Cascading Style Sheets.',
    'cpu meaning': 'CPU stands for central processing unit.',
    'gpu meaning': 'GPU stands for graphics processing unit.',
    'ram meaning': 'RAM stands for random-access memory.'
  };

  const units = {
    km_mi: x => x * 0.6213711922, mi_km: x => x * 1.609344,
    m_ft: x => x * 3.280839895, ft_m: x => x / 3.280839895,
    kg_lb: x => x * 2.2046226218, lb_kg: x => x / 2.2046226218,
    c_f: x => x * 9/5 + 32, f_c: x => (x - 32) * 5/9,
    c_k: x => x + 273.15, k_c: x => x - 273.15,
    l_gal: x => x * 0.2641720524, gal_l: x => x * 3.785411784,
    m_cm: x => x * 100, cm_m: x => x / 100,
    mb_gb: x => x / 1024, gb_mb: x => x * 1024,
  };

  function safeMath(expr) {
    let s = String(expr).replace(/,/g,'').replace(/[×x]/gi,'*').replace(/÷/g,'/').replace(/−/g,'-').replace(/\^/g,'**').trim();
    // Permit percentages such as 15% of 200.
    const pct = s.match(/^(-?\d+(?:\.\d+)?)\s*%\s*(?:of|×|\*)\s*(-?\d+(?:\.\d+)?)$/i);
    if (pct) return String(Number(pct[1]) / 100 * Number(pct[2]));
    if (!/^[0-9+\-*/%().\s*]+$/.test(s) || !/[+\-*/%]/.test(s)) return null;
    try { const n = Function(`"use strict";return (${s})`)(); return Number.isFinite(n) ? String(Number.isInteger(n) ? n : Number(n.toFixed(10))) : null; } catch { return null; }
  }

  function mathAnswer(q) {
    const raw = clean(q).replace(/^(what is|calculate|solve|evaluate|compute)\s+/i,'').replace(/\?$/,'');
    const result = safeMath(raw);
    if (result !== null) return `The answer is **${result}**.`;
    const ratio = raw.match(/^(-?\d+(?:\.\d+)?)\s*%\s*of\s*(-?\d+(?:\.\d+)?)$/i);
    if (ratio) return `**${ratio[1]}%** of **${ratio[2]}** is **${Number(ratio[1])/100*Number(ratio[2])}**.`;
    return null;
  }

  function unitAnswer(q) {
    const m = clean(q).match(/(-?\d+(?:\.\d+)?)\s*(km|mi|m|ft|kg|lb|°?c|°?f|k|l|gal|cm|mb|gb)\s*(?:to|in)\s*(km|mi|m|ft|kg|lb|°?c|°?f|k|l|gal|cm|mb)\b/i);
    if (!m) return null;
    const n=Number(m[1]), a=m[2].toLowerCase().replace('°',''), b=m[3].toLowerCase().replace('°','');
    const keyMap = { 'km':'km','mi':'mi','m':'m','ft':'ft','kg':'kg','lb':'lb','c':'c','f':'f','k':'k','l':'l','gal':'gal','cm':'cm','mb':'mb','gb':'gb' };
    const key=`${keyMap[a]}_${keyMap[b]}`; const fn=units[key]; if(!fn) return `I can’t safely convert **${a} → ${b}** yet.`;
    const v=fn(n); return `**${n} ${m[2]} = ${Number(v.toFixed(8))} ${m[3]}**.`;
  }

  function dateAnswer(q) {
    if (!/\b(date|day|time|today|tomorrow|yesterday|now|current time|current date)\b/i.test(q)) return null;
    const d=new Date();
    if (/tomorrow/i.test(q)) d.setDate(d.getDate()+1);
    if (/yesterday/i.test(q)) d.setDate(d.getDate()-1);
    if (/time|now/i.test(q) && !/date/i.test(q)) return `The current browser time is **${d.toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit',second:'2-digit'})}**.`;
    return `The date is **${d.toLocaleDateString(undefined,{weekday:'long',year:'numeric',month:'long',day:'numeric'})}**.`;
  }

  function findKnowledge(q) {
    const lower=clean(q).toLowerCase();
    let best=null, score=0;
    for(const [key,value] of Object.entries(knowledge)){
      const keyWords=words(key); let s=0;
      if(lower.includes(key)) s+=keyWords.length*4;
      for(const w of keyWords) if(lower.includes(w)) s+=1;
      if(s>score){score=s;best=value;}
    }
    if(score>=2 && /\b(what|who|why|how|when|where|define|explain|meaning|tell me|is|are|does|did|can you)\b/i.test(lower)) return best;
    return null;
  }

  function codeAnswer(q){
    if(!/\b(code|program|javascript|python|html|css|sql|java)\b/i.test(q)) return null;
    if(/javascript.*(hello|print)|print.*javascript/i.test(q)) return '```javascript\nconsole.log("Hello, world!");\n```';
    if(/python.*(hello|print)|print.*python/i.test(q)) return '```python\nprint("Hello, world!")\n```';
    if(/html.*button|button.*html/i.test(q)) return '```html\n<button id="hello">Click me</button>\n<script>\ndocument.querySelector("#hello").onclick = () => alert("Hello!");\n</script>\n```';
    if(/center.*div|div.*center/i.test(q)) return '```css\n.container {\n  display: grid;\n  place-items: center;\n  min-height: 100vh;\n}\n```';
    return null;
  }

  function summarizeContext(context){
    const text=cap(context,12000); if(!text) return null;
    const sentences=(text.match(/[^.!?]+[.!?]+|[^.!?]+$/g)||[]).map(clean).filter(x=>x.length>20);
    if(!sentences.length) return cap(text,1500);
    const seen=new Set(); const chosen=[];
    for(const s of sentences){const k=s.toLowerCase();if(!seen.has(k)){seen.add(k);chosen.push(s);}if(chosen.join(' ').length>1700)break;}
    return chosen.slice(0,8).join(' ');
  }

  function remember(user,assistant){try{if(getSettings().memory===false)return;const a=JSON.parse(localStorage.getItem(memoryKey)||'[]');a.push({user:cap(user,700),assistant:cap(assistant,1400),time:Date.now()});localStorage.setItem(memoryKey,JSON.stringify(a.slice(-80)));}catch(_) {}}
  function recall(q){try{if(getSettings().memory===false)return[];const a=JSON.parse(localStorage.getItem(memoryKey)||'[]'), t=words(q);return a.filter(r=>t.some(x=>r.user.toLowerCase().includes(x))).slice(-6);}catch(_){return[];}}

  function classifyQuery(q){
    const x=clean(q);
    const intent = detectIntent(x);
    const simple=/^(hi|hello|hey|yo|sup|thanks|thank you|thx|ok|okay|bye|good morning|good evening|good night)[!. ]*$/i.test(x)
      || /^(?:what is|calculate|solve|compute|evaluate)?\s*-?\d+(?:\s*[+\-*/%x×÷]\s*-?\d+(?:\.\d+)?)+\s*[?]?$/.test(x)
      || /^\d+(?:\.\d+)?\s*(km|mi|m|ft|kg|lb|c|f|k|l|gal|cm|mb|gb)\s+(to|in)\s+\w+$/i.test(x);
    if(simple)return 'simple';
    return (intent === 'current' || intent === 'research') ? 'research' : 'normal';
  }

  const variationKey = 'kira-response-variation-v1';
  function nextVariation(bucket, count){
    try {
      const state = JSON.parse(localStorage.getItem(variationKey) || '{}');
      const n = Number(state[bucket] || 0);
      state[bucket] = n + 1;
      localStorage.setItem(variationKey, JSON.stringify(state));
      return n % count;
    } catch (_) {
      return Math.floor(Math.random() * count);
    }
  }

  function variedGreeting(settings={}){
    const choices = [
      'Hi! How can I help you today?',
      'Hey there! What can I help you with?',
      'Hello! What are we working on today?',
      'Hi there! What would you like to explore?',
      'Hey! I’m ready whenever you are.'
    ];
    const choice=choices[nextVariation('greeting', choices.length)];
    const name=clean(settings.name||'');
    return name && name.toLowerCase()!=='arya' ? choice.replace(/^((?:Hi|Hey|Hello)(?: there)?[!,]?)/i,'$1 '+name) : choice;
  }

  function variedThanks(){
    const choices = [
      'You’re welcome!',
      'Anytime! 😊',
      'Glad I could help!',
      'No problem!',
      'Of course! What’s next?'
    ];
    return choices[nextVariation('thanks', choices.length)];
  }

  function variedIdentity(){
    const choices = [
      `I’m **${identity.name}** — ${identity.type}. ${identity.purpose}`,
      `My name is **${identity.name}**. I’m a ${identity.type} built to answer questions, reason locally and help you get things done.`,
      `You’re talking to **${identity.name}**. I’m your browser-based assistant for questions, calculations, coding, local files and research.`,
      `I’m **${identity.name}** 👋 — a local-first browser assistant. I can help you learn, build, calculate, inspect files and organize research.`
    ];
    return choices[nextVariation('identity', choices.length)];
  }

  function variedCapabilities(){
    const choices = [
      knowledge['what can you do'],
      'I can calculate, explain concepts, help with code, inspect local files and images, remember useful conversation context, and organize web research when a question needs current information.',
      'I can help with schoolwork, programming, math, explanations, conversions, local file analysis, image inspection and research. Simple questions stay local and fast.',
      'Think of me as a local-first helper: I can reason through everyday questions, work with files, do calculations, inspect images and prepare multi-source research when needed.'
    ];
    return choices[nextVariation('capabilities', choices.length)];
  }

  function varyFactualAnswer(answer, category='fact'){
    if (!answer || answer.length < 20) return answer;
    // Keep the actual fact unchanged while varying a short natural lead.
    const leads = {
      fact: ['Here’s the answer:', 'Sure —', 'The key point is:', 'In simple terms:', 'Here’s what I know:'],
      code: ['Sure — here’s a simple example:', 'Try this:', 'Here’s a clean starting point:', 'A simple way to do it is:'],
      math: ['Let’s calculate it:', 'The result is:', 'Here you go:', 'That works out to:']
    };
    const list = leads[category] || leads.fact;
    const lead = list[nextVariation('lead-' + category, list.length)];
    if (/^(here’s the answer:|sure —|the key point is:|in simple terms:|here’s what i know:|let’s calculate it:|the result is:|here you go:|that works out to:|sure — here’s a simple example:|try this:|here’s a clean starting point:|a simple way to do it is:)/i.test(answer)) return answer;
    return `${lead}\n\n${answer}`;
  }

  function identityAnswer(q){
    const x=clean(q).toLowerCase();
    if(/^(what('?s| is) your name|who are you|what are you|tell me about yourself|what is kira)$/.test(x)) return variedIdentity();
    if(/^(what can you do|what do you do|capabilities)$/.test(x)) return variedCapabilities();
    if(/^(are you an ai|are you ai)$/.test(x)) {
      const choices = [
        'Yes — I’m Kira, a browser-based AI-style assistant. This build uses local reasoning rather than an AI API.',
        'Yes. I’m Kira, a browser-based assistant designed around local reasoning and API-free operation.',
        'Yep! I’m Kira. In this build, my reasoning stays in the browser instead of calling an AI API.'
      ];
      return choices[nextVariation('ai-identity', choices.length)];
    }
    return null;
  }

  function lastLocalTurns() {
    try { return JSON.parse(localStorage.getItem(memoryKey) || '[]').slice(-8); }
    catch (_) { return []; }
  }

  function naturalSmallTalk(q) {
    const x = clean(q).toLowerCase();
    const table = [
      [/^(how are you|how r u|how're you)\??$/, [
        'I’m doing well and ready to help. What are you working on?',
        'I’m good! What do you want to tackle?',
        'All set here 😊 What can I help you with?'
      ]],
      [/^(good morning|good afternoon|good evening|good night)\b[!. ]*$/, [
        'Good to see you! What can I help with?',
        'Hey! Hope you’re having a good one. What are we working on?',
        'Hello! What would you like to do today?'
      ]],
      [/^(bye|goodbye|see you|see ya)\b[!. ]*$/, [
        'See you! Come back whenever you need me.',
        'Bye! Hope I helped. 👋',
        'See you later!'
      ]],
      [/^(ok|okay|k|alright|cool|nice|great)[!. ]*$/, [
        '👍',
        'Sounds good!',
        'Awesome. What’s next?'
      ]],
      [/^(you are (good|great|awesome)|good job|nice job|well done)[!. ]*$/, [
        'Thanks! 😄 What should we work on next?',
        'I appreciate that! What’s next?',
        'Thanks! Let’s keep going.'
      ]]
    ];
    for (const [re, choices] of table) if (re.test(x)) return choices[nextVariation('smalltalk-' + re.source, choices.length)];
    return null;
  }

  function conversationalFollowUp(q) {
    const x = clean(q).toLowerCase();
    const turns = lastLocalTurns();
    const previous = turns.at(-1)?.assistant || '';
    if (!previous) return null;
    if (/^(why\??|why is that\??|how so\??)$/i.test(x)) {
      if (previous.length > 40) return `Sure. The reason is that ${previous.charAt(0).toLowerCase() + previous.slice(1).replace(/[.]+$/, '')}. If you meant a different part, point it out and I’ll explain that instead.`;
    }
    if (/^(more|tell me more|explain more|go deeper|continue|and then\??)$/i.test(x)) {
      return `Sure — building on what I just said: ${previous.slice(0, 900)}${previous.length > 900 ? '…' : ''}`;
    }
    if (/^(shorter|make it short|in short|briefly)$/i.test(x)) {
      const first = previous.split(/(?<=[.!?])\s+/)[0];
      return `${first}${first.endsWith('.') ? '' : '.'}`;
    }
    return null;
  }

  function naturalLead(kind) {
    const leads = {
      fact: ['Sure. ', 'Yep — ', 'Here’s the simple version: ', 'In short, ', 'Basically, '],
      math: ['', 'That comes to ', 'The answer is ', 'You get ', ''],
      code: ['Sure — ', 'Yep. A simple way is: ', 'Try this: ', 'Here’s a clean example: ']
    };
    const a = leads[kind] || leads.fact;
    return a[nextVariation('natural-lead-' + kind, a.length)];
  }

  function naturalize(answer, kind='fact', question='') {
    if (!answer) return answer;
    // Don't decorate structured/code answers or already conversational responses.
    if (answer.includes('```') || answer.startsWith('**Local image inspection') || answer.length < 25) return answer;
    const lower = answer.toLowerCase();
    if (/^(hi|hey|hello|you’re welcome|you're welcome|see you|i’m kira|i'm kira|yes — i’m kira|yes. i’m kira)/i.test(answer)) return answer;
    const lead = naturalLead(kind);
    if (!lead) return answer;
    // Math leads that are prefixes need a little grammar handling.
    if (kind === 'math' && /^that comes to |^the answer is |^you get /i.test(lead)) return lead + answer.replace(/^\s*(the result is:|result:)/i, '').trim();
    return lead + answer;
  }

  function detectIntent(q) {
    const x = clean(q).toLowerCase();
    if (!x) return 'empty';
    if (/^(hi|hello|hey|yo|sup|good morning|good afternoon|good evening|good night|thanks|thank you|ok|okay|bye|goodbye)\b/.test(x)) return 'social';
    if (/^(what('?s| is) your name|who are you|what can you do|are you an ai)\b/.test(x)) return 'identity';
    if (/\b(explain|define|meaning of|what does .* mean|how does|why does|why is|what is|who is|where is)\b/.test(x)) return 'knowledge';
    if (/\b(write|code|program|debug|fix|javascript|python|html|css|sql|java|regex|function)\b/.test(x)) return 'code';
    if (/\b(calculate|solve|evaluate|convert|percentage|percent|ratio|average|mean|sum|difference|multiply|divide)\b/.test(x) || /\d\s*[+\-*\/%×÷]\s*\d/.test(x)) return 'math';
    if (/\b(summarize|summary|shorten|rewrite|rephrase|proofread|grammar|translate)\b/.test(x)) return 'writing';
    if (/\b(latest|current|today|now|recent|news|price|weather|score|schedule|stock|exchange rate|this week|this month|2026)\b/.test(x)) return 'current';
    if (/\b(research|compare|sources?|according to|look up|search|find out|verify|fact[- ]?check|statistics|study|paper|scientific|official)\b/.test(x)) return 'research';
    return 'general';
  }

  function extractEntities(q) {
    const text = clean(q);
    const quoted = [...text.matchAll(/["“”']([^"“”']{2,80})["“”']/g)].map(m => m[1]);
    const proper = [...text.matchAll(/\b[A-Z][a-zA-Z0-9_-]{2,}(?:\s+[A-Z][a-zA-Z0-9_-]{2,}){0,3}\b/g)].map(m => m[0]);
    return [...new Set([...quoted, ...proper])].slice(0, 8);
  }

  function ambiguityAnswer(q) {
    const x = clean(q).toLowerCase();
    if (/^(it|this|that|they|them|he|she|there)\b/.test(x) && lastLocalTurns().length === 0)
      return 'I’m missing the earlier context for that. Tell me what “it” or “that” refers to, and I’ll pick it up from there.';
    return null;
  }

  function naturalFallback(q) {
    const intent = detectIntent(q);
    const entities = extractEntities(q);
    if (intent === 'knowledge') return entities.length
      ? `I can explain **${entities[0]}**, but I don’t have a reliable local fact for it yet. If you want, ask me to research it and I’ll prepare several source links.`
      : 'I can explain that, but I need a little more context to avoid guessing. What exactly would you like to know?';
    if (intent === 'code') return 'I can help build or debug that. Paste the code or tell me the language, what you want it to do, and what is going wrong.';
    if (intent === 'writing') return 'Sure — paste the text and tell me whether you want it shorter, clearer, more formal, more natural, or translated.';
    if (intent === 'research' || intent === 'current') return 'That’s the kind of question where current or source-backed information matters. I can prepare a multi-source research set for you.';
    return 'I’m not confident enough to invent an answer. Give me a little more detail and I’ll work it out with you.';
  }

  function localReason(user,context='',settings={}){
    const q=clean(user);
    if(!q) return 'Ask me something and I’ll help.';
    settings=getSettings(settings);

    const identityHit=identityAnswer(q); if(identityHit)return personalize(identityHit,settings);
    const smallTalk = naturalSmallTalk(q); if (smallTalk) return personalize(smallTalk,settings);
    if(/^(hi|hello|hey|yo|sup)\b/i.test(q)) return personalize(variedGreeting(settings),settings);
    if(/^(thanks|thank you|thx)\b/i.test(q)) return personalize(variedThanks(),settings);

    const follow = conversationalFollowUp(q);
    if (follow) return personalize(follow,settings);

    const math = mathAnswer(q);
    if (math) return personalize(naturalize(math, 'math', q),settings);
    const unit = unitAnswer(q);
    if (unit) return personalize(naturalize(unit, 'fact', q),settings);
    const date = dateAnswer(q);
    if (date) return personalize(naturalize(date, 'fact', q),settings);
    const code = codeAnswer(q);
    if (code) return code;
    const direct=findKnowledge(q);
    if(direct) return naturalize(direct, 'fact', q);

    const remembered=recall(q);
    if(/\b(what did i say|remember|earlier|previous|last time)\b/i.test(q)&&remembered.length)
      return personalize('Here’s what I remember locally:\n'+remembered.map(x=>`• You: ${x.user}\n  Kira: ${x.assistant}`).join('\n'),'balanced'===settings.detail?settings:{...settings,detail:'detailed'});

    if(context && settings.context !== false){
      if(/\b(summarize|summary|shorten|main points|key points)\b/i.test(q))
        return `Here’s a local summary:\n\n${summarizeContext(context)}`;
      return `I inspected the attached/local content.\n\n${summarizeContext(context) || cap(context,1800)}`;
    }

    if(/\bhow (do|can) i\b/i.test(q))
      return 'Absolutely. Tell me the goal and, if it matters, what device or tools you’re using. I’ll break it into practical steps.';
    if(/\bwhy\b/i.test(q))
      return 'I can explain the reason step by step. Tell me which part you mean, and I’ll focus on that rather than guessing.';
    if(/\bwhat do you think\b/i.test(q))
      return 'I can give you the main considerations and explain the trade-offs. Tell me what you’re deciding between.';

    return personalize(naturalFallback(q),settings);
  }

  async function answer(messages, options={}){
    if(busy)throw new Error('Kira is still finishing the previous response.'); busy=true;
    try{emit('device',{device:'offline'});const last=Array.isArray(messages)?(messages.at(-1)?.content||''):String(messages||'');const settings=getSettings(options.settings||{});const result=localReason(last,options.context||'',settings);remember(last,result);return result;}finally{busy=false;}
  }

  function colorName(r,g,b){const palette=[['black',0,0,0],['white',255,255,255],['red',220,50,50],['orange',240,140,30],['yellow',230,210,50],['green',60,170,80],['cyan',40,190,200],['blue',60,100,210],['purple',150,80,190],['pink',220,100,160],['brown',130,80,45],['gray',130,130,130]];let best=palette[0],bd=Infinity;for(const p of palette){const d=(r-p[1])**2+(g-p[2])**2+(b-p[3])**2;if(d<bd){bd=d;best=p;}}return best[0];}

  async function inspectImage(file,question=''){
    emit('device',{device:'offline',kind:'vision'});
    const url=URL.createObjectURL(file);
    try{
      const img=new Image(); img.decoding='async'; img.src=url;
      await new Promise((res,rej)=>{img.onload=res;img.onerror=()=>rej(new Error('Could not decode image.'));});
      const w=img.naturalWidth,h=img.naturalHeight;
      if(!w||!h) throw new Error('Image has no readable dimensions.');
      const max=2048,scale=Math.min(1,max/Math.max(w,h));
      const cw=Math.max(1,Math.round(w*scale)),ch=Math.max(1,Math.round(h*scale));
      const c=document.createElement('canvas');c.width=cw;c.height=ch;
      const ctx=c.getContext('2d',{willReadFrequently:true});
      if(!ctx) throw new Error('Canvas image analysis is unavailable in this browser.');
      ctx.clearRect(0,0,cw,ch);ctx.drawImage(img,0,0,cw,ch);
      const data=ctx.getImageData(0,0,cw,ch).data;
      const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
      const rgbToHsv=(r,g,b)=>{r/=255;g/=255;b/=255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn;let h=0;if(d){if(mx===r)h=((g-b)/d)%6;else if(mx===g)h=(b-r)/d+2;else h=(r-g)/d+4;h*=60;if(h<0)h+=360;}return {h,s:mx?d/mx:0,v:mx};};
      const palette=[['black',0,0,0],['white',255,255,255],['red',220,50,50],['orange',240,140,30],['yellow',230,210,50],['green',60,170,80],['cyan',40,190,200],['blue',60,100,210],['purple',150,80,190],['pink',220,100,160],['brown',130,80,45],['gray',130,130,130]];
      const colorName=(r,g,b)=>{let best=palette[0],bd=Infinity;for(const p of palette){const d=(r-p[1])**2+(g-p[2])**2+(b-p[3])**2;if(d<bd){bd=d;best=p;}}return best[0];};
      // Uniform sampling with correct horizontal + vertical neighbors.
      const step=Math.max(1,Math.floor(Math.sqrt((cw*ch)/600000)));
      let n=0,sumR=0,sumG=0,sumB=0,sumL=0,sumL2=0,minL=255,maxL=0,transparent=0;
      let grad=0,gradSq=0,strongEdges=0,highlights=0,shadows=0,satSum=0;
      const hueBins=new Array(12).fill(0), lumBins=new Array(16).fill(0);
      const samples=[];
      for(let y=0;y<ch;y+=step){
        for(let x=0;x<cw;x+=step){
          const i=(y*cw+x)*4,A=data[i+3],R=data[i],G=data[i+1],B=data[i+2];
          const L=.2126*R+.7152*G+.0722*B;const hsv=rgbToHsv(R,G,B);
          n++;sumR+=R;sumG+=G;sumB+=B;sumL+=L;sumL2+=L*L;minL=Math.min(minL,L);maxL=Math.max(maxL,L);satSum+=hsv.s;
          if(A<128)transparent++;if(L>235)highlights++;if(L<25)shadows++;
          lumBins[Math.min(15,Math.floor(L/256*16))]++; if(hsv.s>.18)hueBins[Math.floor(hsv.h/30)%12]++;
          if(samples.length<9000)samples.push([R,G,B,L]);
          if(x+step<cw){const j=(y*cw+x+step)*4;const L2=.2126*data[j]+.7152*data[j+1]+.0722*data[j+2];const d=Math.abs(L-L2);grad+=d;gradSq+=d*d;if(d>50)strongEdges++;}
          if(y+step<ch){const j=((y+step)*cw+x)*4;const L2=.2126*data[j]+.7152*data[j+1]+.0722*data[j+2];const d=Math.abs(L-L2);grad+=d;gradSq+=d*d;if(d>50)strongEdges++;}
        }
      }
      const avgR=sumR/n,avgG=sumG/n,avgB=sumB/n,avgL=sumL/n,contrast=maxL-minL;
      const avgSat=satSum/n,gradMean=grad/(Math.max(1,n*2)),gradRms=Math.sqrt(gradSq/Math.max(1,n*2));
      const entropy=lumBins.reduce((e,cnt)=>{if(!cnt)return e;const p=cnt/n;return e-p*Math.log2(p);},0);
      // K-means-lite dominant colors: quantize RGB and select the three largest clusters.
      const bins=new Map(); for(const [R,G,B] of samples){const k=[Math.round(R/32)*32,Math.round(G/32)*32,Math.round(B/32)*32].join(',');bins.set(k,(bins.get(k)||0)+1);} 
      const topColors=[...bins.entries()].sort((a,b)=>b[1]-a[1]).slice(0,3).map(([k,cnt])=>{const [R,G,B]=k.split(',').map(Number);return `${colorName(clamp(R,0,255),clamp(G,0,255),clamp(B,0,255))} (${Math.round(cnt/samples.length*100)}%)`;});
      function region(x0,y0,x1,y1){let R=0,G=0,B=0,L=0,N=0;const xs=Math.max(1,Math.floor((x1-x0)*cw/80)),ys=Math.max(1,Math.floor((y1-y0)*ch/80));for(let y=Math.floor(y0*ch);y<Math.floor(y1*ch);y+=ys)for(let x=Math.floor(x0*cw);x<Math.floor(x1*cw);x+=xs){const i=(y*cw+x)*4;R+=data[i];G+=data[i+1];B+=data[i+2];L+=.2126*data[i]+.7152*data[i+1]+.0722*data[i+2];N++;}return {name:colorName(R/N,G/N,B/N),lum:L/N};}
      const regions=[region(0,0,.5,.5),region(.5,0,1,.5),region(0,.5,.5,1),region(.5,.5,1,1)];
      const transparentPct=transparent/n*100;
      let detectorNotes=[];
      try{if('FaceDetector' in window){const fd=new FaceDetector({fastMode:false,maxDetectedFaces:50});const faces=await fd.detect(img);detectorNotes.push(`${faces.length} face${faces.length===1?'':'s'} detected by browser face detection`);}}catch(_){ }
      try{if('BarcodeDetector' in window){const bd=new BarcodeDetector();const codes=await bd.detect(img);if(codes.length)detectorNotes.push(`${codes.length} barcode${codes.length===1?'':'s'} detected`);}}catch(_){ }
      let ocrNote='';
      try{if('TextDetector' in window && /text|read|ocr|words|written/i.test(question)){const td=new TextDetector();const blocks=await td.detect(img);ocrNote=`Browser text detector found ${blocks.length} possible text region${blocks.length===1?'':'s'}.`;}}catch(_){ }
      const dominant=colorName(avgR,avgG,avgB);
      const brightness=avgL<55?'very dark':avgL<110?'dark':avgL<180?'medium':avgL<225?'bright':'very bright';
      const detail=gradMean>30?'high':gradMean>14?'moderate':'low';
      const sharpness=gradRms>38?'high':gradRms>20?'moderate':'low';
      const dynamic=contrast>210?'very high':contrast>150?'high':contrast>80?'moderate':'low';
      const composition=(w/h>1.6?'wide landscape':h/w>1.6?'tall portrait':w===h?'square':'standard frame');
      let text=`**Accurate local image analysis: ${file.name}**\n`+
        `• Resolution: **${w} × ${h}px** (${composition})\n`+
        `• Aspect ratio: **${(w/h).toFixed(3)}:1**\n`+
        `• Brightness: **${brightness}** (mean ${avgL.toFixed(1)}/255)\n`+
        `• Dominant average color: **${dominant}** (RGB ${Math.round(avgR)}, ${Math.round(avgG)}, ${Math.round(avgB)})\n`+
        `• Dominant color clusters: **${topColors.join(', ') || dominant}**\n`+
        `• Contrast/dynamic range: **${dynamic}** (${Math.round(contrast)}/255)\n`+
        `• Fine detail: **${detail}**; edge/sharpness signal: **${sharpness}**\n`+
        `• Texture/brightness entropy: **${entropy.toFixed(2)} bits**\n`+
        `• Average saturation: **${(avgSat*100).toFixed(1)}%**\n`+
        `• Highlights: ${(highlights/n*100).toFixed(1)}%; shadows: ${(shadows/n*100).toFixed(1)}%\n`+
        `• Quadrants: TL ${regions[0].name}, TR ${regions[1].name}, BL ${regions[2].name}, BR ${regions[3].name}\n`+
        `• Transparency: **${transparentPct<1?'none detected in the sample':transparentPct.toFixed(1)+'% sampled pixels'}**`;
      if(detectorNotes.length) text+=`\n• Browser detectors: ${detectorNotes.join('; ')}.`;
      if(ocrNote) text+=`\n• ${ocrNote}`;
      if(/color|colour/i.test(question)) text+=`\n• Color-focused answer: the image’s overall average is **${dominant}**, with major clusters ${topColors.join(', ')}.`;
      if(/size|dimension|resolution|aspect/i.test(question)) text+=`\n• Size-focused answer: **${w}×${h}px**, **${(w/h).toFixed(3)}:1**.`;
      if(/bright|dark|lighting/i.test(question)) text+=`\n• Lighting-focused answer: the image is **${brightness}**, with ${dynamic.toLowerCase()} dynamic range.`;
      text+='\n• Object/scene accuracy: this build uses deterministic browser vision only. It will not invent object identities. For true object/scene recognition, a local vision model must be bundled on-device; no remote API is used.';
      return text;
    }finally{URL.revokeObjectURL(url);}
  }

  window.KiraLocalAI={answer,inspectImage,classifyQuery,detectIntent,extractEntities,preloadText:async()=>true,preloadVision:async()=>true,get device(){return 'offline';},models:{text:'Kira Local Reasoner v9',vision:'Browser Pixel Vision v9'}};
})();
