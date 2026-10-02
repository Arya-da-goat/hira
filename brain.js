/* Kira Brain v1
 * Fully local answer engine. No Hugging Face, no remote inference model, no API key.
 * Uses local rules, math, conversation memory, and retrieved evidence supplied by KiraKnowledge.
 */
(() => {
  const memory = [];
  const stop = new Set("a an the and or of to in on for is are was were be been being what which who where when why how can could would should do does did tell me please explain about from with into as by at it this that these those i me my your you we they them their there here very really just get give show make use used using".split(" "));

  function clean(s) { return String(s || "").replace(/\s+/g, " ").trim(); }
  function words(s) {
    return [...new Set(clean(s).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").split(" ")
      .filter(x => x.length > 2 && !stop.has(x)))];
  }
  function esc(s) { return clean(s).replace(/\s+/g, " "); }

  function math(q) {
    let s = String(q || "").trim().toLowerCase()
      .replace(/^(what is|calculate|solve|find)\s+/i, "")
      .replace(/,/g, "")
      .replace(/(\d+(?:\.\d+)?)\s*(?:x|×)\s*(\d+(?:\.\d+)?)/g, "$1*$2")
      .replace(/(\d+(?:\.\d+)?)\s*(?:÷|divided by)\s*(\d+(?:\.\d+)?)/g, "$1/$2")
      .replace(/\^/g, "**")
      .trim();
    if (!/^[\d\s.+\-*/%()]+$/.test(s) || !/[+\-*/%]/.test(s)) return null;
    try {
      const value = Function('"use strict";return (' + s + ')')();
      return Number.isFinite(value) ? String(value) : null;
    } catch (_) { return null; }
  }

  function intent(q) {
    const s = q.toLowerCase();
    if (/^(hi|hey|hello|yo|sup|good morning|good evening)\b/.test(s)) return "greeting";
    if (/\b(thank you|thanks|thx)\b/.test(s)) return "thanks";
    if (/\b(your name|who are you|what are you)\b/.test(s)) return "identity";
    if (/\b(define|definition|meaning|what is|what are)\b/.test(s)) return "definition";
    if (/\b(how do i|how to|steps|teach me|explain how)\b/.test(s)) return "howto";
    if (/\b(compare|difference|vs\.?|versus)\b/.test(s)) return "compare";
    if (/\b(why)\b/.test(s)) return "why";
    if (/\b(code|coding|javascript|python|html|css|discord|github|program)\b/.test(s)) return "coding";
    return "general";
  }

  function localFact(q) {
    const s = q.toLowerCase();
    const facts = [
      [/\b(capital of india)\b/, "The capital of India is New Delhi."],
      [/\b(capital of france)\b/, "The capital of France is Paris."],
      [/\b(planet.*largest|largest planet)\b/, "Jupiter is the largest planet in the Solar System."],
      [/\b(planet.*red|red planet)\b/, "Mars is commonly called the Red Planet."],
      [/\b(speed of light)\b/, "The speed of light in vacuum is about 299,792,458 metres per second."],
      [/\b(water.*formula|formula.*water)\b/, "Water has the chemical formula H₂O."],
      [/\b(photosynthesis)\b/, "Photosynthesis is the process by which plants use light energy to make sugars from carbon dioxide and water, releasing oxygen."],
      [/\b(gravity)\b/, "Gravity is the attraction between masses. Near Earth's surface, objects accelerate downward at about 9.8 m/s²."],
      [/\b(newton.*first law|first law.*newton)\b/, "Newton's first law says an object remains at rest or in uniform straight-line motion unless acted on by a net external force."],
      [/\b(chemical equation)\b/, "A chemical equation represents a chemical reaction using formulas and coefficients. Coefficients balance the number of each type of atom on both sides."],
      [/\b(html)\b/, "HTML (HyperText Markup Language) structures content on web pages using elements such as headings, paragraphs, links and images."],
      [/\b(css)\b/, "CSS (Cascading Style Sheets) controls the presentation of web pages, including layout, spacing, colors and typography."],
      [/\b(javascript)\b/, "JavaScript is a programming language commonly used to add logic and interactivity to web pages and applications."]
    ];
    for (const [re, answer] of facts) if (re.test(s)) return answer;
    return null;
  }

  function summarizeEvidence(context, q) {
    if (!context) return "";
    const lines = String(context).split(/\n+/)
      .map(x => x.replace(/^\[[^\]]+\]\s*/, "").trim())
      .filter(x => x && !/^Source:/i.test(x) && x.length > 35);
    const terms = words(q);
    const scored = lines.map(line => ({
      line,
      score: terms.reduce((n, t) => n + (line.toLowerCase().includes(t) ? 1 : 0), 0)
    })).sort((a,b) => b.score-a.score);
    const chosen = [];
    const seen = new Set();
    for (const item of scored) {
      const key = item.line.toLowerCase().replace(/[^a-z0-9]+/g, " ").slice(0, 180);
      if (!seen.has(key)) { seen.add(key); chosen.push(item.line); }
      if (chosen.length >= 5) break;
    }
    return chosen.join(" ");
  }

  function build(q, context, imageContext) {
    const original = clean(q);
    if (!original) return "Tell me what you want to know.";
    const m = math(original);
    if (m !== null) return `The answer is ${m}.`;

    const fact = localFact(original);
    if (fact && !context) return fact;

    const type = intent(original);
    if (type === "greeting") return "Hey! I'm Kira. What would you like to work on?";
    if (type === "thanks") return "You're welcome!";
    if (type === "identity") return "I'm Kira — a browser-local assistant. My answer engine runs in this page without Hugging Face or a hosted AI model.";

    const evidence = summarizeEvidence(context, original);
    const visual = imageContext ? `\n\nImage information available locally:\n${esc(imageContext)}` : "";
    if (evidence) {
      if (type === "definition") return `In simple terms: ${evidence}${visual}`;
      if (type === "howto") return `Here’s the useful information I found:\n\n${evidence}${visual}`;
      if (type === "compare") return `Here’s the relevant comparison information:\n\n${evidence}${visual}`;
      if (type === "why") return `The available information indicates:\n\n${evidence}${visual}`;
      return `${evidence}${visual}`;
    }

    if (fact) return fact + visual;
    if (type === "howto") return "I can explain it step by step. Give me the exact thing you want to learn.";
    if (type === "definition") return `I don't have a built-in fact for “${original}” yet. You can ask Kira to search for it, and I'll use the retrieved information as evidence.`;
    if (imageContext) return `I can use the local image information, but I don't have enough evidence to answer confidently.\n\n${esc(imageContext)}`;
    return `I don't have enough local knowledge to answer “${original}” confidently yet. Try a more specific question or ask for a web search.`;
  }

  async function answer(question, options = {}) {
    const q = clean(question);
    const result = build(q, options.context || "", options.imageContext || "");
    memory.push({ role: "user", content: q }, { role: "assistant", content: result });
    while (memory.length > 12) memory.shift();
    return result;
  }

  window.KiraBrain = {
    answer,
    clear: () => memory.splice(0, memory.length),
    get memory() { return [...memory]; }
  };
})();
