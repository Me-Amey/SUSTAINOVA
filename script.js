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
    freshness: 'Deep purple means fresh. Pink or red usually means the milk may be changing or past its best window.',
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
  warning: { title: 'Warning', color: '#7e2c82', confidence: '82%', band: 'PINK PURPLE', next: 'CHECK SOON', text: 'The indicator is moving toward pinkish-purple. This is an early deterioration signal — keep chilled and check again soon.' },
  change: { title: 'Changing', color: '#c74778', confidence: '89%', band: 'BEETROOT PINK', next: 'USE WITH CARE', text: 'The indicator is in the beetroot-pink range. The pack is showing an intermediate deterioration category.' },
  spoiled: { title: 'Not fresh', color: '#bd272e', confidence: '94%', band: 'DARK RED', next: 'DO NOT CONSUME', text: 'The indicator is in the dark-red range. This prototype reading is classified as high deterioration — do not consume without further checks.' }
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
    let key = 'warning';
    if (b > r * 1.16 && b > g * 1.05) key = 'fresh';
    else if (r > b * 1.45 && r > g * 1.28) key = 'spoiled';
    else if (r > b * 1.08) key = 'change';
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

