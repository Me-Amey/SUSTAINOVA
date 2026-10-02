const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

// AOS handles viewport-based section reveals.
AOS.init({
  duration: 850,
  easing: 'ease-out-cubic',
  once: true,
  offset: 70
});

// Compact mobile navigation.
const header = $('.site-header');
const menuButton = $('.menu-toggle');
menuButton?.addEventListener('click', () => {
  const open = header.classList.toggle('menu-open');
  menuButton.setAttribute('aria-expanded', String(open));
});
$$('.main-nav a').forEach(link => link.addEventListener('click', () => header.classList.remove('menu-open')));

const faqBot = $('.faq-bot');
const faqPanel = $('.faq-panel');
const faqClose = $('#faq-close');
const faqThread = $('#faq-thread');
const faqInput = $('#faq-input');
const faqSend = $('#faq-send');

function addFaqMessage(text, who = 'bot') {
  const bubble = document.createElement('div');
  bubble.className = `faq-bubble ${who}`;
  const tag = document.createElement('span');
  tag.className = 'bubble-tag';
  tag.textContent = who === 'user' ? 'You' : 'SmartFresh';
  const message = document.createElement('p');
  message.textContent = text;
  bubble.append(tag, message);
  faqThread?.appendChild(bubble);
  faqThread?.scrollTo({ top: faqThread.scrollHeight, behavior: 'smooth' });
}

function getFaqReply(value) {
  const answers = {
    freshness: 'Deep purple means fresh. Magenta or red usually means the milk may be changing or past its best window.',
    scan: 'Scan the QR code and point your camera at the indicator in natural light for a clearer reading.',
    eco: 'The concept is designed around lower-plastic, biodegradable directions to reduce dependence on persistent packaging.',
    default: 'SmartFresh is a guide for everyday confidence. It should complement cold storage, seals, and your own checks.'
  };

  const lower = value.toLowerCase();
  if (lower.includes('fresh') || lower.includes('colour') || lower.includes('purple')) return answers.freshness;
  if (lower.includes('scan') || lower.includes('qr') || lower.includes('camera')) return answers.scan;
  if (lower.includes('eco') || lower.includes('plastic') || lower.includes('biodegradable')) return answers.eco;
  return answers.default;
}

function handleFaqSubmit(customText) {
  const value = (customText ?? faqInput?.value ?? '').trim();
  if (!value) return;
  addFaqMessage(value, 'user');
  if (faqInput) faqInput.value = '';

  const reply = getFaqReply(value);
  window.setTimeout(() => addFaqMessage(reply, 'bot'), 240);
}

function toggleFaq(forceOpen) {
  const shouldOpen = typeof forceOpen === 'boolean' ? forceOpen : faqPanel.hidden;
  faqPanel.hidden = !shouldOpen;
  faqBot?.setAttribute('aria-expanded', String(shouldOpen));
  faqBot?.classList.toggle('is-open', shouldOpen);
}
faqBot?.addEventListener('click', () => toggleFaq(faqPanel.hidden));
faqClose?.addEventListener('click', () => toggleFaq(false));
faqSend?.addEventListener('click', () => handleFaqSubmit());
faqInput?.addEventListener('keydown', event => {
  if (event.key === 'Enter') handleFaqSubmit();
});
$$('.chip').forEach(chip => chip.addEventListener('click', () => {
  const value = chip.dataset.question || chip.textContent.trim();
  handleFaqSubmit(value);
}));
document.addEventListener('click', event => {
  if (!faqPanel || faqPanel.hidden) return;
  const clickedBot = faqBot?.contains(event.target);
  const clickedPanel = faqPanel.contains(event.target);
  if (!clickedBot && !clickedPanel) toggleFaq(false);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && faqPanel && !faqPanel.hidden) toggleFaq(false);
});

// Gentle 3D product tilt on desktop pointer movement.
const pack = $('[data-tilt]');
const stage = $('.hero-stage');
if (pack && stage && window.matchMedia('(min-width: 651px)').matches) {
  stage.addEventListener('pointermove', event => {
    const box = stage.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width - .5;
    const y = (event.clientY - box.top) / box.height - .5;
    pack.style.transform = `rotate(${5 + x * 5}deg) rotateX(${y * -3}deg) rotateY(${x * 4}deg)`;
  });
  stage.addEventListener('pointerleave', () => { pack.style.transform = 'rotate(5deg)'; });
}

// Let each workflow step follow the pointer with a restrained tilt.
const flowLine = $('.flow-line');
const flowSteps = $$('.flow-step');
if (flowLine && flowSteps.length && window.matchMedia('(min-width: 651px)').matches) {
  flowLine.addEventListener('pointermove', event => {
    flowSteps.forEach(step => {
      const box = step.getBoundingClientRect();
      const x = (event.clientX - (box.left + box.width / 2)) / (box.width / 2);
      const y = (event.clientY - (box.top + box.height / 2)) / (box.height / 2);
      const tiltX = Math.max(-3, Math.min(3, x * -3));
      const tiltY = Math.max(-3, Math.min(3, y * 3));
      step.style.setProperty('--flow-tilt-x', `${tiltX}deg`);
      step.style.setProperty('--flow-tilt-y', `${tiltY}deg`);
      step.classList.add('is-pointed');
    });
  });
  flowLine.addEventListener('pointerleave', () => {
    flowSteps.forEach(step => {
      step.classList.remove('is-pointed');
      step.style.removeProperty('--flow-tilt-x');
      step.style.removeProperty('--flow-tilt-y');
    });
  });
}

// Prototype colour interpretation.
const readings = {
  fresh: { title: 'Fresh', color: '#393b94', confidence: '96%', band: 'DEEP PURPLE', next: 'SAFE TO USE', text: 'The indicator is in the deep bluish-purple range. The pack is reading as fresh in this prototype calibration.' },
  changing: { title: 'Changing', color: '#b5179e', confidence: '82%', band: 'MAGENTA', next: 'CHECK SOON', text: 'The indicator is moving toward magenta. The milk is changing and should be checked soon.' },
  spoiled: { title: 'Spoiled', color: '#bd272e', confidence: '94%', band: 'DARK RED', next: 'DO NOT CONSUME', text: 'The indicator is in the dark-red range. This means the milk is spoiled or past its usable condition.' }
};
const resultDot = $('#resultDot');
const resultTitle = $('#resultTitle');
const resultText = $('#resultText');
const confidenceValue = $('#confidenceValue');
const confidenceBar = $('#confidenceBar');
const bandValue = $('#bandValue');
const nextValue = $('#nextValue');
const samples = $$('.sample');
function setReading(key, source = 'sample') {
  const reading = readings[key];
  if (!reading) return;
  resultDot.style.background = reading.color;
  resultDot.style.boxShadow = `0 0 0 7px ${reading.color}22`;
  resultTitle.textContent = reading.title;
  resultText.textContent = reading.text;
  confidenceValue.textContent = reading.confidence;
  confidenceBar.style.width = reading.confidence;
  if (bandValue) bandValue.textContent = reading.band;
  if (nextValue) nextValue.textContent = reading.next;
  if (source === 'sample') samples.forEach(button => button.classList.toggle('active', button.dataset.status === key));
}
samples.forEach(sample => sample.addEventListener('click', () => setReading(sample.dataset.status)));
setReading('fresh');

const indicatorStates = document.querySelectorAll('.point-state');
const indicatorTitle = document.getElementById('indicator-title');
const indicatorText = document.getElementById('indicator-text');

const indicatorMessages = {
  fresh: {
    title: 'Colour is the first conversation.',
    text: 'Deep purple is fresh — the milk is within its best quality window, properly cold, and ready to use.'
  },
  changing: {
    title: 'Colour is changing.',
    text: 'Magenta means the indicator is shifting as the milk starts to age, so it should be checked soon and used with care.'
  },
  spoiled: {
    title: 'Milk is spoiled.',
    text: 'Red is the clear sign that the milk has deteriorated significantly and should not be consumed.'
  }
};

indicatorStates.forEach(button => {
  button.addEventListener('click', () => {
    indicatorStates.forEach(item => item.classList.toggle('active', item === button));
    const state = button.dataset.state;
    const message = indicatorMessages[state];
    if (!message) return;

    indicatorTitle.style.opacity = '0';
    indicatorText.style.opacity = '0';
    indicatorTitle.style.transform = 'translateY(4px)';
    indicatorText.style.transform = 'translateY(4px)';

    window.setTimeout(() => {
      indicatorTitle.textContent = message.title;
      indicatorText.textContent = message.text;
      indicatorTitle.style.opacity = '1';
      indicatorText.style.opacity = '1';
      indicatorTitle.style.transform = 'translateY(0)';
      indicatorText.style.transform = 'translateY(0)';
    }, 120);
  });
});

// Allow visitors to sweep across the calibrated colors with a mouse or finger.
const sampleRow = $('.sample-row');
let isDraggingSample = false;
function updateSampleFromPoint(clientX, clientY) {
  const target = document.elementFromPoint(clientX, clientY)?.closest('.sample');
  if (!target || !sampleRow?.contains(target)) return;
  setReading(target.dataset.status);
  samples.forEach(sample => sample.classList.toggle('is-drag-target', sample === target));
}
function stopSampleDrag(event) {
  if (!isDraggingSample) return;
  isDraggingSample = false;
  sampleRow.classList.remove('is-dragging');
  samples.forEach(sample => sample.classList.remove('is-drag-target'));
  if (sampleRow.hasPointerCapture?.(event.pointerId)) sampleRow.releasePointerCapture(event.pointerId);
}
sampleRow?.addEventListener('pointerdown', event => {
  isDraggingSample = true;
  sampleRow.classList.add('is-dragging');
  sampleRow.setPointerCapture?.(event.pointerId);
  updateSampleFromPoint(event.clientX, event.clientY);
});
sampleRow?.addEventListener('pointermove', event => {
  if (isDraggingSample) updateSampleFromPoint(event.clientX, event.clientY);
});
sampleRow?.addEventListener('pointerup', stopSampleDrag);
sampleRow?.addEventListener('pointercancel', stopSampleDrag);
sampleRow?.addEventListener('lostpointercapture', () => {
  isDraggingSample = false;
  sampleRow.classList.remove('is-dragging');
  samples.forEach(sample => sample.classList.remove('is-drag-target'));
});

// Show the live values changing as the lab scans the indicator.
const scanDecoration = $('.scan-decoration');
const dropZoneReadout = $('#dropZone');
if (scanDecoration && dropZoneReadout) {
  const scanReadout = document.createElement('span');
  scanReadout.className = 'scan-readout';
  scanReadout.setAttribute('aria-hidden', 'true');
  dropZoneReadout.append(scanReadout);
  const scanValues = ['RGB 57 59 148', 'HUE 239°', 'BAND DEEP PURPLE', 'MATCH 96%'];
  let scanValueIndex = 0;
  function updateScanReadout() {
    scanReadout.textContent = scanValues[scanValueIndex];
    scanReadout.classList.remove('is-changing');
    requestAnimationFrame(() => scanReadout.classList.add('is-changing'));
    scanValueIndex = (scanValueIndex + 1) % scanValues.length;
  }
  updateScanReadout();
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.setInterval(updateScanReadout, 1400);
  }
}

// Upload preview: use average hue as a lightweight, transparent prototype classifier.
const imageInput = $('#imageInput');
const preview = $('#uploadedPreview');
const dropZone = $('#dropZone');
function classifyImage(file) {
  const url = URL.createObjectURL(file);
  preview.src = url;
  dropZone.classList.add('has-image');
  const image = new Image();
  image.onload = () => {
    const canvas = document.createElement('canvas');
    const size = 80; canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(image, 0, 0, size, size);
    const pixels = ctx.getImageData(0, 0, size, size).data;
    let r = 0, g = 0, b = 0, count = 0;
    for (let i = 0; i < pixels.length; i += 16) { r += pixels[i]; g += pixels[i + 1]; b += pixels[i + 2]; count++; }
    r /= count; g /= count; b /= count;
    // This deliberately simple rule mirrors the prototype's calibration categories.
    let key = 'changing';
    if (b > r * 1.16 && b > g * 1.05) key = 'fresh';
    else if (r > g * 1.16 && r > b * 1.08) key = 'spoiled';
    else key = 'changing';
    setReading(key, 'upload');
    samples.forEach(button => button.classList.remove('active'));
    URL.revokeObjectURL(url);
  };
  image.src = url;
}
imageInput?.addEventListener('change', () => { if (imageInput.files?.[0]) classifyImage(imageInput.files[0]); });
['dragenter', 'dragover'].forEach(type => dropZone?.addEventListener(type, e => { e.preventDefault(); dropZone.classList.add('dragover'); }));
['dragleave', 'drop'].forEach(type => dropZone?.addEventListener(type, e => { e.preventDefault(); dropZone.classList.remove('dragover'); }));
dropZone?.addEventListener('drop', e => { const file = e.dataTransfer.files?.[0]; if (file?.type.startsWith('image/')) classifyImage(file); });

// Demo batch / expiry verification.
const verifyButton = $('#verifyButton');
const verifyMessage = $('#verifyMessage');
verifyButton?.addEventListener('click', () => {
  const batch = $('#batchInput').value.trim();
  const expiry = $('#expiryInput').value;
  if (!batch || !expiry) { verifyMessage.textContent = 'Add a batch number and expiry date to continue.'; verifyMessage.style.color = '#f4c56e'; return; }
  const expiryDate = new Date(`${expiry}T23:59:59`);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  if (expiryDate < today) {
    verifyMessage.textContent = `Batch ${batch} is past its best-before date. Please do not consume.`;
    verifyMessage.style.color = '#f4c56e';
  } else {
    verifyMessage.textContent = `✓ ${batch} is connected. Best before ${expiryDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}.`;
    verifyMessage.style.color = '#d8e99a';
  }
});



// ── HERO FLOAT CARD 1: cycling freshness indicator ─────────────────────────
(function () {
  const card      = document.getElementById('heroIndicatorCard');
  const swatch    = document.getElementById('heroSwatch');
  const labelEl   = document.getElementById('heroIndicatorLabel');
  const subEl     = document.getElementById('heroIndicatorSub');

  if (!card || !swatch || !labelEl || !subEl) return;

  const states = [
    {
      label:    'Milk is fresh',
      sub:      'DEEP PURPLE / READY',
      bg:       'linear-gradient(135deg, #4b2d77, #2c2d88)',
      shadow:   'rgba(79, 60, 132, .22)',
    },
    {
      label:    'Check soon',
      sub:      'MAGENTA / CHANGING',
      bg:       'linear-gradient(135deg, #b5179e, #8b0d79)',
      shadow:   'rgba(181, 23, 158, .22)',
    },
    {
      label:    'Do not consume',
      sub:      'DARK RED / SPOILED',
      bg:       'linear-gradient(135deg, #bd272e, #8b1a1f)',
      shadow:   'rgba(189, 39, 46, .22)',
    },
  ];

  let idx = 0;

  function applyState(state, animate) {
    if (animate) {
      card.classList.add('is-transitioning');
    }

    const apply = () => {
      swatch.style.background  = state.bg;
      swatch.style.boxShadow   = `0 0 0 4px ${state.shadow}`;
      labelEl.textContent      = state.label;
      subEl.textContent        = state.sub;
      card.classList.remove('is-transitioning');
    };

    if (animate) {
      setTimeout(apply, 300);
    } else {
      apply();
    }
  }

  // Set initial state immediately
  applyState(states[0], false);

  setInterval(() => {
    idx = (idx + 1) % states.length;
    applyState(states[idx], true);
  }, 3000);
})();


// ── HERO FLOAT CARD 2: 0 → 90% progress bar ───────────────────────────────
(function () {
  const valueEl = document.getElementById('heroEcoValue');
  const barEl   = document.getElementById('heroEcoBar');

  if (!valueEl || !barEl) return;

  const TARGET    = 90;   // percentage to count up to
  const DURATION  = 2600; // ms to count from 0 → 90
  const PAUSE     = 400;  // ms to hold at 90 before resetting
  const STEP_MS   = 30;   // timer tick interval

  let current  = 0;
  let counting = true;

  const increment = TARGET / (DURATION / STEP_MS);

  function tick() {
    if (counting) {
      current = Math.min(current + increment, TARGET);
      const display = Math.round(current);
      valueEl.textContent = `−${display}%`;
      barEl.style.width   = `${display}%`;

      if (current >= TARGET) {
        counting = false;
        // Hold at 90 for PAUSE ms then reset
        setTimeout(() => {
          current  = 0;
          counting = true;
          valueEl.textContent = '−0%';
          barEl.style.width   = '0%';
        }, PAUSE + 3000); // full 3 s pause before next cycle
      }
    }
  }

  // Kick off after a short delay so it doesn't fire before the page settles
  setTimeout(() => {
    setInterval(tick, STEP_MS);
  }, 500);
})();


// ── ABOUT US stat counters: count up when scrolled into view ───────────────
(function () {
  const counters = document.querySelectorAll('.stat-counter');
  if (!counters.length) return;

  const DURATION = 1800; // ms

  function animateCounter(el) {
    const target   = parseFloat(el.dataset.target);
    const suffix   = el.dataset.suffix || '';
    const start    = performance.now();

    function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

    function step(now) {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / DURATION, 1);
      const value    = Math.round(easeOut(progress) * target);
      el.textContent = value + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  // Only trigger once when the stats block enters the viewport
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const counter = entry.target;
        animateCounter(counter);
        observer.unobserve(counter);
      }
    });
  }, { threshold: 0.4 });

  counters.forEach(c => observer.observe(c));
})();


// ── ABOUT US: word-by-word quote animation ─────────────────────────────────
(function () {
  const quote = document.querySelector('.story-quote-bare');
  if (!quote) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        quote.classList.add('is-visible');
        observer.unobserve(quote);
      }
    });
  }, { threshold: 0.35 });

  observer.observe(quote);
})();


// ── SOLUTION: pomegranate parallax on scroll ───────────────────────────────
(function () {
  const wrap    = document.querySelector('.solution-pom-wrap');
  const section = document.querySelector('.solution');
  if (!wrap || !section) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const rect     = section.getBoundingClientRect();
      const vh       = window.innerHeight;
      const progress = 1 - (rect.bottom / (vh + rect.height));
      const clamped  = Math.max(0, Math.min(1, progress));
      // Move up to 50px upward relative to scroll progress
      const shift    = clamped * -50;
      wrap.style.transform = `translateY(calc(-50% + ${shift}px))`;
      ticking = false;
    });
  }, { passive: true });
})();


// ── PROBLEM: biodegradable image parallax on scroll ────────────────────────
(function () {
  const wrap    = document.querySelector('.problem-bg-wrap');
  const anchor  = document.querySelector('.problem-text-wrap');
  if (!wrap || !anchor) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const rect     = anchor.getBoundingClientRect();
      const vh       = window.innerHeight;
      const progress = 1 - (rect.bottom / (vh + rect.height));
      const clamped  = Math.max(0, Math.min(1, progress));
      const shift    = clamped * -40;
      wrap.style.transform = `translate(-50%, calc(-50% + ${shift}px))`;
      ticking = false;
    });
  }, { passive: true });
})();


// ══════════════════════════════════════════════════════════════════
// FRESHNESS LAB — LIVE CAMERA MODE
// Mirrors the HSV logic from imagerecognition.py exactly:
//   Deep Purple : 120 ≤ H ≤ 155, S > 50,  V ≤ 100  → Fresh
//   Magenta     : 140 ≤ H ≤ 165, S > 100, V > 100  → Changing
//   Red         : (0–10 or 170–179), S > 100, V > 50 → Spoiled
// ══════════════════════════════════════════════════════════════════
(function () {

  // ── DOM refs ──────────────────────────────────────────────────
  const tabUpload     = document.getElementById('tabUpload');
  const tabCamera     = document.getElementById('tabCamera');
  const panelUpload   = document.getElementById('panelUpload');
  const panelCamera   = document.getElementById('panelCamera');
  const cameraZone    = document.getElementById('cameraZone');
  const cameraFeed    = document.getElementById('cameraFeed');
  const cameraCanvas  = document.getElementById('cameraCanvas');
  const cameraReadout = document.getElementById('cameraReadout');
  const camDot        = document.getElementById('camDot');
  const camLabel      = document.getElementById('camLabel');
  const startBtn      = document.getElementById('cameraStartBtn');
  const modePill      = document.getElementById('modePill');

  if (!tabUpload || !tabCamera) return;

  let stream       = null;
  let rafId        = null;
  let isScanning   = false;
  const BOX_SIZE   = 80; // px — matches Python's 40×40 scaled to typical video

  // ── Tab switching ─────────────────────────────────────────────
  function switchTab(tab) {
    const isCamera = tab === 'camera';

    tabUpload.classList.toggle('active', !isCamera);
    tabCamera.classList.toggle('active',  isCamera);
    tabUpload.setAttribute('aria-selected', String(!isCamera));
    tabCamera.setAttribute('aria-selected', String(isCamera));

    panelUpload.hidden =  isCamera;
    panelCamera.hidden = !isCamera;

    if (!isCamera) stopCamera();
  }

  tabUpload.addEventListener('click', () => switchTab('upload'));
  tabCamera.addEventListener('click', () => switchTab('camera'));

  // ── RGB → HSV (OpenCV convention: H 0–179, S 0–255, V 0–255) ─
  function rgbToHsvOpenCV(r, g, b) {
    const rn = r / 255, gn = g / 255, bn = b / 255;
    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    const diff = max - min;

    let h = 0, s = 0;
    const v = max;

    if (diff !== 0) {
      s = diff / max;
      if (max === rn)      h = ((gn - bn) / diff) % 6;
      else if (max === gn) h = (bn - rn) / diff + 2;
      else                 h = (rn - gn) / diff + 4;
      h = h * 60;
      if (h < 0) h += 360;
    }

    // Scale to OpenCV range: H→0–179, S→0–255, V→0–255
    return {
      h: h / 2,          // 0–179
      s: s * 255,        // 0–255
      v: v * 255         // 0–255
    };
  }

  // ── Classify HSV — exact port of Python recognize_colors() ────
  function classifyHSV(h, s, v) {
    // Red (hue wraps around 0 and 180)
    if (((h >= 0 && h <= 10) || (h >= 170 && h <= 179)) && s > 100 && v > 50) {
      return { key: 'spoiled', label: 'SPOILED — DARK RED', color: '#bd272e', dotColor: '#bd272e' };
    }
    // Magenta (bright purplish-pink, high hue, high brightness)
    if (h >= 140 && h <= 165 && s > 100 && v > 100) {
      return { key: 'changing', label: 'CHANGING — MAGENTA', color: '#b5179e', dotColor: '#b5179e' };
    }
    // Deep Purple (darker purple, lower brightness)
    if (h >= 120 && h <= 155 && s > 50 && v <= 100) {
      return { key: 'fresh', label: 'FRESH — DEEP PURPLE', color: '#393b94', dotColor: '#393b94' };
    }
    return { key: null, label: 'READING…', color: '#d8e99a', dotColor: '#d8e99a' };
  }

  // ── Sample the centre 80×80px box from the video frame ────────
  function sampleFrame() {
    if (!isScanning || cameraFeed.readyState < 2) return;

    const vw = cameraFeed.videoWidth;
    const vh = cameraFeed.videoHeight;
    if (!vw || !vh) return;

    const ctx = cameraCanvas.getContext('2d', { willReadFrequently: true });
    cameraCanvas.width  = vw;
    cameraCanvas.height = vh;
    ctx.drawImage(cameraFeed, 0, 0, vw, vh);

    const cx = Math.floor(vw / 2);
    const cy = Math.floor(vh / 2);
    const half = Math.floor(BOX_SIZE / 2);
    const pixels = ctx.getImageData(cx - half, cy - half, BOX_SIZE, BOX_SIZE).data;

    // Average R, G, B across all pixels in the box
    let rSum = 0, gSum = 0, bSum = 0;
    const count = pixels.length / 4;
    for (let i = 0; i < pixels.length; i += 4) {
      rSum += pixels[i];
      gSum += pixels[i + 1];
      bSum += pixels[i + 2];
    }
    const r = rSum / count;
    const g = gSum / count;
    const b = bSum / count;

    const { h, s, v } = rgbToHsvOpenCV(r, g, b);
    const result = classifyHSV(h, s, v);

    // Update readout bar
    camDot.style.background  = result.dotColor;
    camDot.style.boxShadow   = `0 0 0 4px ${result.dotColor}33`;
    camLabel.textContent      = `${result.label}  ·  H:${h.toFixed(0)} S:${s.toFixed(0)} V:${v.toFixed(0)}`;

    // Push result to the lab result panel if classified
    if (result.key) setReading(result.key, 'camera');

    rafId = requestAnimationFrame(sampleFrame);
  }

  // ── Start camera ──────────────────────────────────────────────
  async function startCamera() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      cameraFeed.srcObject = stream;
      await cameraFeed.play();

      isScanning = true;
      cameraZone.classList.add('is-scanning');
      startBtn.classList.add('hidden');
      modePill.classList.add('is-live');
      modePill.innerHTML = '<i></i> LIVE';
      camLabel.textContent = 'Align indicator in box…';

      rafId = requestAnimationFrame(sampleFrame);

    } catch (err) {
      camLabel.textContent = 'Camera access denied.';
      console.warn('Camera error:', err);
    }
  }

  // ── Stop camera ───────────────────────────────────────────────
  function stopCamera() {
    isScanning = false;
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
    cameraFeed.srcObject = null;
    cameraZone.classList.remove('is-scanning');
    startBtn.classList.remove('hidden');
    startBtn.textContent = 'Start Camera';
    modePill.classList.remove('is-live');
    modePill.innerHTML = '<i></i> READY';
    camLabel.textContent = 'Waiting for camera…';
    camDot.style.background = '#d8e99a';
    camDot.style.boxShadow  = '';
  }

  startBtn.addEventListener('click', () => {
    if (isScanning) stopCamera();
    else { startBtn.textContent = 'Starting…'; startCamera(); }
  });

  // Stop stream when user navigates away
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && isScanning) stopCamera();
  });

})();
