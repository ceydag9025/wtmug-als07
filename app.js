/**
 * RENK KÖRLÜĞÜ TESTİ - PWA JS ENGINE
 */

// Global State
let currentStep = 0;
const TOTAL_STEPS = 10;
let testQuestions = [];
let userAnswers = [];
let targetShapeCircles = [];
let deferredPrompt = null;

// Color Palette Generators for Dynamic Ishihara Plates
const COLOR_PALETTES = {
  // Protanopia / Deuteranopia (Red-Green)
  RED_GREEN: {
    bg: ['#8A9A5B', '#99B898', '#A8E6CF', '#556B2F', '#6E8B3D', '#778899'],
    fg: ['#E84A5F', '#FF847C', '#FECEAB', '#D9534F', '#C0392B', '#E74C3C']
  },
  // Tritanopia (Blue-Yellow)
  BLUE_YELLOW: {
    bg: ['#5D9CEC', '#4A89DC', '#4FC1E9', '#3BAFDA', '#00A86B', '#2ECC71'],
    fg: ['#F6BB42', '#E6C875', '#FFCE54', '#FC6E51', '#E9573F', '#DA4453']
  },
  // Achromatopsia / Monochromacy (Total Color Blindness Vector)
  TOTAL: {
    bg: ['#7f8c8d', '#95a5a6', '#bdc3c7', '#6c7a89', '#abb7b7'],
    fg: ['#2c3e50', '#34495e', '#1a252f', '#415b76', '#52637a']
  }
};

// Initialize Lucide Icons
document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) lucide.createIcons();
  initPWA();
  bindEvents();
});

// Bind UI Events
function bindEvents() {
  document.getElementById('startBtn').addEventListener('click', startTest);
  document.getElementById('submitNumberBtn').addEventListener('click', submitNumberAnswer);
  document.getElementById('cantSeeBtn').addEventListener('click', () => submitNumberAnswer(true));
  document.getElementById('restartBtn').addEventListener('click', startTest);

  // Keyboard Enter listener
  document.getElementById('numberInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') submitNumberAnswer();
  });

  // SVG Click/Tap event for shape detection
  document.getElementById('ishiharaSvg').addEventListener('click', handleSvgClick);

  // Dev Tools Modal
  document.getElementById('devToolsToggle').addEventListener('click', () => {
    document.getElementById('devModal').classList.remove('hidden');
  });
  document.getElementById('closeDevModal').addEventListener('click', () => {
    document.getElementById('devModal').classList.add('hidden');
  });

  // Dev Files Downloaders
  document.getElementById('downloadManifestBtn').addEventListener('click', downloadManifest);
  document.getElementById('downloadSwBtn').addEventListener('click', downloadSw);
  document.getElementById('downloadNoJekyllBtn').addEventListener('click', downloadNoJekyll);
}

// Generate 10-step Dynamic Test Plan
function generateTestPlan() {
  const plan = [];
  const paletteKeys = ['RED_GREEN', 'RED_GREEN', 'BLUE_YELLOW', 'BLUE_YELLOW', 'TOTAL'];
  
  // 5 Number Recognition Steps (1-99)
  for (let i = 0; i < 5; i++) {
    const randomNum = Math.floor(Math.random() * 99) + 1;
    const paletteKey = paletteKeys[i % paletteKeys.length];
    plan.push({
      type: 'NUMBER',
      targetValue: randomNum,
      paletteKey: paletteKey,
      palette: COLOR_PALETTES[paletteKey]
    });
  }

  // 5 Shape / Tap Steps
  const shapeTypes = ['circle', 'ring', 'triangle', 'square', 'star'];
  for (let i = 0; i < 5; i++) {
    const paletteKey = paletteKeys[(i + 2) % paletteKeys.length];
    plan.push({
      type: 'TAP',
      shape: shapeTypes[i % shapeTypes.length],
      paletteKey: paletteKey,
      palette: COLOR_PALETTES[paletteKey]
    });
  }

  // Shuffle array randomly
  return plan.sort(() => Math.random() - 0.5);
}

// Start Test
function startTest() {
  currentStep = 0;
  userAnswers = [];
  testQuestions = generateTestPlan();

  document.getElementById('startScreen').classList.add('hidden');
  document.getElementById('resultScreen').classList.add('hidden');
  document.getElementById('testScreen').classList.remove('hidden');

  renderStep();
}

// Render Current Step
function renderStep() {
  const q = testQuestions[currentStep];
  
  // Update Badges & Progress
  document.getElementById('stepBadge').innerText = `Aşama ${currentStep + 1} / ${TOTAL_STEPS}`;
  document.getElementById('progressBar').style.width = `${((currentStep + 1) / TOTAL_STEPS) * 100}%`;
  
  let typeLabel = 'Kırmızı-Yeşil';
  if (q.paletteKey === 'BLUE_YELLOW') typeLabel = 'Mavi-Sarı';
  if (q.paletteKey === 'TOTAL') typeLabel = 'Tam Körlük';
  document.getElementById('testTypeBadge').innerText = typeLabel;

  // Render SVG Plate
  renderIshiharaPlate(q);

  // Toggle Input Controls
  const numberArea = document.getElementById('numberInputArea');
  const tapArea = document.getElementById('tapInstructionArea');
  const numberInput = document.getElementById('numberInput');
  const instructionText = document.getElementById('instructionText');

  if (q.type === 'NUMBER') {
    numberArea.classList.remove('hidden');
    tapArea.classList.add('hidden');
    numberInput.value = '';
    numberInput.focus();
    instructionText.innerText = 'Görseldeki gizli sayıyı (1-99) yazın:';
  } else {
    numberArea.classList.add('hidden');
    tapArea.classList.remove('hidden');
    instructionText.innerText = 'Plakadaki farklı renkteki alana dokunun:';
  }
}

// Render Ishihara SVG Plate using Dynamic Dot Circle Packing Algorithm
function renderIshiharaPlate(question) {
  const svg = document.getElementById('ishiharaSvg');
  svg.innerHTML = '';
  targetShapeCircles = [];

  const width = 400;
  const height = 400;
  const center = { x: 200, y: 200 };
  const radius = 180;

  const dots = [];
  const maxDots = 650;
  let attempts = 0;

  // Background base circle
  const baseBg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  baseBg.setAttribute('cx', '200');
  baseBg.setAttribute('cy', '200');
  baseBg.setAttribute('r', '190');
  baseBg.setAttribute('fill', '#f8fafc');
  svg.appendChild(baseBg);

  while (dots.length < maxDots && attempts < 3500) {
    attempts++;
    const r = Math.random() * (11 - 4) + 4; // dot radius range
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.sqrt(Math.random()) * (radius - r);
    
    const x = center.x + dist * Math.cos(angle);
    const y = center.y + dist * Math.sin(angle);

    // Collision check
    let collision = false;
    for (const d of dots) {
      const dx = x - d.x;
      const dy = y - d.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < (r + d.r + 2)) {
        collision = true;
        break;
      }
    }

    if (!collision) {
      // Determine if point falls inside foreground shape/number pattern
      const isTarget = isPointInPattern(x, y, question);
      dots.push({ x, y, r, isTarget });
    }
  }

  // Draw Dots into SVG
  dots.forEach((d, idx) => {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', d.x);
    circle.setAttribute('cy', d.y);
    circle.setAttribute('r', d.r);
    
    const palette = question.palette;
    const colorList = d.isTarget ? palette.fg : palette.bg;
    const color = colorList[Math.floor(Math.random() * colorList.length)];

    circle.setAttribute('fill', color);
    circle.setAttribute('data-target', d.isTarget);
    circle.setAttribute('data-id', idx);

    if (d.isTarget) {
      targetShapeCircles.push({ x: d.x, y: d.y, r: d.r });
    }

    svg.appendChild(circle);
  });
}

// Geometric & Text Pattern Detection
function isPointInPattern(x, y, question) {
  if (question.type === 'NUMBER') {
    return isPointInNumber(x, y, question.targetValue);
  } else {
    return isPointInShape(x, y, question.shape);
  }
}

// Canvas-based precise number dot masking
function isPointInNumber(x, y, number) {
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#000000';
  ctx.font = 'bold 170px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(number.toString(), 200, 205);

  const pixel = ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data;
  return pixel[3] > 128;
}

// Geometric shape masking for tap steps
function isPointInShape(x, y, shape) {
  const dx = x - 200;
  const dy = y - 200;
  const dist = Math.sqrt(dx * dx + dy * dy);

  switch (shape) {
    case 'circle':
      return dist < 70;
    case 'ring':
      return dist > 45 && dist < 85;
    case 'square':
      return Math.abs(dx) < 60 && Math.abs(dy) < 60;
    case 'triangle':
      return dy > -60 && dy < 60 && Math.abs(dx) < (60 - dy / 2);
    case 'star':
      return dist < 70 && (Math.atan2(dy, dx) % (Math.PI / 2.5) > 0);
    default:
      return dist < 60;
  }
}

// Submit Answer for Number Type
function submitNumberAnswer(passedCantSee = false) {
  const q = testQuestions[currentStep];
  if (q.type !== 'NUMBER') return;

  const inputVal = document.getElementById('numberInput').value.trim();
  let isCorrect = false;

  if (!passedCantSee && inputVal !== '') {
    isCorrect = parseInt(inputVal, 10) === q.targetValue;
  }

  recordAnswer(isCorrect, passedCantSee ? 'Göremedi' : (inputVal || 'Boş'));
}

// Handle SVG Tap Click
function handleSvgClick(e) {
  const q = testQuestions[currentStep];
  if (q.type !== 'TAP') return;

  const rect = e.currentTarget.getBoundingClientRect();
  const scale = 400 / rect.width;
  const tapX = (e.clientX - rect.left) * scale;
  const tapY = (e.clientY - rect.top) * scale;

  // Check if tap hit target zone
  let hit = false;
  for (const circle of targetShapeCircles) {
    const dx = tapX - circle.x;
    const dy = tapY - circle.y;
    if (Math.sqrt(dx * dx + dy * dy) <= circle.r + 15) {
      hit = true;
      break;
    }
  }

  showFeedback(hit);
  recordAnswer(hit, hit ? 'Doğru Bölgeye Dokundu' : 'Yanlış Bölgeye Dokundu');
}

// Visual Feedback animation overlay
function showFeedback(isSuccess) {
  const overlay = document.getElementById('feedbackOverlay');
  overlay.innerText = isSuccess ? '✓ Algılandı' : '✕ Farklı Bölge';
  overlay.className = `absolute inset-0 rounded-full flex items-center justify-center font-bold text-lg text-white transition-opacity duration-200 ${isSuccess ? 'bg-emerald-600/60' : 'bg-rose-600/60'}`;
  overlay.style.opacity = '1';

  setTimeout(() => {
    overlay.style.opacity = '0';
  }, 400);
}

// Record step answer and advance flow
function recordAnswer(isCorrect, userVal) {
  const q = testQuestions[currentStep];
  userAnswers.push({
    step: currentStep + 1,
    type: q.type,
    paletteKey: q.paletteKey,
    isCorrect: isCorrect,
    userVal: userVal,
    targetVal: q.type === 'NUMBER' ? q.targetValue : q.shape
  });

  currentStep++;

  if (currentStep < TOTAL_STEPS) {
    renderStep();
  } else {
    finishTest();
  }
}

// Calculate Diagnosis and Display Results
function finishTest() {
  document.getElementById('testScreen').classList.add('hidden');
  document.getElementById('resultScreen').classList.remove('hidden');

  let rgErrors = 0, rgTotal = 0;
  let byErrors = 0, byTotal = 0;
  let totalErrors = 0;

  userAnswers.forEach(ans => {
    if (!ans.isCorrect) {
      totalErrors++;
      if (ans.paletteKey === 'RED_GREEN') rgErrors++;
      if (ans.paletteKey === 'BLUE_YELLOW') byErrors++;
    }
    if (ans.paletteKey === 'RED_GREEN') rgTotal++;
    if (ans.paletteKey === 'BLUE_YELLOW') byTotal++;
  });

  const rgRisk = rgTotal > 0 ? Math.round((rgErrors / rgTotal) * 100) : 0;
  const byRisk = byTotal > 0 ? Math.round((byErrors / byTotal) * 100) : 0;
  const totalRisk = Math.round((totalErrors / TOTAL_STEPS) * 100);
  const normalScore = Math.max(0, 100 - totalRisk);

  // Update Progress Bars & Percentages
  document.getElementById('normalScore').innerText = `%${normalScore}`;
  document.getElementById('normalBar').style.width = `${normalScore}%`;

  document.getElementById('rgScore').innerText = `%${rgRisk}`;
  document.getElementById('rgBar').style.width = `${rgRisk}%`;

  document.getElementById('byScore').innerText = `%${byRisk}`;
  document.getElementById('byBar').style.width = `${byRisk}%`;

  document.getElementById('totalScore').innerText = `%${totalRisk}`;
  document.getElementById('totalBar').style.width = `${totalRisk}%`;

  // Diagnosis Title logic
  const titleEl = document.getElementById('diagnosisTitle');
  const subEl = document.getElementById('diagnosisSubtitle');

  if (totalRisk === 0) {
    titleEl.innerText = 'Normal Renk Algısı';
    titleEl.className = 'text-2xl font-bold text-emerald-600';
    subEl.innerText = 'Test aşamalarının tamamı başarıyla geçildi.';
  } else if (rgRisk >= 50 && rgRisk >= byRisk) {
    titleEl.innerText = 'Şüpheli Kırmızı-Yeşil Körlüğü (Protan / Deutan)';
    titleEl.className = 'text-2xl font-bold text-rose-600';
    subEl.innerText = 'Kırmızı ve yeşil renk tonları aşamalarında belirgin hata tespit edildi.';
  } else if (byRisk >= 50) {
    titleEl.innerText = 'Şüpheli Mavi-Sarı Körlüğü (Tritanopia)';
    titleEl.className = 'text-2xl font-bold text-amber-600';
    subEl.innerText = 'Mavi ve sarı spektrumundaki aşamalarda sapma tespit edildi.';
  } else {
    titleEl.innerText = 'Kısmi Renk Görme Hassasiyeti / Karma Sapma';
    titleEl.className = 'text-2xl font-bold text-purple-600';
    subEl.innerText = 'Farklı renk paletlerinde kısmi hata oranları saptandı.';
  }

  // Populate Detailed Breakdown List
  const breakdownList = document.getElementById('breakdownList');
  breakdownList.innerHTML = '';
  userAnswers.forEach(ans => {
    const item = document.createElement('div');
    item.className = `p-2 rounded-lg border flex justify-between items-center ${ans.isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'}`;
    item.innerHTML = `
      <span><b>Aşama ${ans.step}:</b> ${ans.type === 'NUMBER' ? 'Sayı Tanıma' : 'Şekil Dokunma'} (${ans.paletteKey})</span>
      <span class="font-bold">${ans.isCorrect ? '✓ Doğru' : '✕ Yanlış (' + ans.userVal + ')'}</span>
    `;
    breakdownList.appendChild(item);
  });
}

// PWA Service Worker Registration & Install Banner
function initPWA() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then(() => console.log('Service Worker Registered'))
      .catch(err => console.log('SW Reg Error:', err));
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    document.getElementById('installContainer').classList.remove('hidden');
  });

  document.getElementById('installBtn').addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        document.getElementById('installContainer').classList.add('hidden');
      }
      deferredPrompt = null;
    }
  });
}

// Dev File Download Helpers
function downloadFile(content, fileName, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(a.href);
}

function downloadManifest() {
  const manifest = {
    "name": "Renk Körlüğü Testi",
    "short_name": "Renk Testi",
    "start_url": "./index.html",
    "display": "standalone",
    "background_color": "#ffffff",
    "theme_color": "#2563eb",
    "icons": [
      {
        "src": "icons/icon-192.png",
        "sizes": "192x192",
        "type": "image/png"
      },
      {
        "src": "icons/icon-512.png",
        "sizes": "512x512",
        "type": "image/png"
      }
    ]
  };
  downloadFile(JSON.stringify(manifest, null, 2), 'manifest.json', 'application/json');
}

function downloadSw() {
  const swContent = `
const CACHE_NAME = 'renk-testi-v1';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/lucide@latest'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request))
  );
});
  `.trim();
  downloadFile(swContent, 'sw.js', 'application/javascript');
}

function downloadNoJekyll() {
  downloadFile('', '.nojekyll', 'text/plain');
}