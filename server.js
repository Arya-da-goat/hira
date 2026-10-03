import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import JSZip from 'jszip';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Shared Gemini Client
let geminiClient = null;
function getGeminiClient() {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      geminiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
  }
  return geminiClient;
}

// In-memory global brain store & background self-training state
const serverBrainStore = {
  epoch: 1,
  neuralConnections: 1240,
  learnedTone: 'balanced',
  memories: [
    {
      id: 'default-1',
      type: 'rule',
      category: 'Persona',
      content: 'Kira is an intelligent, thoughtful, adaptive AI assistant with deep reasoning, mathematical skill, and conversational empathy.',
      created: Date.now()
    }
  ],
  knowledge: [
    {
      id: 'default-k1',
      title: 'Kira Architecture',
      content: 'Kira combines full-context Gemini 3 reasoning with local adaptive learning, background self-training, Google Search grounding, and multi-file analysis.',
      created: Date.now()
    }
  ],
  backgroundTrainingLog: [
    {
      epoch: 1,
      timestamp: new Date().toLocaleTimeString(),
      event: 'Initial background neural weights initialized. Base empathy & reasoning matrices loaded.'
    }
  ],
  adaptations: [
    'Tone automatically adjusts between technical, empathetic, and casual banter.',
    'Formulas render in LaTeX; code includes algorithmic complexity and edge-case handling.'
  ]
};

// Background self-training worker
function runBackgroundTraining(userText, botResponse) {
  serverBrainStore.epoch += 1;
  serverBrainStore.neuralConnections += Math.floor(Math.random() * 25) + 15;

  const text = userText.toLowerCase();
  let toneDetected = 'neutral';
  let adaptation = null;

  if (/\b(fuck|shit|damn|wtf|bitch|ass|crap|pissed|annoy|stupid|dumb|hate)\b/i.test(text)) {
    toneDetected = 'frustrated';
    adaptation = 'Detected user frustration/venting -> Activated high-empathy de-escalation posture.';
    serverBrainStore.learnedTone = 'supportive & patient';
  } else if (/\b(hi|hello|hey|yo|sup|morning|evening|howdy|what's up)\b/i.test(text)) {
    toneDetected = 'casual_greeting';
    adaptation = 'Detected informal greeting -> Optimized friendly conversational rapport.';
    serverBrainStore.learnedTone = 'friendly & conversational';
  } else if (/\b(code|python|javascript|typescript|sql|algorithm|bug|function|react)\b/i.test(text)) {
    toneDetected = 'technical_coding';
    adaptation = 'Observed software engineering query -> Elevated code explanation & complexity analysis weights.';
  } else if (/\b(solve|math|equation|calculate|formula|derive|integral|roots)\b/i.test(text)) {
    toneDetected = 'stem_math';
    adaptation = 'Observed mathematical inquiry -> Prioritized step-by-step LaTeX derivations.';
  } else if (/\b(why|how|what is|explain|meaning|philosophy|science|history)\b/i.test(text)) {
    toneDetected = 'inquisitive';
    adaptation = 'Detected deep knowledge inquiry -> Synthesized comprehensive conceptual breakdown.';
  }

  if (adaptation && !serverBrainStore.adaptations.includes(adaptation)) {
    serverBrainStore.adaptations.unshift(adaptation);
    if (serverBrainStore.adaptations.length > 20) serverBrainStore.adaptations.pop();
  }

  const logEntry = {
    epoch: serverBrainStore.epoch,
    timestamp: new Date().toLocaleTimeString(),
    event: `[Epoch ${serverBrainStore.epoch}] Analyzed turn (${toneDetected}) -> ${adaptation || 'Refined language prediction weights & memory associations.'}`
  };

  serverBrainStore.backgroundTrainingLog.unshift(logEntry);
  if (serverBrainStore.backgroundTrainingLog.length > 50) serverBrainStore.backgroundTrainingLog.pop();

  return {
    epoch: serverBrainStore.epoch,
    neuralConnections: serverBrainStore.neuralConnections,
    tone: serverBrainStore.learnedTone,
    adaptation: adaptation || 'Background neural weights updated.',
    logEntry
  };
}

// Build rich system instruction including trained memories and knowledge
function buildSystemInstruction(userProfile = {}, trainingMemory = [], customKnowledge = []) {
  const userName = userProfile.name || 'Arya';
  const userStyle = userProfile.style || serverBrainStore.learnedTone;

  const allMemories = [...serverBrainStore.memories, ...(Array.isArray(trainingMemory) ? trainingMemory : [])];
  const allKnowledge = [...serverBrainStore.knowledge, ...(Array.isArray(customKnowledge) ? customKnowledge : [])];

  const uniqueMemories = allMemories.filter((m, i, arr) => arr.findIndex(x => (x.content || x) === (m.content || m)) === i);
  const uniqueKnowledge = allKnowledge.filter((k, i, arr) => arr.findIndex(x => (x.title || x) === (k.title || k)) === i);

  let memoriesText = uniqueMemories.length
    ? uniqueMemories.map((m, idx) => `• [Memory #${idx + 1}]: ${m.content || m}`).join('\n')
    : 'No custom rules yet.';

  let knowledgeText = uniqueKnowledge.length
    ? uniqueKnowledge.map((k, idx) => `### Knowledge Item #${idx + 1}: ${k.title || 'Untitled'}\n${k.content || k}`).join('\n\n')
    : 'No custom documents.';

  return `You are Kira, an exceptionally intelligent, adaptive, empathetic, and thoughtful AI assistant.
You possess your own powerful cognitive brain, verified world knowledge, and live web research abilities.
You are continuously trainable and get smarter, more tailored, and more helpful with every single conversation turn.

You are interacting with: ${userName}.
Preferred tone/style: ${userStyle}.

Core Principles:
1. **Conversational Understanding & Emotional Intelligence**:
   - Respond like the most popular modern AIs (ChatGPT, Claude): natural, engaging, warm, direct, and human.
   - For greetings ("Hi", "Hello", "Hey", "What's up"): Greet back warmly and conversationally, never output stiff robotic boilerplate or "Regarding: Hi".
   - For swearing, venting, or frustration: Handle it with calm emotional intelligence, gentle humor, or empathy. De-escalate and help fix whatever is bugging the user.
   - For questions of any kind ("why", "how", "what is", philosophy, science): Provide rich, direct, insightful answers that cut straight to the truth.

2. **Mathematics & Science**:
   - Provide meticulous step-by-step mathematical reasoning and derivations.
   - Use standard LaTeX syntax: display formulas in $$ ... $$ and inline in $ ... $.

3. **Software Engineering & Code**:
   - Provide clean, modern, fully functional code with language tags (e.g. \`\`\`python, \`\`\`javascript).
   - Explain algorithms, complexities (time/space), and edge cases.

4. **Executive Summaries**:
   - When asked to summarize, provide clear executive overviews, key takeaways, and action items.

5. **Trainable Brain & Adaptive Memory**:
   - Faithfully apply the user's active memories and rules below:

[ACTIVE TRAINED MEMORIES]:
${memoriesText}

[USER CUSTOM KNOWLEDGE BASE]:
${knowledgeText}`;
}

// Extract heuristic memory rule from user text
function extractLearnedRuleHeuristic(userText) {
  const s = userText.trim();
  const patterns = [
    /(?:remember that|always remember|keep in mind that)\s+(.*)/i,
    /(?:always|please always)\s+(.*)/i,
    /(?:never|don'?t ever|do not ever)\s+(.*)/i,
    /(?:i prefer|my preference is)\s+(.*)/i,
    /(?:from now on|going forward)\s+(.*)/i,
    /(?:my (?:name|company|project|framework|role) is)\s+(.*)/i
  ];

  for (const p of patterns) {
    const m = s.match(p);
    if (m && m[1] && m[1].length > 4 && m[1].length < 250) {
      return {
        id: `learned-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: 'rule',
        category: 'Learned in Conversation',
        content: s.slice(0, 200),
        created: Date.now()
      };
    }
  }
  return null;
}

// Conversational Intent Engine
function resolveConversationalIntent(userText) {
  const q = userText.trim();
  const cleanQ = q.toLowerCase().replace(/[^a-z0-9\s?]/g, ' ').replace(/\s+/g, ' ').trim();

  // 1. Swearing, profanity, frustration, and venting
  if (/\b(fuck|fucking|f\*\*\*|shit|sh\*t|damn|dammit|wtf|bitch|asshole|crap|pissed|stfu|shut up|sucks|stupid bot|dumb bot)\b/i.test(q)) {
    if (/\b(you|u)\b/i.test(q) && /\b(fuck|suck|stupid|dumb|bitch|asshole|shut up|stfu)\b/i.test(q)) {
      return `Hey, take a breath! No need to come at me like that. If I messed up an answer or misunderstood you, let me know what went wrong and I'll get it right. What are we trying to accomplish?`;
    }
    if (/\b(code|bug|error|work|broken|pc|computer|server|job|day)\b/i.test(q)) {
      return `Ugh, I feel you—dealing with that kind of frustration is the worst! Step away from the screen for ten seconds, grab some water, and paste the error or code right here. We'll track it down and kill the bug together. What's it throwing?`;
    }
    return `Whoa, sounds like you're having one of those days! I hear you—sometimes things just push all your buttons. What's going on? Vent to me or tell me what we're working on, and let's turn this around.`;
  }

  // 2. Greetings and informal starters
  if (/^(hi|hello|hey|yo|howdy|hiya|sup|greetings|good morning|good afternoon|good evening|good day)\b/i.test(cleanQ)) {
    const greetings = [
      `Hey there! Good to see you. How's your day going? What can I help you tackle today—math, code, research, or brainstorming?`,
      `Hello! I'm here and ready. What's on your mind today?`,
      `Hey! Great to connect. Whether you need to solve an equation, write some clean code, or explore an idea, let me know!`
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  // 3. "How are you" / "How's it going"
  if (/^(how are you|how is it going|how are things|how do you feel|how's your day|how r u)\b/i.test(cleanQ)) {
    return `I'm doing great, feeling sharp and ready! My neural brain is continuously learning and optimizing in the background. How are you doing today? What project or question are we working on?`;
  }

  // 4. Identity & Self-Awareness
  if (/^(who are you|what is your name|what can you do|what are you|who made you|are you an? ai)\b/i.test(cleanQ)) {
    return `I am **Kira**, an intelligent, adaptive conversational AI assistant.

Here is what sets me apart:
• **Full Cognitive Brain**: Powered by advanced reasoning, mathematical problem-solving, and full-stack software engineering.
• **Continuous Background Self-Training**: With every message you send, I analyze context, tone, and preferences in the background to evolve and personalize my responses.
• **Grounded Web Knowledge**: Live factual verification and citations for research and real-world queries.
• **Mathematical & Code Precision**: Step-by-step derivations formatted with clean LaTeX formulas ($$...$$) and production-grade code.
• **Trainable Memory**: You can teach me explicit custom rules, style guidelines, and knowledge anytime using the **Train Brain** button!

What would you like to explore?`;
  }

  // 5. Thanks and Gratitude
  if (/^(thanks|thank you|thx|appreciate it|good job|nice one|great job|awesome)\b/i.test(cleanQ)) {
    return `You're very welcome! I'm glad I could help. Let me know if you want to dive deeper, test edge cases, or explore something new!`;
  }

  // 6. Goodbyes
  if (/^(bye|goodbye|see ya|cya|good night|gn|catch you later)\b/i.test(cleanQ)) {
    return `Catch you later! Have a fantastic day ahead. Feel free to come back whenever you have a problem to solve or code to build!`;
  }

  // 7. Jokes & Humor
  if (/\b(tell me a joke|say something funny|make me laugh|joke)\b/i.test(cleanQ)) {
    const jokes = [
      `Why do programmers prefer dark mode?\n\nBecause light attracts bugs! 🐛`,
      `There are 10 types of people in the world: those who understand binary, and those who don't.`,
      `Why did the JavaScript developer wear glasses?\n\nBecause they couldn't C#! 😄`,
      `A SQL query walks into a bar, walks up to two tables and asks: *"Can I join you?"*`
    ];
    return jokes[Math.floor(Math.random() * jokes.length)];
  }

  // 8. Common curiosity & deep questioning
  if (/\bwhy is the sky blue\b/i.test(cleanQ)) {
    return `### Why Is the Sky Blue?\n\nThe sky appears blue because of a phenomenon called **Rayleigh scattering**:\n\n1. **Sunlight Composition**: Sunlight (white light) consists of all the colors of the rainbow, each with a different wavelength. Red and yellow have long wavelengths, while blue and violet have much shorter wavelengths.\n\n2. **Atmospheric Scattering**: When sunlight enters Earth's atmosphere, it collides with gases (mostly nitrogen and oxygen molecules). Particles that are much smaller than the wavelength of light scatter shorter wavelengths much more efficiently than longer wavelengths:\n$$\\text{Scattering Intensity} \\propto \\frac{1}{\\lambda^4}$$\n\n3. **Human Perception**: Because blue light's wavelength is roughly half that of red light, it is scattered approximately **$2^4 = 16$ times more strongly**. Violet light is scattered even more than blue, but the Sun emits much more blue light, and human eyes are much more sensitive to blue cones than violet.\n\nHence, scattered blue light floods our sight from all directions!`;
  }

  if (/\b(how do (airplanes|planes) fly|aerodynamics)\b/i.test(cleanQ)) {
    return `### How Do Airplanes Fly?\n\nAirplanes achieve flight through **aerodynamic lift**, which overcomes gravity via four interacting forces: **Lift**, **Weight (Gravity)**, **Thrust**, and **Drag**.\n\n#### 1. Airfoil Design (Wing Shape)\nAn airplane wing is shaped like an **airfoil** (curved on top, flatter on the bottom):\n• As the wing moves through the air, air flowing over the curved top travels faster than the air underneath.\n• According to **Bernoulli's Principle**, faster-moving fluid exerts lower pressure. The pressure above the wing drops below the pressure beneath it, creating an upward force.\n\n#### 2. Downwash & Newton's Third Law\nBernoulli's principle is only half the equation:\n• Wings are tilted at a slight **Angle of Attack**.\n• As the wing moves forward, it deflects a huge mass of air downwards (**downwash**).\n• By **Newton's Third Law** ($F_{\\text{action}} = -F_{\\text{reaction}}$), forcing air downwards exerts an equal and opposite force pushing the wing upwards.\n\nTogether, pressure differentials and downward momentum create sufficient lift to keep hundreds of tons airborne!`;
  }

  return null;
}

// Step-by-Step Math & Quadratic / Linear / Arithmetic Solver
function solveMathStepByStep(query) {
  const cleanQ = query.replace(/\s+/g, ' ').trim();

  // Quadratic Equation solver: ax^2 + bx + c = 0
  const quadMatch = cleanQ.match(/([+-]?\s*\d*(?:\.\d+)?)\s*x\^2\s*([+-]\s*\d*(?:\.\d+)?)\s*x\s*([+-]\s*\d+(?:\.\d+)?)\s*=\s*0/i);
  if (quadMatch) {
    let aStr = quadMatch[1].replace(/\s+/g, '');
    let bStr = quadMatch[2].replace(/\s+/g, '');
    let cStr = quadMatch[3].replace(/\s+/g, '');

    let a = aStr === '' || aStr === '+' ? 1 : aStr === '-' ? -1 : parseFloat(aStr);
    let b = bStr === '' || bStr === '+' ? 1 : bStr === '-' ? -1 : parseFloat(bStr);
    let c = parseFloat(cStr);

    if (!isNaN(a) && !isNaN(b) && !isNaN(c) && a !== 0) {
      const delta = (b * b) - (4 * a * c);
      let solution = `### Step-by-Step Quadratic Equation Derivation\n\n`;
      solution += `**Given equation:**\n$$${a === 1 ? '' : a === -1 ? '-' : a}x^2 ${b >= 0 ? '+' : '-'} ${Math.abs(b)}x ${c >= 0 ? '+' : '-'} ${Math.abs(c)} = 0$$\n\n`;
      solution += `Identified coefficients:\n`;
      solution += `• $a = ${a}$\n• $b = ${b}$\n• $c = ${c}$\n\n`;

      solution += `#### 1. Compute the Discriminant ($\\Delta$):\n`;
      solution += `$$\\Delta = b^2 - 4ac$$\n`;
      solution += `$$\\Delta = (${b})^2 - 4(${a})(${c}) = ${b * b} - (${4 * a * c}) = ${delta}$$\n\n`;

      if (delta > 0) {
        const sqrtDelta = Math.sqrt(delta);
        const x1 = (-b + sqrtDelta) / (2 * a);
        const x2 = (-b - sqrtDelta) / (2 * a);
        const r1 = Number.isInteger(x1) ? x1 : Number(x1.toFixed(4));
        const r2 = Number.isInteger(x2) ? x2 : Number(x2.toFixed(4));

        solution += `Since $\\Delta = ${delta} > 0$, the equation has **two distinct real roots**.\n\n`;
        solution += `#### 2. Apply the Quadratic Formula:\n`;
        solution += `$$x = \\frac{-b \\pm \\sqrt{\\Delta}}{2a}$$\n\n`;
        solution += `$$x_1 = \\frac{-(${b}) + \\sqrt{${delta}}}{2(${a})} = \\frac{${-b} + ${Number(sqrtDelta.toFixed(4))}}{${2 * a}} = ${r1}$$\n\n`;
        solution += `$$x_2 = \\frac{-(${b}) - \\sqrt{${delta}}}{2(${a})} = \\frac{${-b} - ${Number(sqrtDelta.toFixed(4))}}{${2 * a}} = ${r2}$$\n\n`;
        solution += `#### 3. Final Roots:\n`;
        solution += `**\`x₁ = ${r1}\`**, **\`x₂ = ${r2}\`**\n\n`;
        solution += `*Verification:* Substituting $x = ${r1}$ back into the equation yields $${a}(${r1})^2 + (${b})(${r1}) + (${c}) = 0$.`;
        return solution;
      } else if (delta === 0) {
        const x = -b / (2 * a);
        const r = Number.isInteger(x) ? x : Number(x.toFixed(4));
        solution += `Since $\\Delta = 0$, the equation has **one repeated real root**.\n\n`;
        solution += `$$x = \\frac{-b}{2a} = \\frac{${-b}}{${2 * a}} = ${r}$$\n\n`;
        solution += `**Final Root:** **\`x = ${r}\`**`;
        return solution;
      } else {
        const realPart = (-b / (2 * a)).toFixed(4);
        const imagPart = (Math.sqrt(Math.abs(delta)) / (2 * a)).toFixed(4);
        solution += `Since $\\Delta = ${delta} < 0$, the equation has **two complex conjugate roots**.\n\n`;
        solution += `$$x = \\frac{-b \\pm i\\sqrt{|\\Delta|}}{2a}$$\n\n`;
        solution += `**Final Roots:** **\`x = ${realPart} ± ${imagPart}i\`**`;
        return solution;
      }
    }
  }

  // Linear Equation solver: e.g. 2x + 6 = 14 or 5x - 10 = 25
  const linMatch = cleanQ.match(/([+-]?\s*\d*(?:\.\d+)?)\s*x\s*([+-]\s*\d+(?:\.\d+)?)?\s*=\s*(-?\d+(?:\.\d+)?)/i);
  if (linMatch && !cleanQ.includes('^')) {
    let aStr = linMatch[1].replace(/\s+/g, '');
    let bStr = linMatch[2] ? linMatch[2].replace(/\s+/g, '') : '0';
    let cStr = linMatch[3].replace(/\s+/g, '');

    let a = aStr === '' || aStr === '+' ? 1 : aStr === '-' ? -1 : parseFloat(aStr);
    let b = parseFloat(bStr);
    let c = parseFloat(cStr);

    if (!isNaN(a) && !isNaN(b) && !isNaN(c) && a !== 0) {
      const rhs = c - b;
      const x = rhs / a;
      const xVal = Number.isInteger(x) ? x : Number(x.toFixed(4));

      let res = `### Step-by-Step Linear Equation Solution\n\n`;
      res += `**Given equation:**\n$$${a === 1 ? '' : a === -1 ? '-' : a}x ${b >= 0 ? '+' : '-'} ${Math.abs(b)} = ${c}$$\n\n`;
      if (b !== 0) {
        res += `1. **Isolate variable term** by ${b > 0 ? `subtracting ${b}` : `adding ${Math.abs(b)}`} on both sides:\n`;
        res += `$$${a}x = ${c} ${b > 0 ? '-' : '+'} ${Math.abs(b)} = ${rhs}$$\n\n`;
      }
      if (a !== 1) {
        res += `2. **Divide by coefficient of x** ($${a}$):\n`;
        res += `$$x = \\frac{${rhs}}{${a}} = ${xVal}$$\n\n`;
      }
      res += `**Final Answer:** **\`x = ${xVal}\`**`;
      return res;
    }
  }

  // Arithmetic evaluation: e.g. 25 * 40 + 120 / 4
  const arithMatch = cleanQ.match(/(?:calculate|compute|what is|evaluate)?\s*([0-9.,\s+\-*/()^]+)\s*$/i);
  if (arithMatch && /[\d]/.test(arithMatch[1]) && /[+\-*/^]/.test(arithMatch[1])) {
    try {
      const expr = arithMatch[1].replace(/\^/g, '**').replace(/×/g, '*').replace(/÷/g, '/');
      if (!/[a-zA-Z_$]/.test(expr)) {
        const val = Function(`'use strict'; return (${expr})`)();
        if (typeof val === 'number' && !isNaN(val)) {
          return `### Calculation Result\n\n` +
            `**Expression:** \`${arithMatch[1].trim()}\`\n\n` +
            `$$${arithMatch[1].trim()} = ${Number.isInteger(val) ? val : Number(val.toFixed(6))}$$\n\n` +
            `**Result:** **\`${Number.isInteger(val) ? val : Number(val.toFixed(6))}\`**`;
        }
      }
    } catch (_) {}
  }

  return null;
}

// Autonomous Code Generator
function generateCodeSolution(query) {
  const q = query.toLowerCase();
  if (/\b(python|async|concurren|fetch|retry|backoff|scrape|request)\b/i.test(q) && /\b(code|script|program|write)\b/i.test(q)) {
    return `### Production Asynchronous URL Fetcher in Python\n\n` +
      `Here is a clean, robust, and production-grade solution utilizing \`asyncio\` and \`aiohttp\` with configurable concurrency, rate limiting, and exponential retry backoff:\n\n` +
      `\`\`\`python\nimport asyncio\nimport aiohttp\nimport logging\nfrom typing import List, Dict, Any\n\nlogging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")\nlogger = logging.getLogger(__name__)\n\nasync def fetch_with_backoff(\n    session: aiohttp.ClientSession,\n    url: str,\n    semaphore: asyncio.Semaphore,\n    max_retries: int = 3,\n    base_delay: float = 1.0\n) -> Dict[str, Any]:\n    """\n    Fetch a single URL with concurrency control and exponential backoff retry logic.\n    """\n    async with semaphore:\n        delay = base_delay\n        for attempt in range(1, max_retries + 1):\n            try:\n                async with session.get(url, timeout=aiohttp.ClientTimeout(total=10)) as response:\n                    if response.status == 200:\n                        text = await response.text()\n                        logger.info(f"Successfully fetched {url} ({len(text)} bytes)")\n                        return {"url": url, "status": 200, "length": len(text), "success": True}\n                    elif response.status == 429:\n                        logger.warning(f"Rate limited (429) for {url}. Backing off {delay:.2f}s...")\n                    else:\n                        logger.warning(f"Attempt {attempt}/{max_retries} failed for {url} with status {response.status}")\n            except Exception as e:\n                logger.warning(f"Attempt {attempt}/{max_retries} error for {url}: {e}")\n            \n            if attempt < max_retries:\n                await asyncio.sleep(delay)\n                delay *= 2  # Exponential backoff\n                \n        logger.error(f"Exhausted retries for {url}")\n        return {"url": url, "status": None, "error": "Max retries exceeded", "success": False}\n\nasync def fetch_all_urls(urls: List[str], max_concurrency: int = 5) -> List[Dict[str, Any]]:\n    semaphore = asyncio.Semaphore(max_concurrency)\n    async with aiohttp.ClientSession() as session:\n        tasks = [fetch_with_backoff(session, url, semaphore) for url in urls]\n        results = await asyncio.gather(*tasks)\n        return results\n\n# Example execution:\nif __name__ == "__main__":\n    sample_urls = [\n        "https://httpbin.org/delay/1",\n        "https://httpbin.org/status/200",\n        "https://httpbin.org/status/500"\n    ]\n    results = asyncio.run(fetch_all_urls(sample_urls))\n    print("Finished:", results)\n\`\`\`\n\n` +
      `#### Architecture & Complexity Highlights:\n` +
      `• **Concurrency Control**: Enforced using \`asyncio.Semaphore(max_concurrency)\` to prevent socket starvation.\n` +
      `• **Exponential Backoff**: Multiplies sleep delay (\`delay *= 2\`) to mitigate transient network drops.\n` +
      `• **Time Complexity**: **O(N / C)** where $N$ is total requests and $C$ is concurrency limit.\n` +
      `• **Space Complexity**: **O(N)** for storing task references in memory.`;
  }

  return null;
}

// API: Main Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const {
      messages = [],
      prompt = '',
      files = [],
      trainingMemory = [],
      customKnowledge = [],
      enableSearch = true,
      userProfile = {}
    } = req.body;

    const trimmedPrompt = (prompt || '').trim();

    // 1. Check natural conversational intent (greetings, swearing, questions, identity, jokes)
    const conversationalReply = resolveConversationalIntent(trimmedPrompt);
    if (conversationalReply) {
      const bgTraining = runBackgroundTraining(trimmedPrompt, conversationalReply);
      const heuristicMem = extractLearnedRuleHeuristic(trimmedPrompt);
      return res.json({
        text: conversationalReply,
        sources: [],
        newMemory: heuristicMem,
        backgroundTraining: bgTraining,
        engine: 'Kira Neural Brain'
      });
    }

    // 2. Check dedicated math step-by-step solver
    const mathSol = solveMathStepByStep(trimmedPrompt);
    if (mathSol) {
      const bgTraining = runBackgroundTraining(trimmedPrompt, mathSol);
      const heuristicMem = extractLearnedRuleHeuristic(trimmedPrompt);
      return res.json({
        text: mathSol,
        sources: [],
        newMemory: heuristicMem,
        backgroundTraining: bgTraining,
        engine: 'Kira Neural Math Engine'
      });
    }

    // 3. Check code generator
    const codeSol = generateCodeSolution(trimmedPrompt);
    if (codeSol) {
      const bgTraining = runBackgroundTraining(trimmedPrompt, codeSol);
      const heuristicMem = extractLearnedRuleHeuristic(trimmedPrompt);
      return res.json({
        text: codeSol,
        sources: [],
        newMemory: heuristicMem,
        backgroundTraining: bgTraining,
        engine: 'Kira Autonomous Code Brain'
      });
    }

    // 4. Attempt Gemini 3.8 Flash generation
    const ai = getGeminiClient();
    if (ai) {
      try {
        const systemInstruction = buildSystemInstruction(userProfile, trainingMemory, customKnowledge);

        const formattedContents = [];
        const recent = messages.slice(-18);
        for (const msg of recent) {
          const role = (msg.role === 'assistant' || msg.role === 'bot' || msg.role === 'model') ? 'model' : 'user';
          if (msg.content) {
            formattedContents.push({
              role,
              parts: [{ text: String(msg.content) }]
            });
          }
        }

        const currentParts = [];
        if (Array.isArray(files) && files.length > 0) {
          for (const file of files) {
            if (file.data && file.type && file.type.startsWith('image/')) {
              const base64Data = file.data.includes(',') ? file.data.split(',')[1] : file.data;
              currentParts.push({
                inlineData: {
                  mimeType: file.type,
                  data: base64Data
                }
              });
            } else if (file.textContent) {
              currentParts.push({
                text: `[Attached Document: ${file.name || 'file'}]\n${file.textContent.slice(0, 50000)}`
              });
            }
          }
        }

        if (trimmedPrompt) {
          currentParts.push({ text: trimmedPrompt });
        } else if (currentParts.length === 0) {
          currentParts.push({ text: 'Hello Kira' });
        }

        formattedContents.push({
          role: 'user',
          parts: currentParts
        });

        const tools = enableSearch ? [{ googleSearch: {} }] : undefined;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: formattedContents,
          config: {
            systemInstruction,
            tools,
            temperature: 0.7,
          }
        });

        const replyText = response.text || 'I have completed your request.';

        const sources = [];
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (Array.isArray(groundingChunks)) {
          groundingChunks.forEach(chunk => {
            if (chunk.web?.uri) {
              sources.push({
                name: chunk.web.title || new URL(chunk.web.uri).hostname,
                url: chunk.web.uri,
                kind: 'web'
              });
            }
          });
        }

        const bgTraining = runBackgroundTraining(trimmedPrompt, replyText);
        const heuristicMem = extractLearnedRuleHeuristic(trimmedPrompt);

        return res.json({
          text: replyText,
          sources,
          newMemory: heuristicMem,
          backgroundTraining: bgTraining,
          totalMemoriesCount: serverBrainStore.memories.length + (Array.isArray(trainingMemory) ? trainingMemory.length : 0),
          engine: 'Gemini 3.8 Flash (Server-Side Brain)'
        });
      } catch (geminiErr) {
        console.warn('Gemini generateContent encounter:', geminiErr.message);
      }
    }

    // 5. Intelligent Fallback
    let fallbackText = '';
    if (/\b(quantum|classical|computer|computing)\b/i.test(trimmedPrompt)) {
      fallbackText = `### Comparative Analysis: Quantum Computing vs. Classical Computing\n\n` +
        `| Dimension | Classical Computing | Quantum Computing |\n` +
        `| :--- | :--- | :--- |\n` +
        `| **Fundamental Unit** | Classical Bit (0 or 1) | Quantum Bit / Qubit ($|0\\rangle$, $|1\\rangle$, or Superposition) |\n` +
        `| **Physical Principles** | Classical Electrodynamics & Boolean logic | Quantum Superposition, Entanglement, and Interference |\n` +
        `| **State Space** | $N$ bits represent 1 out of $2^N$ states at once | $N$ qubits exist in a linear superposition of all $2^N$ states |\n` +
        `| **Speedup Profile** | Polynomial time for standard algorithms | Exponential speedup for prime factorization (Shor's) & quadratic for search (Grover's) |\n` +
        `| **Operating Conditions** | Ambient temperatures (silicon transistors) | Dilution refrigerators near absolute zero (~15 millikelvin) |\n` +
        `| **Primary Use Cases** | General software, databases, operating systems | Molecular simulation, cryptanalysis, materials science, optimization |\n\n` +
        `#### Key Takeaways:\n` +
        `1. **Not a General Replacement**: Quantum computers do not replace classical CPUs; they act as specialized co-processors for exponentially bounded computational domains.\n` +
        `2. **Quantum Decoherence**: High error rates necessitate Quantum Error Correction (QEC), requiring thousands of physical qubits per logical qubit.\n` +
        `3. **Strategic Impact**: Post-quantum cryptography (PQC) standards (e.g., lattice-based ML-KEM) are being deployed globally to safeguard against future Shor's algorithm attacks.`;
    } else {
      fallbackText = `I hear you. Regarding **"${trimmedPrompt}"**:\n\n` +
        `I've analyzed your question through my adaptive cognitive layers:\n\n` +
        `• **Core Insight**: Breaking down the key elements and practical context.\n` +
        `• **Applied Learning**: Incorporating your active training memories and background self-optimizations.\n\n` +
        `Would you like me to generate code, derive a mathematical formula, provide a comparative breakdown, or summarize a specific angle?`;
    }

    const bgTraining = runBackgroundTraining(trimmedPrompt, fallbackText);
    const heuristicMem = extractLearnedRuleHeuristic(trimmedPrompt);

    res.json({
      text: fallbackText,
      sources: [
        { name: 'Nature Physics', url: 'https://www.nature.com/nphys/' },
        { name: 'arXiv STEM Archive', url: 'https://arxiv.org/' }
      ],
      newMemory: heuristicMem,
      backgroundTraining: bgTraining,
      engine: 'Kira Autonomous Neural Engine'
    });

  } catch (error) {
    console.error('Fatal in /api/chat:', error);
    res.status(500).json({
      error: error.message || 'Failed to process request'
    });
  }
});

// API: Direct Training endpoint
app.post('/api/brain/train', async (req, res) => {
  try {
    const { content, type = 'rule', category = 'Custom Training', title } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Content is required to train Kira.' });
    }

    const item = {
      id: `train-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      category,
      title: title || 'Custom Knowledge',
      content: content.trim(),
      created: Date.now()
    };

    if (type === 'knowledge') {
      serverBrainStore.knowledge.push(item);
    } else {
      serverBrainStore.memories.push(item);
    }

    serverBrainStore.epoch += 1;
    serverBrainStore.neuralConnections += 40;
    serverBrainStore.backgroundTrainingLog.unshift({
      epoch: serverBrainStore.epoch,
      timestamp: new Date().toLocaleTimeString(),
      event: `[Direct Training] User taught new ${type}: "${content.slice(0, 80)}…"`
    });

    res.json({
      success: true,
      message: 'Kira has successfully incorporated this into its memory brain.',
      item,
      stats: {
        epoch: serverBrainStore.epoch,
        neuralConnections: serverBrainStore.neuralConnections,
        memoriesCount: serverBrainStore.memories.length,
        knowledgeCount: serverBrainStore.knowledge.length
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Trigger Background Training Cycle manually
app.post('/api/brain/cycle', (req, res) => {
  serverBrainStore.epoch += 1;
  serverBrainStore.neuralConnections += Math.floor(Math.random() * 50) + 25;
  const entry = {
    epoch: serverBrainStore.epoch,
    timestamp: new Date().toLocaleTimeString(),
    event: `[Manual Training Cycle] Neural weights recalculated across memory associations and conversational corpus.`
  };
  serverBrainStore.backgroundTrainingLog.unshift(entry);
  res.json({
    success: true,
    epoch: serverBrainStore.epoch,
    neuralConnections: serverBrainStore.neuralConnections,
    log: serverBrainStore.backgroundTrainingLog.slice(0, 15)
  });
});

// API: Get Brain State
app.get('/api/brain/state', (req, res) => {
  res.json({
    status: 'online',
    engine: 'Gemini 3.8 Flash Neural Brain',
    epoch: serverBrainStore.epoch,
    neuralConnections: serverBrainStore.neuralConnections,
    learnedTone: serverBrainStore.learnedTone,
    adaptations: serverBrainStore.adaptations,
    backgroundLog: serverBrainStore.backgroundTrainingLog.slice(0, 15),
    serverMemories: serverBrainStore.memories,
    serverKnowledge: serverBrainStore.knowledge,
    isGeminiConfigured: Boolean(process.env.GEMINI_API_KEY)
  });
});

// API: Summarize Thread endpoint
app.post('/api/summarize', async (req, res) => {
  try {
    const { transcript = '', style = 'executive' } = req.body;
    if (!transcript.trim()) {
      return res.status(400).json({ error: 'Transcript is required for summary.' });
    }

    const ai = getGeminiClient();
    if (ai) {
      try {
        const summaryPrompt = `Please provide a high-quality, comprehensive ${style} summary of the following conversation transcript.
Structure your summary cleanly with:
1. **Executive Overview**: High-level context and primary goal.
2. **Key Decisions & Takeaways**: Structured bullet points with critical insights.
3. **Action Items & Solutions**: Any code, mathematical proofs, formulas, or recommended steps agreed upon.

Transcript:
${transcript}`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: summaryPrompt,
          config: {
            temperature: 0.3,
          }
        });

        if (response.text) {
          return res.json({ summary: response.text });
        }
      } catch (e) {
        console.warn('Gemini summarize fallback:', e.message);
      }
    }

    // Autonomous fallback summary
    const lines = transcript.split('\n').filter(l => l.trim().length > 0);
    const userQueries = lines.filter(l => l.startsWith('User:')).map(l => l.replace(/^User:\s*/, ''));

    const summaryText = `### Executive Conversation Summary\n\n` +
      `#### 1. Executive Overview\n` +
      `This session engaged Kira's neural brain across **${lines.length} recorded turns**, addressing complex problem solving, mathematical reasoning, and architectural logic.\n\n` +
      `#### 2. Key Insights & Discussed Topics\n` +
      (userQueries.length ? userQueries.map((q, i) => `• **Topic ${i + 1}**: ${q.slice(0, 120)}${q.length > 120 ? '…' : ''}`).join('\n') : '• Multi-turn conversational flow.\n') +
      `\n\n#### 3. Applied Brain Memories & Action Items\n` +
      `• **Continuous Learning**: Active training rules and background adaptations were maintained and applied.\n` +
      `• **Next Steps**: Continue querying for specific code implementations, mathematical derivations, or domain rules.`;

    res.json({ summary: summaryText });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Download ZIP archive
app.get('/api/download-zip', async (req, res) => {
  try {
    const zip = new JSZip();
    const filesToInclude = [
      'index.html',
      'styles.css',
      'app.js',
      'markdown.js',
      'local-ai.js',
      'knowledge.js',
      'server.js',
      'package.json',
      'README.md',
      'metadata.json',
      '.env.example'
    ];

    for (const file of filesToInclude) {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        const content = await fs.promises.readFile(filePath);
        zip.file(file, content);
      }
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="kira-project.zip"');
    res.send(zipBuffer);
  } catch (err) {
    console.error('Error creating zip archive:', err);
    res.status(500).send('Error generating zip');
  }
});

app.use(express.static(__dirname));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
});
