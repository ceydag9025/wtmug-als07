let currentStep = 0;
const TOTAL_STEPS = 10;
let testQuestions = [];
let userAnswers = [];
let targetShapeCircles = [];
let deferredPrompt = null;

const COLOR_PALETTES = {
  RED_GREEN: {
    bg: ['#8A9A5B', '#99B898', '#A8E6CF', '#556B2F', '#6E8B3D', '#778899'],
    fg: ['#E84A5F', '#FF847C', '#FECEAB', '#D9534F', '#C0392B', '#E74C3C']
  },
  BLUE_YELLOW: {
    bg: ['#5D9CEC', '#4A89DC', '#4FC1E9', '#3BAFDA', '#00A86B', '#2ECC71'],
    fg: ['#F6BB42', '#E6C875', '#FFCE54', '#FC6E51', '#E9573F', '#DA4453']
  },
  TOTAL: {
    bg: ['#7f8c8d', '#95a5a6', '#bdc3c7', '#6c7a89', '#abb7b7'],
    fg: ['#2c3e50', '#34495e', '#1a252f', '#415b76', '#52637a']
  }
};

document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) lucide.createIcons();
  initPWA();
  bindEvents();
});

function bindEvents() {
  document.getElementById('startBtn').addEventListener('click', startTest);
  document.getElementById('submitNumberBtn').addEventListener('click', () => submitNumberAnswer());
  document.getElementById('cantSeeBtn').addEventListener('click', () => submitNumberAnswer(true));
  document.getElementById('restartBtn').addEventListener('click', startTest);

  // Mobil klavyedeki "Enter / Git" tuşu desteği
  const numberInput = document.getElementById('numberInput');
  numberInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitNumberAnswer();
    }
  });

  const svgEl = document.getElementById('ishiharaSvg');
  svgEl.addEventListener('pointerdown', handleSvgInteraction);

  document.getElementById('devToolsToggle').addEventListener('click', () => {
    document.getElementById('devModal').classList.remove('hidden');
  });
  document.getElementById('closeDevModal').addEventListener('click', () => {
    document.getElementById('devModal').classList.add('hidden');
  });

  document.getElementById('downloadManifestBtn').addEventListener('click', downloadManifest);
  document.getElementById('downloadSwBtn').addEventListener('click', downloadSw);
  document.getElementById('downloadNoJekyllBtn').addEventListener('click', downloadNoJekyll);
}

function generateTestPlan() {
  const plan = [];
  const paletteKeys = ['RED_GREEN', 'RED_GREEN', 'BLUE_YELLOW', 'BLUE_YELLOW', 'TOTAL'];
  
  for (let i = 0; i < 5; i++) {
    const randomNum = Math.floor(Math.random() * 89) + 10; // 10 ile 99 arası net okunan iki basamaklı sayılar
    const paletteKey = paletteKeys[i % paletteKeys.length];
    plan.push({ type: 'NUMBER', targetValue: randomNum, paletteKey, palette: COLOR_PALETTES[paletteKey] });
  }

  const shapeTypes = ['circle', 'ring', 'triangle', 'square', 'star'];
  for (let i = 0; i < 5; i++) {
    const paletteKey = paletteKeys[(i + 2) % paletteKeys.length];
    plan.push({ type: 'TAP', shape: shapeTypes[i % shapeTypes.length], paletteKey, palette: COLOR_PALETTES[paletteKey] });
  }

  return plan.sort(() => Math.random() - 0.5);
}

function startTest() {
  currentStep = 0;
  userAnswers = [];
  testQuestions = generateTestPlan();

  document.getElementById('startScreen').classList.add('hidden');
  document.getElementById('resultScreen').classList.add('hidden');
  document.getElementById('testScreen').classList.remove('hidden');

  renderStep();
}

function renderStep() {
  const q = testQuestions[currentStep];
  
  document.getElementById('stepBadge').innerText = `Aşama ${currentStep + 1} / ${TOTAL_STEPS}`;
  document.getElementById('progressBar').style.width = `${((currentStep + 1) / TOTAL_STEPS) * 100}%`;
  
  let typeLabel = 'Kırmızı-Yeşil';
  if (q.paletteKey === 'BLUE_YELLOW') typeLabel = 'Mavi-Sarı';
  if (q.paletteKey === 'TOTAL') typeLabel = 'Tam Körlük';
  document.getElementById('testTypeBadge').innerText = typeLabel;

  renderIshiharaPlate(q);

  const numberArea = document.getElementById('numberInputArea');
  const tapArea = document.getElementById('tapInstructionArea');
  const numberInput = document.getElementById('numberInput');
  const instructionText = document.getElementById('instructionText');

  if (q.type === 'NUMBER') {
    numberArea.classList.remove('hidden');
    tapArea.classList.add('hidden');
    numberInput.value = '';
    numberInput.focus();
    instructionText.innerText = 'Görseldeki gizli iki basamaklı sayıyı yazın:';
  } else {
    numberArea.classList.add('hidden');
    tapArea.classList.remove('hidden');
    instructionText.innerText = 'Plakadaki farklı renkteki alana dokunun:';
  }
}

// Telefonda net okuma sağlayan optimize edilmiş Ishihara nokta yerleşimi
function renderIshiharaPlate(question) {
  const svg = document.getElementById('ishiharaSvg');
  svg.innerHTML = '';
  targetShapeCircles = [];

  const center = { x: 200, y: 200 };
  const radius = 175;
  const dots = [];
  const maxDots = 500; // Mobilde üst üste binmeyi ve karmaşayı önlemek için optimize edildi
  let attempts = 0;

  const baseBg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  baseBg.setAttribute('cx', '200');
  baseBg.setAttribute('cy', '200');
  baseBg.setAttribute('r', '190');
  baseBg.setAttribute('fill', '#ffffff');
  svg.appendChild(baseBg);

  while (dots.length < maxDots && attempts < 2500) {
    attempts++;
    const r = Math.random() * (12 - 5) + 5; // Daha belirgin nokta boyutları
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.sqrt(Math.random()) * (radius - r);
    
    const x = center.x + dist * Math.cos(angle);
    const y = center.y + dist * Math.sin(angle);

    let collision = false;
    for (const d of dots) {
      const dx = x - d.x;
      const dy = y - d.y;
      if (Math.sqrt(dx * dx + dy * dy) < (r + d.r + 2.5)) {
        collision = true;
        break;
      }
    }

    if (!collision) {
      const isTarget = isPointInPattern(x, y, question);
      dots.push({ x, y, r, isTarget });
    }
  }

  dots.forEach((d) => {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', d.x);
    circle.setAttribute('cy', d.y);
    circle.setAttribute('r', d.r);
    
    const palette = question.palette;
    const colorList = d.isTarget ? palette.fg : palette.bg;
    const color = colorList[Math.floor(Math.random() * colorList.length)];

    circle.setAttribute('fill', color);

    if (d.isTarget) {
      targetShapeCircles.push({ x: d.x, y: d.y, r: d.r });
    }

    svg.appendChild(circle);
  });
}

function isPointInPattern(x, y, question) {
  if (question.type === 'NUMBER') {
    return isPointInNumber(x, y, question.targetValue);
  } else {
    return isPointInShape(x, y, question.shape);
  }
}

// Telefonda net okuma için kalınlaştırılmış yazı maskesi
function isPointInNumber(x, y, number) {
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#000000';
  ctx.font = 'bold 150px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(number.toString(), 200, 205);

  const pixel = ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data;
  return pixel[3] > 128;
}

function isPointInShape(x, y, shape) {
  const dx = x - 200;
  const dy = y - 200;
  const dist = Math.sqrt(dx * dx + dy * dy);

  switch (shape) {
    case 'circle': return dist < 70;
    case 'ring': return dist > 45 && dist < 85;
    case 'square': return Math.abs(dx) < 60 && Math.abs(dy) < 60;
    case 'triangle': return dy > -60 && dy < 60 && Math.abs(dx) < (60 - dy / 2);
    case 'star': return dist < 70;
    default: return dist < 60;
  }
}

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

function handleSvgInteraction(e) {
  const q = testQuestions[currentStep];
  if (q.type !== 'TAP') return;

  const rect = e.currentTarget.getBoundingClientRect();
  const scale = 400 / rect.width;
  const tapX = (e.clientX - rect.left) * scale;
  const tapY = (e.clientY - rect.top) * scale;

  let hit = false;
  for (const circle of targetShapeCircles) {
    const dx = tapX - circle.x;
    const dy = tapY - circle.y;
    if (Math.sqrt(dx * dx + dy * dy) <= circle.r + 25) {
      hit = true;
      break;
    }
  }

  showFeedback(hit);
  recordAnswer(hit, hit ? 'Doğru Bölge' : 'Yanlış Bölge');
}

function showFeedback(isSuccess) {
  const overlay = document.getElementById('feedbackOverlay');
  overlay.innerText = isSuccess ? '✓ Algılandı' : '✕ Farklı Bölge';
  overlay.className = `absolute inset-0 rounded-full flex items-center justify-center font-bold text-lg text-white transition-opacity duration-200 ${isSuccess ? 'bg-emerald-600/60' : 'bg-rose-600/60'}`;
  overlay.style.opacity = '1';

  setTimeout(() => {
    overlay.style.opacity = '0';
  }, 400);
}

function recordAnswer(isCorrect, userVal) {
  const q = testQuestions[currentStep];
  userAnswers.push({
    step: currentStep + 1,
    type: q.type,
    paletteKey: q.paletteKey,
    isCorrect,
    userVal,
    targetVal: q.type === 'NUMBER' ? q.targetValue : q.shape
  });

  currentStep++;
  if (currentStep < TOTAL_STEPS) {
    renderStep();
  } else {
    finishTest();
  }
}

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

  document.getElementById('normalScore').innerText = `%${normalScore}`;
  document.getElementById('normalBar').style.width = `${normalScore}%`;

  document.getElementById('rgScore').innerText = `%${rgRisk}`;
  document.getElementById('rgBar').style.width = `${rgRisk}%`;

  document.getElementById('byScore').innerText = `%${byRisk}`;
  document.getElementById('byBar').style.width = `${byRisk}%`;

  document.getElementById('totalScore').innerText = `%${totalRisk}`;
  document.getElementById('totalBar').style.width = `${totalRisk}%`;

  const titleEl = document.getElementById('diagnosisTitle');
  const subEl = document.getElementById('diagnosisSubtitle');

  if (totalRisk === 0) {
    titleEl.innerText = 'Normal Renk Algısı';
    titleEl.className = 'text-2xl font-bold text-emerald-600';
    subEl.innerText = 'Test aşamalarının tamamı başarıyla geçildi.';
  } else if (rgRisk >= 50) {
    titleEl.innerText = 'Şüpheli Kırmızı-Yeşil Körlüğü (Protan/Deutan)';
    titleEl.className = 'text-2xl font-bold text-rose-600';
    subEl.innerText = 'Kırmızı ve yeşil renk tonlarında hata tespit edildi.';
  } else {
    titleEl.innerText = 'Şüpheli Mavi-Sarı Körlüğü (Tritan)';
    titleEl.className = 'text-2xl font-bold text-amber-600';
    subEl.innerText = 'Mavi ve sarı spektrumunda sapma tespit edildi.';
  }

  const breakdownList = document.getElementById('breakdownList');
  breakdownList.innerHTML = '';
  userAnswers.forEach(ans => {
    const item = document.createElement('div');
    item.className = `p-2 rounded-lg border flex justify-between items-center text-xs ${ans.isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'}`;
    item.innerHTML = `<span><b>Aşama ${ans.step}:</b> ${ans.type === 'NUMBER' ? 'Sayı ('+ans.targetVal+')' : 'Şekil'}</span><span class="font-bold">${ans.isCorrect ? '✓ Doğru' : '✕ Yanlış'}</span>`;
    breakdownList.appendChild(item);
  });
}

function initPWA() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    document.getElementById('installContainer').classList.remove('hidden');
  });
  document.getElementById('installBtn').addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt = null;
    }
  });
}

function downloadFile(content, fileName, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = fileName;
  a.click();
}

function downloadManifest() {
  downloadFile(JSON.stringify({
    "name": "Renk Körlüğü Testi", "short_name": "Renk Testi", "start_url": "./index.html",
    "display": "standalone", "background_color": "#ffffff", "theme_color": "#2563eb",
    "icons": [{"src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png"}]
  }, null, 2), 'manifest.json', 'application/json');
}

function downloadSw() {
  downloadFile("self.addEventListener('fetch', e => e.respondWith(fetch(e.request).catch(() => caches.match(e.request))));", 'sw.js', 'application/javascript');
}

function downloadNoJekyll() {
  downloadFile('', '.nojekyll', 'text/plain');
}