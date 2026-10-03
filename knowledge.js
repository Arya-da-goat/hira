/**
 * Kira Knowledge Source & Offline Encyclopedic Base
 * Provides a comprehensive, zero-network factual foundation across science,
 * computing, mathematics, history, geography, and philosophy.
 */
(() => {
  const DB = 'kira-local-knowledge-v10';
  let dbPromise;

  const open = () => {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise(resolve => {
      if (typeof indexedDB === 'undefined') return resolve(null);
      const r = indexedDB.open(DB, 1);
      r.onupgradeneeded = () => {
        if (!r.result.objectStoreNames.contains('facts')) {
          r.result.createObjectStore('facts');
        }
      };
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => resolve(null);
    });
    return dbPromise;
  };

  // Vast Encyclopedic Knowledge Repository
  const encyclopedicData = {
    // ---- COMPUTING & PROGRAMMING ----
    'algorithm': 'An **algorithm** is an unambiguous, finite sequence of well-defined computer-implementable instructions to solve a class of specific problems or perform a computation. Key characteristics include input, output, definiteness, finiteness, and effectiveness. Algorithmic efficiency is typically measured using Big O notation for time and space complexity.',
    'data structure': 'A **data structure** is a specialized format for organizing, processing, retrieving, and storing data in computer memory. Fundamental linear data structures include Arrays, Linked Lists, Stacks, and Queues. Non-linear structures include Trees (Binary Search Trees, Heaps, Tries) and Graphs.',
    'binary search': '**Binary Search** is an efficient divide-and-conquer algorithm for finding an element in a sorted list. It repeatedly divides the search interval in half. Its time complexity is **O(log n)**, compared to O(n) for linear search.',
    'quicksort': '**Quicksort** is an efficient, divide-and-conquer sorting algorithm. It selects a "pivot" element from the array and partitions the other elements into two sub-arrays according to whether they are less than or greater than the pivot, then recursively sorts the sub-arrays. Average time complexity is **O(n log n)**, with worst-case O(n²).',
    'mergesort': '**Merge Sort** is an efficient, comparison-based, divide-and-conquer sorting algorithm. It divides the array into halves, sorts each half recursively, and merges the sorted halves back together. Its time complexity is consistently **O(n log n)** in all cases, requiring O(n) auxiliary space.',
    'big o notation': '**Big O notation** is a mathematical notation used in computer science to describe the performance or complexity of an algorithm, specifically representing the worst-case scenario. Common complexities from fastest to slowest:\n• **O(1)**: Constant time\n• **O(log n)**: Logarithmic time (e.g., Binary Search)\n• **O(n)**: Linear time (e.g., Simple Search)\n• **O(n log n)**: Linearithmic time (e.g., Merge Sort, Quicksort)\n• **O(n²)**: Quadratic time (e.g., Nested loops, Bubble sort)\n• **O(2ⁿ)**: Exponential time (e.g., Recursive Fibonacci)\n• **O(n!)**: Factorial time (e.g., Traveling Salesperson brute force)',
    'javascript': '**JavaScript** is a high-level, dynamically typed, multi-paradigm programming language conforming to the ECMAScript specification. Features include first-class functions, prototype-based object orientation, and an event-driven, non-blocking asynchronous concurrency model powered by an event loop.',
    'python': '**Python** is an interpreted, high-level, general-purpose programming language designed with an emphasis on code readability and clean syntax (using significant indentation). Developed by Guido van Rossum in 1991, it supports multiple paradigms including procedural, object-oriented, and functional programming. Widely used in AI/ML, data science, backend web development, and automation.',
    'typescript': '**TypeScript** is a strongly typed superset of JavaScript developed by Microsoft that compiles to clean JavaScript. It adds static types, interfaces, generics, enums, and compile-time verification, drastically reducing runtime bugs in large-scale applications.',
    'react': '**React** is an open-source, component-based front-end JavaScript library maintained by Meta. It allows developers to build declarative user interfaces using JSX, state management, and a virtual DOM that efficiently calculates diffs and updates only the necessary nodes in the real browser DOM.',
    'css flexbox': '**CSS Flexbox** (Flexible Box Layout) is a one-dimensional layout model designed for distributing space along a single axis (either row or column). Key container properties: `display: flex`, `flex-direction`, `justify-content` (main axis), `align-items` (cross axis), `flex-wrap`, and `gap`. Key item properties: `flex-grow`, `flex-shrink`, and `flex-basis`.',
    'css grid': '**CSS Grid Layout** is a two-dimensional layout system for the web that handles both columns and rows simultaneously. Key properties include `grid-template-columns`, `grid-template-rows`, `grid-template-areas`, `gap`, `justify-items`, and `align-items`. It excels at complex page layouts and responsive matrices without float hacks.',
    'html': '**HTML** (HyperText Markup Language) is the standard markup language used to structure web pages and their content. Modern HTML5 features semantic tags (`<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, `<footer>`), native multimedia elements (`<audio>`, `<video>`, `<canvas>`), and browser APIs.',
    'css': '**CSS** (Cascading Style Sheets) describes how HTML elements should be rendered on screen, paper, or other media. It controls typography, colors, layouts, animations, transitions, and responsive styling through media queries.',
    'sql': '**SQL** (Structured Query Language) is the domain-specific language used for managing and querying data held in a relational database management system (RDBMS). Commands are categorized into DDL (Data Definition: CREATE, ALTER, DROP), DML (Data Manipulation: SELECT, INSERT, UPDATE, DELETE), and DCL (Data Control: GRANT, REVOKE).',
    'rest api': '**REST** (Representational State Transfer) is an architectural style for networked hypermedia applications. Key constraints include stateless communication, client-server separation, uniform interface (HTTP methods like GET, POST, PUT, DELETE), and cacheability. Data is typically transferred in JSON format.',
    'http vs https': '**HTTP vs HTTPS**:\n• **HTTP** (Hypertext Transfer Protocol) transmits data across port 80 in plain text, making it vulnerable to eavesdropping and man-in-the-middle attacks.\n• **HTTPS** (HTTP Secure) encrypts communication over port 443 using **TLS/SSL** (Transport Layer Security). It guarantees **encryption** (privacy), **integrity** (data cannot be tampered with), and **authentication** (verifies server identity with certificates).',
    'tcp vs udp': '**TCP vs UDP**:\n• **TCP** (Transmission Control Protocol) is connection-oriented, reliable, and ordered. It uses a 3-way handshake (SYN, SYN-ACK, ACK), guarantees packet delivery via acknowledgments, and performs flow/congestion control. Ideal for web pages, file transfers, and emails.\n• **UDP** (User Datagram Protocol) is connectionless, lightweight, and fast. It transmits datagrams without establishing a handshake or verifying delivery order. Ideal for real-time video streaming, VoIP, and gaming.',
    'git': '**Git** is a distributed version control system created by Linus Torvalds in 2005. Unlike centralized systems, every developer\'s working copy is a complete repository with full history and tracking capabilities. Core commands: `git init`, `git clone`, `git add`, `git commit`, `git branch`, `git merge`, `git rebase`, and `git push`.',
    'docker': '**Docker** is an open-source platform that uses OS-level virtualization to deliver software in standardized packages called **containers**. Containers bundle application code along with its dependencies, libraries, and runtime environment, ensuring identical behavior across development, staging, and production.',
    'object oriented programming': '**OOP** (Object-Oriented Programming) is a programming paradigm centered on four fundamental pillars:\n1. **Encapsulation**: Bundling data and methods operating on that data within a single class, restricting direct access via access modifiers.\n2. **Abstraction**: Hiding complex implementation details and exposing only essential interfaces.\n3. **Inheritance**: Enabling a child class to acquire properties and behaviors of a parent class.\n4. **Polymorphism**: The ability of different classes to respond to the same interface or method call in their own way.',
    'functional programming': '**Functional Programming** (FP) is a declarative paradigm where programs are constructed by applying and composing pure functions. Core concepts include **pure functions** (same input always produces same output with zero side effects), **immutability**, **first-class functions**, **higher-order functions** (`map`, `filter`, `reduce`), and **function composition**.',

    // ---- SCIENCE & PHYSICS ----
    'photosynthesis': '**Photosynthesis** is the biological process by which autotrophs (green plants, algae, cyanobacteria) convert light energy (usually from the Sun) into chemical energy stored in carbohydrate molecules (glucose).\n\n• **Chemical Equation**: `6 CO₂ + 6 H₂O + light energy → C₆H₁₂O₆ + 6 O₂`\n• **Stages**:\n  1. **Light-dependent reactions**: Occur in the thylakoid membranes of chloroplasts, splitting H₂O to generate ATP, NADPH, and releasing O₂.\n  2. **Light-independent reactions (Calvin Cycle)**: Occur in the stroma, using ATP and NADPH to fix CO₂ into glucose.',
    'gravity': '**Gravity** is a fundamental interaction which causes mutual attraction between all things with mass or energy.\n• In classical mechanics, Newton\'s law states: `F = G * (m₁ * m₂) / r²`.\n• In general relativity, Einstein described gravity not as a conventional force, but as the curvature of spacetime caused by mass and energy.',
    'theory of relativity': '**Relativity** comprises two groundbreaking theories by Albert Einstein:\n1. **Special Relativity (1905)**: Built on two postulates: the laws of physics are identical in all inertial reference frames, and the speed of light in vacuum (`c ≈ 299,792,458 m/s`) is constant for all observers. It introduced time dilation, length contraction, and mass-energy equivalence: **E = mc²**.\n2. **General Relativity (1915)**: The geometric theory of gravitation where mass and energy curve four-dimensional spacetime. Objects in free fall travel along geodesic paths in this curved spacetime.',
    'quantum mechanics': '**Quantum Mechanics** is the fundamental theory in physics that describes the behavior of matter and energy at the atomic and subatomic scales. Key principles include:\n• **Wave-Particle Duality**: Particles (like electrons and photons) exhibit both wave and particle characteristics (de Broglie hypothesis).\n• **Heisenberg Uncertainty Principle**: It is impossible to simultaneously know both the exact position and momentum of a particle (`Δx * Δp ≥ ℏ/2`).\n• **Quantum Superposition**: A quantum system remains in a combination of multiple states until measured (Schrödinger\'s cat thought experiment).\n• **Quantum Entanglement**: Particles can become entangled such that the state of one instantaneously determines the state of another regardless of distance.',
    'thermodynamics': '**The Laws of Thermodynamics** govern energy transfers:\n• **Zeroth Law**: If systems A and B are in thermal equilibrium with C, they are in thermal equilibrium with each other (defines temperature).\n• **First Law**: Energy cannot be created or destroyed, only transformed (Conservation of Energy: `ΔU = Q - W`).\n• **Second Law**: The total entropy (disorder) of an isolated system always increases over time (`ΔS ≥ 0`). Heat cannot spontaneously flow from colder to hotter bodies.\n• **Third Law**: As temperature approaches absolute zero (0 Kelvin / -273.15°C), the entropy of a pure crystalline substance approaches zero.',
    'newtons laws of motion': '**Newton\'s Three Laws of Motion**:\n1. **First Law (Inertia)**: An object remains at rest or in uniform motion in a straight line unless acted upon by a net external force.\n2. **Second Law (F = ma)**: The rate of change of momentum of an object is directly proportional to the applied force: `Force = mass × acceleration`.\n3. **Third Law (Action-Reaction)**: For every action, there is an equal and opposite reaction (`F_A = -F_B`).',
    'black hole': 'A **black hole** is a region of spacetime where gravity is so strong that nothing—no particles or electromagnetic radiation like light—can escape. The boundary beyond which no escape is possible is called the **event horizon**. The radius of a non-rotating black hole is given by the Schwarzschild radius: `r_s = 2GM / c²`. At the center lies a gravitational **singularity**, where spacetime curvature and density become infinite under classical relativity.',
    'speed of light': 'The speed of light in a vacuum is a universal physical constant denoted by **c**. Its exact value is **299,792,458 metres per second** (approximately 300,000 km/s or 186,282 miles/s). According to special relativity, it is the upper speed limit at which all conventional matter and information in the universe can travel.',
    'solar system': 'The **Solar System** consists of our central G-type star (the **Sun**) and all gravitationally bound astronomical objects. The 8 recognized planets in order of distance from the Sun:\n1. **Mercury** (smallest, terrestrial)\n2. **Venus** (hottest surface, thick CO₂ atmosphere)\n3. **Earth** (only known planet with liquid water and life)\n4. **Mars** (the Red Planet, iron oxide dust)\n5. **Jupiter** (largest planet, gas giant with Great Red Spot)\n6. **Saturn** (gas giant with prominent planetary rings)\n7. **Uranus** (ice giant, tilted 98° on its axis)\n8. **Neptune** (ice giant, outermost recognized planet, fastest winds)',
    'dna': '**DNA** (Deoxyribonucleic acid) is the molecule carrying genetic instructions for the development, functioning, growth, and reproduction of all known organisms. It forms a **double helix** structure discovered by Watson, Crick, Franklin, and Wilkins. Built from four nitrogenous bases:\n• **Adenine (A)** pairs with **Thymine (T)**\n• **Cytosine (C)** pairs with **Guanine (G)**',
    'cell': 'A **cell** is the basic structural, functional, and biological unit of all known organisms. Organisms are either **unicellular** or **multicellular**. Major classifications:\n• **Prokaryotes**: Lack a membrane-bound nucleus and organelles (bacteria, archaea).\n• **Eukaryotes**: Possess a true membrane-bound nucleus housing DNA, plus organelles like mitochondria (ATP production), endoplasmic reticulum, ribosomes (protein synthesis), and Golgi apparatus.',

    // ---- MATHEMATICS ----
    'pythagorean theorem': 'The **Pythagorean Theorem** states that in any right-angled triangle, the square of the length of the hypotenuse (`c`) is equal to the sum of the squares of the lengths of the other two sides (`a` and `b`):\n\n$$\na^2 + b^2 = c^2\n$$\n\nExample: If a triangle has sides 3 and 4, the hypotenuse is $\\sqrt{3^2 + 4^2} = \\sqrt{9 + 16} = \\sqrt{25} = 5$.',
    'quadratic formula': 'The **quadratic formula** solves any quadratic equation of the form $ax^2 + bx + c = 0$:\n\n$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$\n\nThe term **$\\Delta = b^2 - 4ac$** is the **discriminant**:\n• $\\Delta > 0$: Two distinct real solutions\n• $\\Delta = 0$: Exactly one real repeated solution\n• $\\Delta < 0$: Two complex conjugate solutions',
    'pi': '**Pi (π)** is the ratio of a circle\'s circumference to its diameter ($C = 2\\pi r$). It is an irrational and transcendental number, meaning its decimal representation never ends and never enters a repeating pattern. Approximate value: **3.1415926535...** (or $\\frac{22}{7}$ as a simple rational approximation).',
    'euler number': '**Euler\'s number (e)** is a mathematical constant approximately equal to **2.71828**. It is the base of the natural logarithm and represents the limit of $(1 + 1/n)^n$ as $n$ approaches infinity. It is ubiquitous in calculus, compound interest, probability, and radioactive decay.',
    'prime number': 'A **prime number** is a natural number greater than 1 that is not a product of two smaller natural numbers; it is divisible only by 1 and itself. The first ten primes are: **2, 3, 5, 7, 11, 13, 17, 19, 23, 29**. The number 2 is the only even prime number.',
    'fibonacci sequence': 'The **Fibonacci sequence** is a sequence of numbers in which each number is the sum of the two preceding ones: $F_0 = 0, F_1 = 1$, and $F_n = F_{n-1} + F_{n-2}$. Sequence begins: **0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144...** The ratio of consecutive Fibonacci numbers converges to the **Golden Ratio (φ ≈ 1.618033)**.',

    // ---- HISTORY & WORLD LEADERS ----
    'albert einstein': '**Albert Einstein** (1879–1955) was a German-born theoretical physicist widely acknowledged as one of the greatest and most influential physicists of all time. Best known for developing the theories of special and general relativity, he also made pivotal contributions to quantum mechanics. He received the 1921 Nobel Prize in Physics for his explanation of the photoelectric effect.',
    'isaac newton': 'Sir **Isaac Newton** (1642–1727) was an English polymath active as a mathematician, physicist, astronomer, and author. His landmark 1687 book *Philosophiæ Naturalis Principia Mathematica* laid the foundations of classical mechanics, formulated the laws of motion and universal gravitation, and independently co-invented infinitesimal calculus alongside Gottfried Wilhelm Leibniz.',
    'alan turing': '**Alan Turing** (1912–1954) was an English mathematician, computer scientist, logician, and cryptanalyst considered the father of modern theoretical computer science and artificial intelligence. He formulated the concept of the Turing machine, played a crucial role in cracking intercepted German ciphers (Enigma) at Bletchley Park during WWII, and designed the Turing Test.',
    'marie curie': '**Marie Curie** (1867–1934) was a Polish and naturalized-French physicist and chemist who conducted pioneering research on radioactivity. She was the first woman to win a Nobel Prize, the first person to win Nobel Prizes in two different scientific fields (Physics in 1903 and Chemistry in 1911), and discovered the chemical elements polonium and radium.',
    'nikola tesla': '**Nikola Tesla** (1856–1943) was a Serbian-American inventor, electrical engineer, mechanical engineer, and futurist best known for his contributions to the design of the modern alternating current (AC) electricity supply system, the induction motor, and wireless communications experiments.',
    'renaissance': 'The **Renaissance** was a fervent period of European cultural, artistic, political, and economic "rebirth" following the Middle Ages, spanning approximately the 14th to the 17th century. Originating in Florence, Italy, it was characterized by humanism, a revival of classical Greek and Roman learning, and master artists like Leonardo da Vinci, Michelangelo, and Raphael.',
    'industrial revolution': 'The **Industrial Revolution** was the transition to new manufacturing processes in Great Britain, continental Europe, and the United States from around 1760 to 1840. Marked by the transition from manual hand production to steam-powered machinery, factory systems, iron production, and chemical manufacturing, it fundamentally altered global demographics and modern economies.',
    'world war 1': '**World War I** (1914–1918) was a global conflict centered in Europe fought between the Allied Powers (France, Great Britain, Russia, Italy, and later the United States) and the Central Powers (Germany, Austria-Hungary, and the Ottoman Empire). Catalyzed by the assassination of Archduke Franz Ferdinand, it introduced industrialized trench warfare and ended with the Treaty of Versailles.',
    'world war 2': '**World War II** (1939–1945) was a global war that involved the vast majority of the world\'s countries, forming two opposing military alliances: the Allies and the Axis Powers. It was the deadliest conflict in human history, resulting in an estimated 70 to 85 million fatalities, the Holocaust, and the dawn of the nuclear era.',

    // ---- GEOGRAPHY & NATIONS ----
    'india': '**India** (Republic of India) is a country in South Asia. It is the most populous nation in the world and the 7th largest by land area.\n• **Capital**: New Delhi\n• **Financial Capital**: Mumbai\n• **Official Languages**: Hindi and English (along with 22 scheduled languages)\n• **Currency**: Indian Rupee (INR - ₹)\n• **Government**: Federal parliamentary constitutional democratic republic',
    'united states': '**The United States of America** (USA) is a federal republic primarily located in North America consisting of 50 states.\n• **Capital**: Washington, D.C.\n• **Largest City**: New York City\n• **Currency**: United States Dollar (USD - $)\n• **Government**: Federal presidential constitutional republic',
    'united kingdom': '**The United Kingdom** (UK) is an island country located off the northwestern coast of mainland Europe, comprising England, Scotland, Wales, and Northern Ireland.\n• **Capital**: London\n• **Currency**: British Pound Sterling (GBP - £)\n• **Government**: Unitary parliamentary constitutional monarchy',
    'france': '**France** is a country located primarily in Western Europe.\n• **Capital**: Paris\n• **Currency**: Euro (€)\n• **Official Language**: French\n• **Major Landmarks**: Eiffel Tower, Louvre Museum, Notre-Dame, Arc de Triomphe',
    'germany': '**Germany** is a federal parliamentary republic in Central Europe.\n• **Capital**: Berlin\n• **Currency**: Euro (€)\n• **Economy**: Largest national economy in Europe and 3rd/4th largest in the world',
    'japan': '**Japan** is an island country in East Asia located in the northwest Pacific Ocean.\n• **Capital**: Tokyo\n• **Currency**: Japanese Yen (JPY - ¥)\n• **Major Landmarks**: Mount Fuji, Kyoto historic temples, Shibuya Crossing',
    'china': '**China** (People\'s Republic of China) is a country in East Asia.\n• **Capital**: Beijing\n• **Largest City**: Shanghai\n• **Currency**: Renminbi / Yuan (CNY - ¥)',
    'brazil': '**Brazil** is the largest country in both South America and Latin America.\n• **Capital**: Brasília\n• **Largest City**: São Paulo\n• **Official Language**: Portuguese\n• **Landmarks**: Amazon Rainforest, Christ the Redeemer, Copacabana',
    'australia': '**Australia** is the world\'s largest island, smallest continent, and 6th largest country by total area.\n• **Capital**: Canberra\n• **Largest Cities**: Sydney, Melbourne\n• **Currency**: Australian Dollar (AUD - $)\n• **Landmarks**: Great Barrier Reef, Sydney Opera House, Uluru',
    'canada': '**Canada** is the second-largest country in the world by total area, located in North America.\n• **Capital**: Ottawa\n• **Largest City**: Toronto\n• **Official Languages**: English and French\n• **Currency**: Canadian Dollar (CAD - $)',
    'russia': '**Russia** is the largest country in the world by surface area, spanning Eastern Europe and Northern Asia.\n• **Capital**: Moscow\n• **Currency**: Russian Ruble (RUB - ₽)',

    // ---- PHILOSOPHY & CRITICAL THINKING ----
    'stoicism': '**Stoicism** is a school of Hellenistic philosophy founded by Zeno of Citium in Athens around 300 BC, practiced famously by Seneca, Epictetus, and Roman Emperor Marcus Aurelius. It asserts that virtue (wisdom, courage, justice, and temperance) is the only true good, and that peace of mind (*ataraxia*) is attained by distinguishing between what is within our control and what is not.',
    'existentialism': '**Existentialism** is a philosophical inquiry that explores the problem of human existence and centers on the experience of thinking, feeling, and acting. Championed by Jean-Paul Sartre, Friedrich Nietzsche, Albert Camus, and Søren Kierkegaard, its core tenet is that **"existence precedes essence"**—humans exist first, encounter themselves, and only then define their purpose through choices.',
    'socratic method': 'The **Socratic Method** is a form of cooperative argumentative dialogue between individuals based on asking and answering questions to stimulate critical thinking and to draw out underlying ideas and presuppositions. Named after classical Greek philosopher Socrates, it systematically probes hypotheses for contradictions.',
    'utilitarianism': '**Utilitarianism** is a normative ethical theory founded by Jeremy Bentham and John Stuart Mill which states that the most moral action is the one that produces the greatest amount of good or happiness for the greatest number of sentient beings ("the greatest happiness principle").',
    'first principles': '**First Principles thinking** (reasoning from first principles) is the act of boiling a problem down to the most fundamental, incontrovertible truths that cannot be deduced any further, and creating a reasoned solution upward from there, rather than reasoning by analogy or following conventional wisdom.'
  };

  // World Capitals Dictionary
  const worldCapitals = {
    'afghanistan': 'Kabul', 'albania': 'Tirana', 'algeria': 'Algiers', 'argentina': 'Buenos Aires',
    'armenia': 'Yerevan', 'australia': 'Canberra', 'austria': 'Vienna', 'azerbaijan': 'Baku',
    'bangladesh': 'Dhaka', 'belgium': 'Brussels', 'brazil': 'Brasília', 'canada': 'Ottawa',
    'chile': 'Santiago', 'china': 'Beijing', 'colombia': 'Bogotá', 'cuba': 'Havana',
    'denmark': 'Copenhagen', 'egypt': 'Cairo', 'finland': 'Helsinki', 'france': 'Paris',
    'germany': 'Berlin', 'greece': 'Athens', 'hungary': 'Budapest', 'iceland': 'Reykjavík',
    'india': 'New Delhi', 'indonesia': 'Jakarta', 'iran': 'Tehran', 'iraq': 'Baghdad',
    'ireland': 'Dublin', 'israel': 'Jerusalem', 'italy': 'Rome', 'japan': 'Tokyo',
    'kenya': 'Nairobi', 'malaysia': 'Kuala Lumpur', 'mexico': 'Mexico City', 'nepal': 'Kathmandu',
    'netherlands': 'Amsterdam', 'new zealand': 'Wellington', 'nigeria': 'Abuja', 'norway': 'Oslo',
    'pakistan': 'Islamabad', 'philippines': 'Manila', 'poland': 'Warsaw', 'portugal': 'Lisbon',
    'russia': 'Moscow', 'saudi arabia': 'Riyadh', 'singapore': 'Singapore', 'south africa': 'Pretoria',
    'south korea': 'Seoul', 'spain': 'Madrid', 'sri lanka': 'Sri Jayawardenepura Kotte (Colombo)',
    'sweden': 'Stockholm', 'switzerland': 'Bern', 'thailand': 'Bangkok', 'turkey': 'Ankara',
    'ukraine': 'Kyiv', 'united arab emirates': 'Abu Dhabi', 'united kingdom': 'London',
    'united states': 'Washington, D.C.', 'vietnam': 'Hanoi'
  };

  function findKnowledge(query) {
    const q = String(query || '').toLowerCase().trim();
    if (!q) return null;

    // Check capital of queries
    const capMatch = q.match(/capital(?:\s+city)?\s+of\s+([a-z\s]+?)(?:\?|$)/i);
    if (capMatch) {
      const country = capMatch[1].trim().toLowerCase();
      if (worldCapitals[country]) {
        return `The capital of **${country.charAt(0).toUpperCase() + country.slice(1)}** is **${worldCapitals[country]}**.`;
      }
    }

    // Direct key matches
    if (encyclopedicData[q]) {
      return encyclopedicData[q];
    }

    // Keyword relevance scoring
    let bestKey = null;
    let highestScore = 0;
    const tokens = q.split(/[^a-z0-9]+/).filter(w => w.length > 2);

    for (const [key, text] of Object.entries(encyclopedicData)) {
      let score = 0;
      if (q.includes(key)) score += 15;
      const keyWords = key.split(/[^a-z0-9]+/);
      for (const w of keyWords) {
        if (tokens.includes(w)) score += 4;
      }
      if (score > highestScore) {
        highestScore = score;
        bestKey = key;
      }
    }

    if (highestScore >= 7 && bestKey) {
      return encyclopedicData[bestKey];
    }

    return null;
  }

  async function rememberFact(key, value, source = 'user') {
    const db = await open();
    if (!db) return false;
    await new Promise(res => {
      const t = db.transaction('facts', 'readwrite').objectStore('facts').put({
        key: String(key),
        value: String(value),
        source,
        time: Date.now()
      }, String(key).toLowerCase());
      t.onsuccess = t.onerror = () => res();
    });
    return true;
  }

  async function recallFacts(query, limit = 8) {
    const db = await open();
    if (!db) return [];
    const q = String(query).toLowerCase();
    const out = [];
    await new Promise(res => {
      const r = db.transaction('facts', 'readonly').objectStore('facts').openCursor();
      r.onsuccess = () => {
        const c = r.result;
        if (!c) return res();
        const v = c.value;
        if ((v.key + ' ' + v.value).toLowerCase().includes(q)) out.push(v);
        c.continue();
      };
      r.onerror = () => res();
    });
    return out.slice(-limit);
  }

  async function clear() {
    const db = await open();
    if (!db) return;
    await new Promise(res => {
      const t = db.transaction('facts', 'readwrite').objectStore('facts').clear();
      t.onsuccess = t.onerror = () => res();
    });
  }

  async function diagnostics() {
    return {
      mode: 'offline-smart',
      aiApis: false,
      remoteAI: false,
      networkAI: false,
      database: 'IndexedDB + Curated Encyclopedic Base',
      topicsLoaded: Object.keys(encyclopedicData).length,
      version: 'v10'
    };
  }

  window.KiraKnowledge = {
    findKnowledge,
    worldCapitals,
    encyclopedicData,
    rememberFact,
    recallFacts,
    clear,
    diagnostics,
    stats: diagnostics,
    retrieve: async () => ({ context: '', sources: [], offline: true })
  };
})();
