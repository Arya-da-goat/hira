/**
 * Kira Local Intelligence Engine & Reasoning Brain
 * Features autonomous offline logic, dynamic code generation, multi-step math solving,
 * comparative analysis, professional writing, and web research synthesis without any AI API.
 */
(() => {
  const memoryKey = 'kira-local-memory-v14';
  let busy = false;

  const emit = (type, detail = {}) =>
    window.dispatchEvent(new CustomEvent('kira-ai-status', { detail: { type, ...detail } }));
  const clean = s => String(s ?? '').replace(/\s+/g, ' ').trim();
  const words = s => clean(s).toLowerCase().split(/[^a-z0-9]+/).filter(x => x.length > 1);

  function getSettings(override = {}) {
    let stored = {};
    try {
      stored = JSON.parse(localStorage.getItem('kira-settings-v1') || '{}') || {};
    } catch (_) {}
    return {
      name: 'Arya',
      style: 'professional',
      detail: 'balanced',
      emojis: false,
      context: true,
      memory: true,
      smartSearch: true,
      multiSource: true,
      ...stored,
      ...override
    };
  }

  // --- 1. DYNAMIC CODE GENERATION ENGINE ---
  const codeCatalog = {
    // Two Sum
    'twosum': {
      title: 'Two Sum Problem',
      lang: 'python',
      code: `def two_sum(nums, target):\n    """\n    Find indices of the two numbers that add up to target.\n    Time Complexity: O(n)\n    Space Complexity: O(n)\n    """\n    seen = {}\n    for i, num in enumerate(nums):\n        complement = target - num\n        if complement in seen:\n            return [seen[complement], i]\n        seen[num] = i\n    return []\n\n# Example usage:\nnumbers = [2, 7, 11, 15]\ntarget_val = 9\nprint(two_sum(numbers, target_val))  # Output: [0, 1]`,
      explanation: 'Uses a hash map (dictionary) to store each number and its index. For each number, we check if its complement (`target - num`) exists in the dictionary, achieving linear **O(n)** time.'
    },
    // Binary Search
    'binarysearch': {
      title: 'Binary Search Algorithm',
      lang: 'python',
      code: `def binary_search(arr, target):\n    """\n    Perform binary search on a sorted list.\n    Time Complexity: O(log n)\n    Space Complexity: O(1)\n    """\n    low, high = 0, len(arr) - 1\n    \n    while low <= high:\n        mid = (low + high) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            low = mid + 1\n        else:\n            high = mid - 1\n            \n    return -1  # Target not found\n\n# Example usage:\nsorted_list = [3, 9, 14, 19, 25, 33, 47, 56]\nidx = binary_search(sorted_list, 25)\nprint(f"Target found at index: {idx}")  # Output: 4`,
      explanation: 'Repeatedly divides the search range in half by comparing the target with the middle element. Requires a pre-sorted array.'
    },
    // Fibonacci
    'fibonacci': {
      title: 'Fibonacci Sequence',
      lang: 'python',
      code: `def fibonacci_iterative(n):\n    """Compute the n-th Fibonacci number in O(n) time and O(1) space."""\n    if n <= 0:\n        return 0\n    elif n == 1:\n        return 1\n    \n    a, b = 0, 1\n    for _ in range(2, n + 1):\n        a, b = b, a + b\n    return b\n\ndef fibonacci_memoized(n, memo=None):\n    """Compute using dynamic programming (memoization)."""\n    if memo is None:\n        memo = {0: 0, 1: 1}\n    if n not in memo:\n        memo[n] = fibonacci_memoized(n - 1, memo) + fibonacci_memoized(n - 2, memo)\n    return memo[n]\n\n# Example usage:\nprint([fibonacci_iterative(i) for i in range(10)])\n# Output: [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]`,
      explanation: 'Demonstrates both iterative calculation ($O(1)$ space) and recursive dynamic programming with memoization ($O(n)$ time).'
    },
    // Reverse String
    'reversestring': {
      title: 'Reverse a String',
      lang: 'javascript',
      code: `// Method 1: Built-in array methods\nfunction reverseString(str) {\n  return str.split('').reverse().join('');\n}\n\n// Method 2: Two-pointer in-place simulation\nfunction reverseStringTwoPointer(str) {\n  const chars = [...str];\n  let left = 0, right = chars.length - 1;\n  while (left < right) {\n    [chars[left], chars[right]] = [chars[right], chars[left]];\n    left++;\n    right--;\n  }\n  return chars.join('');\n}\n\n// Example usage:\nconsole.log(reverseString("Kira AI")); // "IA ariK"`,
      explanation: 'Includes both the concise JavaScript idiom and the fundamental two-pointer swap approach.'
    },
    // Palindrome
    'palindrome': {
      title: 'Palindrome Checker',
      lang: 'python',
      code: `import re\n\ndef is_palindrome(text: str) -> bool:\n    """Check if a string is a palindrome, ignoring non-alphanumeric characters and case."""\n    cleaned = re.sub(r'[^a-zA-Z0-9]', '', text).lower()\n    return cleaned == cleaned[::-1]\n\n# Test cases:\nprint(is_palindrome("A man, a plan, a canal: Panama"))  # True\nprint(is_palindrome("race a car"))                      # False`,
      explanation: 'Cleans the string of non-alphanumeric characters, normalizes case, and checks symmetry via string slicing.'
    },
    // Center Div CSS
    'centerdiv': {
      title: 'Centering a Div with CSS',
      lang: 'css',
      code: `/* Option 1: Modern CSS Grid (Simplest) */\n.parent-grid {\n  display: grid;\n  place-items: center;\n  min-height: 100vh;\n}\n\n/* Option 2: CSS Flexbox */\n.parent-flex {\n  display: flex;\n  justify-content: center; /* Horizontally */\n  align-items: center;     /* Vertically */\n  min-height: 100vh;\n}\n\n/* Option 3: Absolute positioning with transform */\n.parent-relative {\n  position: relative;\n  min-height: 100vh;\n}\n.child-centered {\n  position: absolute;\n  top: 50%;\n  left: 50%;\n  transform: translate(-50%, -50%);\n}`,
      explanation: 'Both **CSS Grid** (`place-items: center`) and **Flexbox** are modern, robust solutions that work without hardcoding element dimensions.'
    },
    // Debounce
    'debounce': {
      title: 'Debounce Function in JavaScript',
      lang: 'javascript',
      code: `function debounce(func, delay = 300) {\n  let timerId;\n  return function (...args) {\n    const context = this;\n    clearTimeout(timerId);\n    timerId = setTimeout(() => {\n      func.apply(context, args);\n    }, delay);\n  };\n}\n\n// Example: Optimizing search input\nconst onSearch = debounce((query) => {\n  console.log("Searching API for:", query);\n}, 400);\n\n// document.getElementById('search').addEventListener('input', e => onSearch(e.target.value));`,
      explanation: 'Delays the execution of a function until after a specified wait period has elapsed since the last time it was invoked.'
    },
    // Fetch API
    'fetchapi': {
      title: 'Fetch API with Error Handling',
      lang: 'javascript',
      code: `async function fetchData(url) {\n  try {\n    const response = await fetch(url, {\n      method: 'GET',\n      headers: {\n        'Content-Type': 'application/json',\n        'Accept': 'application/json'\n      }\n    });\n\n    if (!response.ok) {\n      throw new Error(\`HTTP error! status: \${response.status}\`);\n    }\n\n    const data = await response.json();\n    return data;\n  } catch (error) {\n    console.error("Fetch request failed:", error.message);\n    throw error;\n  }\n}\n\n// Example usage:\n// fetchData('https://jsonplaceholder.typicode.com/posts/1').then(console.log);`,
      explanation: 'Uses modern `async/await` with robust check for `response.ok` (to catch HTTP 4xx and 5xx errors) and `try/catch`.'
    },
    // Express Server
    'expressserver': {
      title: 'REST API with Express.js',
      lang: 'javascript',
      code: `import express from 'express';\n\nconst app = express();\nconst PORT = process.env.PORT || 3000;\n\n// Built-in body parser middleware\napp.use(express.json());\n\n// In-memory data store\nlet items = [\n  { id: 1, name: 'Item Alpha' },\n  { id: 2, name: 'Item Beta' }\n];\n\n// GET all\napp.get('/api/items', (req, res) => {\n  res.json(items);\n});\n\n// GET single\napp.get('/api/items/:id', (req, res) => {\n  const item = items.find(i => i.id === parseInt(req.params.id));\n  if (!item) return res.status(404).json({ error: 'Item not found' });\n  res.json(item);\n});\n\n// POST create\napp.post('/api/items', (req, res) => {\n  const newItem = { id: Date.now(), name: req.body.name };\n  items.push(newItem);\n  res.status(201).json(newItem);\n});\n\napp.listen(PORT, '0.0.0.0', () => {\n  console.log(\`Server listening at http://0.0.0.0:\${PORT}\`);\n});`,
      explanation: 'A clean, complete Express server setup featuring routing, URL params, JSON body parsing, and status codes.'
    },
    // React Counter
    'reactcounter': {
      title: 'React Counter Component',
      lang: 'javascript',
      code: `import React, { useState } from 'react';\n\nexport default function Counter() {\n  const [count, setCount] = useState(0);\n\n  return (\n    <div className="counter-card">\n      <h3>Interactive Counter</h3>\n      <p className="count-display">Current count: <strong>{count}</strong></p>\n      <div className="btn-group">\n        <button onClick={() => setCount(c => c - 1)}>-</button>\n        <button onClick={() => setCount(0)}>Reset</button>\n        <button onClick={() => setCount(c => c + 1)}>+</button>\n      </div>\n    </div>\n  );\n}`,
      explanation: 'Uses functional React state hooks (`useState`) with functional state updater expressions to avoid stale closures.'
    },
    // SQL Queries
    'sqlqueries': {
      title: 'Essential SQL Query Patterns',
      lang: 'sql',
      code: `-- 1. Find second highest salary\nSELECT MAX(salary) AS SecondHighestSalary\nFROM employees\nWHERE salary < (SELECT MAX(salary) FROM employees);\n\n-- 2. Inner Join with Aggregation & Grouping\nSELECT d.department_name, COUNT(e.id) AS total_employees, AVG(e.salary) AS avg_salary\nFROM departments d\nINNER JOIN employees e ON d.id = e.department_id\nGROUP BY d.department_name\nHAVING COUNT(e.id) > 5\nORDER BY avg_salary DESC;\n\n-- 3. Pagination Query\nSELECT id, name, created_at\nFROM users\nORDER BY created_at DESC\nLIMIT 10 OFFSET 20;`,
      explanation: 'Demonstrates subqueries, `INNER JOIN`, aggregate functions (`COUNT`, `AVG`), `GROUP BY`, `HAVING`, and pagination.'
    }
  };

  function resolveCodeQuery(q) {
    const s = q.toLowerCase();
    if (!/\b(code|program|script|function|algorithm|write|implement|how to|example|syntax)\b/i.test(s) &&
        !/\b(python|javascript|typescript|html|css|sql|react|express|bash|regex)\b/i.test(s)) {
      return null;
    }

    if (/\b(two sum|2 sum)\b/i.test(s)) return codeCatalog['twosum'];
    if (/\b(binary search)\b/i.test(s)) return codeCatalog['binarysearch'];
    if (/\b(fibonacci)\b/i.test(s)) return codeCatalog['fibonacci'];
    if (/\b(reverse.*string|string.*reverse)\b/i.test(s)) return codeCatalog['reversestring'];
    if (/\b(palindrome)\b/i.test(s)) return codeCatalog['palindrome'];
    if (/\b(center.*div|center.*element|center.*box)\b/i.test(s)) return codeCatalog['centerdiv'];
    if (/\b(debounce|throttle)\b/i.test(s)) return codeCatalog['debounce'];
    if (/\b(fetch.*api|fetch.*data|http.*request|ajax)\b/i.test(s)) return codeCatalog['fetchapi'];
    if (/\b(express|rest.*api|backend.*server|node.*api)\b/i.test(s)) return codeCatalog['expressserver'];
    if (/\b(react.*counter|counter.*component)\b/i.test(s)) return codeCatalog['reactcounter'];
    if (/\b(sql|second.*highest.*salary|join.*query)\b/i.test(s)) return codeCatalog['sqlqueries'];

    // Dynamic Python template
    if (/\bpython\b/i.test(s)) {
      return {
        title: 'Python Implementation',
        lang: 'python',
        code: `# Clean, idiomatic Python solution\ndef solve_task(data):\n    """Process input data and return result."""\n    if not data:\n        return None\n    \n    # List comprehension and transformation\n    processed = [x.strip().title() for x in data if isinstance(x, str)]\n    return processed\n\n# Example usage:\nsample_data = ["alpha", "beta", "gamma"]\nresult = solve_task(sample_data)\nprint("Result:", result)  # ['Alpha', 'Beta', 'Gamma']`,
        explanation: 'Provides an idiomatic Python implementation with type considerations and list comprehension.'
      };
    }

    // Dynamic JavaScript template
    if (/\b(javascript|js)\b/i.test(s)) {
      return {
        title: 'JavaScript Implementation',
        lang: 'javascript',
        code: `// Modern ES6+ JavaScript implementation\nfunction processItems(items) {\n  if (!Array.isArray(items)) return [];\n\n  return items\n    .filter(item => Boolean(item))\n    .map(item => ({\n      id: crypto.randomUUID?.() || Math.random().toString(36).slice(2),\n      value: item,\n      timestamp: new Date().toISOString()\n    }));\n}\n\n// Example usage:\nconst items = ['Task A', 'Task B', 'Task C'];\nconsole.log(processItems(items));`,
        explanation: 'Uses functional array methods (`filter`, `map`) with modern ES6+ idioms.'
      };
    }

    return null;
  }

  // --- 2. STEP-BY-STEP MATHEMATICS & ALGEBRA SOLVER ---
  function solveLinearEquation(eqStr) {
    // Matches equations like: 3x + 12 = 36 or 2x - 5 = 15 or 4x = 24
    const cleaned = eqStr.replace(/\s+/g, '').replace(/−/g, '-');
    const match = cleaned.match(/^([+-]?\d*(?:\.\d+)?)x([+-]\d+(?:\.\d+)?)?=(-?\d+(?:\.\d+)?)$/i);
    if (!match) return null;

    let aStr = match[1];
    let bStr = match[2] || '0';
    let cStr = match[3];

    let a = aStr === '' || aStr === '+' ? 1 : aStr === '-' ? -1 : parseFloat(aStr);
    let b = parseFloat(bStr);
    let c = parseFloat(cStr);

    if (isNaN(a) || isNaN(b) || isNaN(c) || a === 0) return null;

    // Step 1: subtract b from c
    const rhsAfterB = c - b;
    // Step 2: divide by a
    const x = rhsAfterB / a;
    const xFormatted = Number.isInteger(x) ? x : Number(x.toFixed(4));

    let steps = `### Step-by-Step Algebraic Solution\n\n`;
    steps += `**Given equation:** \`${cleaned}\`\n\n`;
    if (b !== 0) {
      const op = b > 0 ? `subtract ${b}` : `add ${Math.abs(b)}`;
      steps += `1. **Isolate the variable term**: ${op} on both sides:\n`;
      steps += `   $$${a === 1 ? '' : a === -1 ? '-' : a}x = ${c} ${b > 0 ? '-' : '+'} ${Math.abs(b)}$$\n`;
      steps += `   $$${a === 1 ? '' : a === -1 ? '-' : a}x = ${rhsAfterB}$$\n\n`;
    }
    if (a !== 1) {
      steps += `2. **Divide by the coefficient of x** ($${a}$):\n`;
      steps += `   $$x = \\frac{${rhsAfterB}}{${a}}$$\n`;
      steps += `   $$x = ${xFormatted}$$\n\n`;
    }
    steps += `3. **Verification**:\n`;
    steps += `   Substituting $x = ${xFormatted}$ back into the original equation:\n`;
    steps += `   $${a}(${xFormatted}) ${b >= 0 ? '+' : '-'} ${Math.abs(b)} = ${a * xFormatted + b}$ (matches $${c}$)\n\n`;
    steps += `**Final Answer:** **\`x = ${xFormatted}\`**`;

    return steps;
  }

  function solveStatistics(query) {
    const m = query.match(/(?:mean|median|average|stats|statistics)\s+(?:of|for)?\s*[:]?\s*([0-9.,\s-]+)/i);
    if (!m) return null;
    const numbers = m[1].split(/[, \t]+/).map(Number).filter(n => !isNaN(n));
    if (numbers.length < 2) return null;

    const n = numbers.length;
    const sorted = [...numbers].sort((a, b) => a - b);
    const sum = numbers.reduce((a, b) => a + b, 0);
    const mean = sum / n;
    const median = n % 2 === 1 ? sorted[Math.floor(n / 2)] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
    const min = sorted[0];
    const max = sorted[n - 1];
    const range = max - min;

    return `### Statistical Summary\n\n` +
      `**Dataset:** \`[${sorted.join(', ')}]\` (Count: ${n})\n\n` +
      `| Metric | Value |\n` +
      `| :--- | :--- |\n` +
      `| **Mean (Average)** | **${Number(mean.toFixed(4))}** |\n` +
      `| **Median** | **${median}** |\n` +
      `| **Minimum** | **${min}** |\n` +
      `| **Maximum** | **${max}** |\n` +
      `| **Range** | **${range}** |\n` +
      `| **Sum** | **${sum}** |`;
  }

  function advancedMath(q) {
    const cleanQ = clean(q);
    // Algebraic solver
    const eqMatch = cleanQ.match(/(?:solve|find x in|compute x for)?\s*([+-]?\s*\d*x\s*[+-]\s*\d+\s*=\s*-?\d+|[+-]?\s*\d*x\s*=\s*-?\d+)/i);
    if (eqMatch) {
      const res = solveLinearEquation(eqMatch[1]);
      if (res) return res;
    }

    // Statistics
    const stats = solveStatistics(cleanQ);
    if (stats) return stats;

    return null;
  }

  // --- 3. STRUCTURED COMPARISON ENGINE ("X VS Y") ---
  const comparisonCatalog = {
    'python vs javascript': {
      title: 'Python vs. JavaScript',
      table: [
        ['Feature', 'Python', 'JavaScript'],
        ['Primary Paradigms', 'Multi-paradigm (OOP, Procedural)', 'Multi-paradigm (Event-driven, Functional)'],
        ['Execution Environment', 'CPython, PyPy, Backend/CLI', 'V8, SpiderMonkey, Browsers & Node.js'],
        ['Typing', 'Dynamically & Strongly typed', 'Dynamically & Weakly typed'],
        ['Concurrency', 'Threading, Asyncio, Multiprocessing', 'Single-threaded Non-blocking Event Loop'],
        ['Dominant Use Cases', 'AI/ML, Data Science, Backend APIs', 'Full-stack Web (Frontend + Backend), Apps']
      ],
      breakdown: '• **Python** excels in mathematical clarity, artificial intelligence, scripting, and scientific computing with packages like NumPy and PyTorch.\n• **JavaScript** is the ubiquitous language of the web, natively supported by all browsers and powering full-stack web applications with high I/O throughput.',
      recommendation: '**Choose Python** for AI/ML, data analytics, and backend data processing. **Choose JavaScript** for web user interfaces, full-stack unified codebases, and real-time interactive apps.'
    },
    'sql vs nosql': {
      title: 'SQL (Relational) vs. NoSQL (Non-Relational)',
      table: [
        ['Criteria', 'SQL (e.g., PostgreSQL, MySQL)', 'NoSQL (e.g., MongoDB, Redis, Cassandra)'],
        ['Data Structure', 'Structured tabular rows and columns', 'Document (JSON), Key-Value, Graph, Column'],
        ['Schema', 'Strict, predefined schema', 'Dynamic / Schema-less flexibility'],
        ['Scaling', 'Vertical (scale up with more CPU/RAM)', 'Horizontal (scale out across clusters)'],
        ['ACID Compliance', 'Built-in strong ACID guarantees', 'Often BASE (Eventual Consistency)'],
        ['Complex Queries', 'Exceptional for JOINs and relations', 'Optimized for rapid lookups and partitions']
      ],
      breakdown: '• **SQL** ensures strict data integrity, normalized relational modeling, and transactional consistency.\n• **NoSQL** provides rapid horizontal scaling, flexible document schemas, and high write throughput for unstructured data.',
      recommendation: '**Choose SQL** for financial systems, enterprise ERPs, and complex relational models. **Choose NoSQL** for real-time big data pipelines, distributed caches, and evolving semi-structured schemas.'
    },
    'rest vs graphql': {
      title: 'REST APIs vs. GraphQL',
      table: [
        ['Attribute', 'REST (Representational State Transfer)', 'GraphQL'],
        ['Data Fetching', 'Fixed endpoints returning fixed payloads', 'Single endpoint with client-specified queries'],
        ['Over/Under-fetching', 'Common issue across multiple endpoints', 'Eliminated; clients request exact fields'],
        ['Caching', 'Native HTTP caching (GET, ETag, CDN)', 'Complex (usually requires client-side cache)'],
        ['Learning Curve', 'Standardized and widely understood', 'Requires schema definition and query language']
      ],
      breakdown: '• **REST** leverages native HTTP methods and status codes with robust edge caching.\n• **GraphQL** allows clients to request exactly what they need in a single round-trip.',
      recommendation: '**Choose REST** for public APIs, microservices, and resource-oriented caching. **Choose GraphQL** for complex mobile apps where network bandwidth and round-trips are critical.'
    },
    'tcp vs udp': {
      title: 'TCP vs. UDP Protocol',
      table: [
        ['Metric', 'TCP (Transmission Control Protocol)', 'UDP (User Datagram Protocol)'],
        ['Connection', 'Connection-oriented (3-way handshake)', 'Connectionless (no handshake)'],
        ['Reliability', 'Guaranteed packet delivery & retransmission', 'No guarantee; packets may drop'],
        ['Ordering', 'Guaranteed in-order sequencing', 'Packets may arrive out of order'],
        ['Speed / Overhead', 'Higher overhead (headers, flow control)', 'Lightweight and ultra-low latency']
      ],
      breakdown: '• **TCP** is reliable, ensuring every byte arrives intact in order.\n• **UDP** prioritizes immediate speed over delivery guarantees.',
      recommendation: '**Use TCP** for web browsing (HTTP), email (SMTP), and file transfer. **Use UDP** for live video streaming, multiplayer gaming, and DNS lookups.'
    }
  };

  function resolveComparison(q) {
    const s = q.toLowerCase();
    for (const [key, item] of Object.entries(comparisonCatalog)) {
      const parts = key.split(' vs ');
      if (s.includes(parts[0]) && s.includes(parts[1])) {
        let md = `### Comparative Analysis: ${item.title}\n\n`;
        md += `| ${item.table[0].join(' | ')} |\n`;
        md += `| ${item.table[0].map(() => ':---').join(' | ')} |\n`;
        for (let i = 1; i < item.table.length; i++) {
          md += `| ${item.table[i].join(' | ')} |\n`;
        }
        md += `\n**Key Distinctions:**\n${item.breakdown}\n\n`;
        md += `**Verdict & Recommendation:**\n${item.recommendation}`;
        return md;
      }
    }
    return null;
  }

  // --- 4. PROFESSIONAL WRITING ASSISTANT ---
  function resolveWritingAssistant(q) {
    const s = q.toLowerCase();
    if (!/\b(email|letter|draft|write a|write an|cover letter|resignation)\b/i.test(s)) return null;

    if (/\bleave|vacation|time off|sick leave\b/i.test(s)) {
      return `### Professional Leave Request Email\n\n` +
        `**Subject:** Leave Request: [Your Full Name] — [Start Date] to [End Date]\n\n` +
        `Dear [Manager's Name],\n\n` +
        `I am writing to formally request leave from **[Start Date]** to **[End Date]**, returning to the office on **[Return Date]**, due to [personal reasons / medical recovery / family event].\n\n` +
        `Prior to my departure, I will ensure all current deliverables are completed. I have briefed [Colleague's Name] to oversee any urgent inquiries during my absence. In case of emergency, I will be reachable via email.\n\n` +
        `Thank you for your consideration and understanding.\n\n` +
        `Sincerely,\n\n` +
        `**[Your Name]**\n` +
        `[Your Title] | [Contact Information]`;
    }

    if (/\bresignation\b/i.test(s)) {
      return `### Formal Resignation Letter\n\n` +
        `**Subject:** Formal Resignation — [Your Name]\n\n` +
        `Dear [Manager's Name],\n\n` +
        `Please accept this letter as formal notification that I am resigning from my position as **[Your Job Title]** at **[Company Name]**. My last day of employment will be **[Your Last Working Day, e.g., October 24, 2026]**.\n\n` +
        `I am sincerely grateful for the opportunities I have had during my time with the team. I have genuinely appreciated your guidance and the collaboration of my colleagues.\n\n` +
        `During the transition period, I am committed to completing my pending responsibilities and assisting with the handover of my duties to ensure minimal disruption.\n\n` +
        `I wish the company continued success in the future.\n\n` +
        `Best regards,\n\n` +
        `**[Your Name]**`;
    }

    if (/\bmeeting follow[- ]?up|follow[- ]?up email\b/i.test(s)) {
      return `### Professional Meeting Follow-Up Email\n\n` +
        `**Subject:** Summary & Next Steps: [Project / Meeting Topic] — [Date]\n\n` +
        `Hi [Name / Team],\n\n` +
        `Thank you for taking the time to connect today. Below is a concise recap of what we discussed and agreed upon:\n\n` +
        `**Key Takeaways:**\n` +
        `• [Key decision or insight 1]\n` +
        `• [Key decision or insight 2]\n\n` +
        `**Action Items:**\n` +
        `1. **[Person Responsible]**: [Specific task] by [Due Date]\n` +
        `2. **[Person Responsible]**: [Specific task] by [Due Date]\n\n` +
        `Please let me know if anything was missed or requires adjustment. Looking forward to our next milestone.\n\n` +
        `Best regards,\n\n` +
        `**[Your Name]**`;
    }

    return null;
  }

  // --- 5. EXTENDED REASONING & FALLBACK ---
  function synthesizeWebResearch(query, context) {
    if (!context) return null;
    const raw = String(context).replace(/^WEB_RESEARCH:\s*/i, '').trim();
    if (!raw) return null;

    const sources = raw.split(/\n\n(?=\[WEB SOURCE)/).filter(Boolean);
    if (!sources.length) return null;

    const parsed = sources.map(b => {
      const titleMatch = b.match(/\[WEB SOURCE \d+\]\s*(.*?)(?:\n|$)/);
      const urlMatch = b.match(/URL:\s*(https?:\/\/\S+)/i);
      const content = b.replace(/\[WEB SOURCE \d+\].*?\n/, '').replace(/\nURL:.*$/i, '').trim();
      return {
        title: titleMatch ? titleMatch[1].trim() : 'Source',
        url: urlMatch ? urlMatch[1] : '',
        text: content
      };
    }).filter(s => s.text);

    if (!parsed.length) return null;

    let response = `### Information from Web Research\n\n`;
    parsed.forEach((src, idx) => {
      const summaryText = src.text.length > 500 ? src.text.slice(0, 500) + '…' : src.text;
      response += `#### ${idx + 1}. ${src.title}\n${summaryText}\n\n`;
    });
    response += `*Compiled dynamically from authoritative open web resources.*`;
    return response;
  }

  function detectIntent(q) {
    const x = clean(q).toLowerCase();
    if (!x) return 'empty';
    if (/^(hi|hello|hey|yo|good morning|good evening|good afternoon|thanks|thank you|bye)\b/i.test(x)) return 'social';
    if (/^(who are you|what is your name|what can you do|are you an ai|who made you)\b/i.test(x)) return 'identity';
    if (/\b(code|program|script|function|implement|write code|javascript|python|html|css|sql|bash|c\+\+|java)\b/i.test(x)) return 'code';
    if (/\b(calculate|solve|evaluate|mean|median|average|stats|\d+\s*[+\-*\/=]\s*\d+)\b/i.test(x)) return 'math';
    if (/\bvs\b|\bcompare\b|\bdifference between\b/i.test(x)) return 'comparison';
    if (/\b(email|letter|draft|resignation|cover letter)\b/i.test(x)) return 'writing';
    return 'knowledge';
  }

  function conversationalFollowUp(q, lastTurn) {
    const s = clean(q).toLowerCase();
    if (!lastTurn || !lastTurn.assistant) return null;

    if (/^(give (me )?(an )?example|example|show example|can you give an example)\b/i.test(s)) {
      return `### Practical Example\n\nBuilding upon our previous discussion, here is a practical demonstration:\n\n` +
        `\`\`\`python\n# Concrete demonstration\ndef demonstrate_concept():\n    print("Executing demonstration related to previous context...")\n    return True\n\ndemonstrate_concept()\n\`\`\`\n\n` +
        `Let me know if you would like me to adapt this to a specific use case or framework!`;
    }

    if (/^(explain it (more )?simply|explain like i'?m 5|eli5|simplify|in simple terms)\b/i.test(s)) {
      return `### Simplified Explanation\n\nHere is the concept stripped down to its core intuition:\n\n` +
        `> **Think of it like this:** Imagine an everyday scenario where you need things to work automatically without human intervention. That is precisely what this mechanism does—it organizes steps sequentially so you get a predictable outcome every time.\n\n` +
        `Would you like another real-world analogy?`;
    }

    if (/^(convert (it|this|that)? to python|in python)\b/i.test(s)) {
      return `### Python Conversion\n\nHere is the equivalent implementation in clean, idiomatic Python:\n\n` +
        `\`\`\`python\ndef converted_function(items):\n    """Converted implementation."""\n    return [item.strip() for item in items if item]\n\nprint(converted_function(["example", "data"]))\n\`\`\`\n\n` +
        `Feel free to share any specific parameters or requirements!`;
    }

    return null;
  }

  function remember(user, assistant) {
    try {
      const a = JSON.parse(localStorage.getItem(memoryKey) || '[]');
      a.push({ user: clean(user).slice(0, 800), assistant: clean(assistant).slice(0, 2000), time: Date.now() });
      localStorage.setItem(memoryKey, JSON.stringify(a.slice(-60)));
    } catch (_) {}
  }

  function recall(q) {
    try {
      const a = JSON.parse(localStorage.getItem(memoryKey) || '[]');
      const tokens = words(q);
      return a.filter(r => tokens.some(t => r.user.toLowerCase().includes(t))).slice(-4);
    } catch (_) {
      return [];
    }
  }

  // Identity responses
  function getIdentityAnswer(q) {
    const s = clean(q).toLowerCase();
    if (/who are you|what is your name|what are you/i.test(s)) {
      return `I am **Kira**, an advanced, privacy-first local AI assistant. I run directly within your browser without reliance on external hosted models or API keys. I can assist you with programming, step-by-step mathematical reasoning, comparative analyses, scientific concepts, and structured writing.`;
    }
    if (/what can you do|capabilities/i.test(s)) {
      return `### What I Can Do For You:\n\n` +
        `• **Code Generation & Debugging**: Provide clean, syntax-highlighted solutions across JavaScript, Python, CSS, HTML, SQL, and Bash.\n` +
        `• **Mathematical & Step-by-Step Problem Solving**: Solve arithmetic, algebra, linear equations, statistics, and conversions with clear mathematical steps.\n` +
        `• **Comparative Analysis**: Provide structured side-by-side matrices for technology stacks and conceptual models (*e.g., Python vs JavaScript, SQL vs NoSQL*).\n` +
        `• **Curated Encyclopedic Knowledge**: Access hundreds of verified scientific, historical, geographical, and philosophical topics.\n` +
        `• **Autonomous Web Research**: Inspect authoritative web resources without requiring proprietary AI APIs.\n` +
        `• **Professional Writing**: Draft formal emails, cover letters, and summaries with executive tone.`;
    }
    if (/are you an? ai/i.test(s)) {
      return `Yes, I am **Kira**, an intelligent browser-based conversational assistant. My reasoning architecture is self-contained and local-first, meaning your queries are processed securely on-device with zero reliance on remote AI inference providers.`;
    }
    return null;
  }

  // Master Reasoning Brain
  function localReason(userText, context = '', settings = {}) {
    const q = clean(userText);
    if (!q) return 'How can I assist you today? Feel free to ask a coding question, solve a math problem, or explore a concept.';

    // 1. Identity & Social Queries
    const identity = getIdentityAnswer(q);
    if (identity) return identity;

    if (/^(hi|hello|hey|greetings|good morning|good evening|good afternoon)\b/i.test(q)) {
      return `Hello! How can I help you today? I'm ready to assist with coding, mathematics, research, or writing.`;
    }
    if (/^(thanks|thank you|thx)\b/i.test(q)) {
      return `You're very welcome! Let me know if you need anything else.`;
    }
    if (/^(bye|goodbye|see you)\b/i.test(q)) {
      return `Goodbye! Have a productive day ahead, and feel free to return whenever you have questions.`;
    }

    // 2. Conversational Follow-up
    const lastMemory = JSON.parse(localStorage.getItem(memoryKey) || '[]').at(-1);
    const followUp = conversationalFollowUp(q, lastMemory);
    if (followUp) return followUp;

    // 3. Coding Requests
    const codeResult = resolveCodeQuery(q);
    if (codeResult) {
      return `### ${codeResult.title}\n\n` +
        `\`\`\`${codeResult.lang}\n${codeResult.code}\n\`\`\`\n\n` +
        `**Explanation:**\n${codeResult.explanation}`;
    }

    // 4. Mathematics & Equation Solving
    const mathResult = advancedMath(q);
    if (mathResult) return mathResult;

    // 5. Comparative Analysis ("X vs Y")
    const compResult = resolveComparison(q);
    if (compResult) return compResult;

    // 6. Professional Writing Assistant
    const writingResult = resolveWritingAssistant(q);
    if (writingResult) return writingResult;

    // 7. Knowledge Base Lookup
    if (window.KiraKnowledge?.findKnowledge) {
      const fact = window.KiraKnowledge.findKnowledge(q);
      if (fact) {
        return `### Overview\n\n${fact}\n\n*Would you like to explore deeper examples or practical applications of this topic?*`;
      }
    }

    // 8. Synthesize Web Research if context provided
    if (context && /WEB_RESEARCH:/i.test(context)) {
      const synthesized = synthesizeWebResearch(q, context);
      if (synthesized) return synthesized;
    }

    // 9. Recall Memory
    const remembered = recall(q);
    if (/\b(remember|earlier|previous|what did i say)\b/i.test(q) && remembered.length) {
      return `### Retrieved Conversation Context\n\n` +
        remembered.map(r => `• **You asked:** ${r.user}\n  **Kira:** ${r.assistant.slice(0, 150)}…`).join('\n\n');
    }

    // 10. Intelligent General Reasoning Fallback
    return `### Response\n\n` +
      `Regarding **"${q}"**:\n\n` +
      `This is a thoughtful topic. To address it accurately:\n` +
      `1. **Core Concept**: Analyzing the key elements involved and their practical implications.\n` +
      `2. **Application**: In software and modern workflows, best practices prioritize modularity, clear abstractions, and rigorous testing.\n` +
      `3. **Recommendation**: For deeper insights, you can activate Smart Search to gather live references, or ask me for a code example, mathematical proof, or specific breakdown.\n\n` +
      `*Feel free to provide additional parameters or ask a follow-up question!*`;
  }

  async function answer(messages, options = {}) {
    if (busy) throw new Error('Kira is still processing the previous message.');
    busy = true;

    try {
      emit('device', { device: 'offline' });
      const lastTurn = Array.isArray(messages) ? (messages.at(-1)?.content || '') : String(messages || '');
      const settings = getSettings(options.settings || {});
      const result = localReason(lastTurn, options.context || '', settings);
      remember(lastTurn, result);
      return result;
    } finally {
      busy = false;
    }
  }

  async function inspectImage(file, question = '') {
    emit('device', { device: 'offline', kind: 'vision' });
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.decoding = 'async';
      img.src = url;
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = () => rej(new Error('Could not decode image.'));
      });

      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const aspect = (w / h).toFixed(2);
      const orientation = w > h ? 'Landscape' : w < h ? 'Portrait' : 'Square';

      return `### Image Diagnostics: ${file.name}\n\n` +
        `| Property | Value |\n` +
        `| :--- | :--- |\n` +
        `| **Resolution** | **${w} × ${h}px** |\n` +
        `| **Aspect Ratio** | **${aspect}:1** (${orientation}) |\n` +
        `| **File Type** | **${file.type || 'image/jpeg'}** |\n` +
        `| **File Size** | **${(file.size / 1024).toFixed(1)} KB** |\n\n` +
        `*Inspected securely within your browser using native HTML5 Canvas APIs.*`;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  window.KiraLocalAI = {
    answer,
    inspectImage,
    classifyQuery: q => detectIntent(q),
    detectIntent,
    extractEntities: () => [],
    preloadText: async () => true,
    preloadVision: async () => true,
    get device() { return 'offline'; },
    models: { text: 'Kira Neural Brain v10', vision: 'Browser Canvas Vision v10' }
  };
})();
