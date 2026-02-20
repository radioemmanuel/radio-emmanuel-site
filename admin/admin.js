let CONTENT = null;

const $ = (id) => document.getElementById(id);

async function fetchContent() {
  const res = await fetch('../data/content.json', { cache: 'no-store' });
  if (!res.ok) throw new Error('No se pudo leer ../data/content.json');
  return await res.json();
}

function setVal(id, v) {
  const el = $(id);
  if (!el) return;
  el.value = v ?? '';
}

function getVal(id) {
  const el = $(id);
  return el ? el.value : '';
}

function renderSliderEditor(slider) {
  const wrap = $('sliderEditor');
  wrap.innerHTML = '';

  (slider || []).forEach((s, i) => {
    const box = document.createElement('div');
    box.className =
      'bg-slate-900/60 border border-white/10 rounded-2xl p-3 space-y-2';
    box.innerHTML = `
      <div class="font-black">Slide ${i + 1}</div>
      <label class="text-xs text-slate-400">Tag</label>
      <input data-k="tag" data-i="${i}" class="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2" value="${s.tag ?? ''}" />
      <label class="text-xs text-slate-400">Título</label>
      <input data-k="title" data-i="${i}" class="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2" value="${s.title ?? ''}" />
      <label class="text-xs text-slate-400">Imagen (ruta)</label>
      <input data-k="image" data-i="${i}" class="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2" value="${s.image ?? ''}" />
    `;
    wrap.appendChild(box);
  });
}

function renderScheduleEditor(schedule) {
  const wrap = $('scheduleEditor');
  wrap.innerHTML = '';

  (schedule || []).forEach((p, i) => {
    const box = document.createElement('div');
    box.className =
      'bg-slate-900/60 border border-white/10 rounded-2xl p-3 space-y-2';
    box.innerHTML = `
      <div class="font-black">Card ${i + 1}</div>
      <label class="text-xs text-slate-400">Días</label>
      <input data-s="days" data-i="${i}" class="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2" value="${p.days ?? ''}" />
      <label class="text-xs text-slate-400">Título</label>
      <input data-s="title" data-i="${i}" class="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2" value="${p.title ?? ''}" />
      <label class="text-xs text-slate-400">Detalle</label>
      <input data-s="detail" data-i="${i}" class="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2" value="${p.detail ?? ''}" />
      <label class="text-xs text-slate-400">highlightWhen</label>
      <input data-s="highlightWhen" data-i="${i}" class="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2" value="${p.highlightWhen ?? ''}" />
    `;
    wrap.appendChild(box);
  });
}

function fillForm(c) {
  setVal('brandName', c.brandName);
  setVal('brandTag', c.brandTag);
  setVal('appButtonUrl', c.appButtonUrl);

  setVal('streamUrl', c.streamUrl);
  setVal('apiUrl', c.apiUrl);

  setVal('heroTitleHtml', c.heroTitleHtml);
  setVal('heroSubtitle', c.heroSubtitle);

  setVal('whatsappNumber', c.whatsappNumber);
  setVal('prayerTitleHtml', c.prayerTitleHtml);
  setVal('prayerSubtitle', c.prayerSubtitle);
  setVal('prayerFormHint', c.prayerFormHint);

  setVal('location', c.location);
  setVal('facebookUrl', c.facebookUrl);
  setVal('instagramUrl', c.instagramUrl);

  renderSliderEditor(c.slider);
  renderScheduleEditor(c.schedule);
}

function readForm() {
  const c = structuredClone(CONTENT);

  c.brandName = getVal('brandName');
  c.brandTag = getVal('brandTag');
  c.appButtonUrl = getVal('appButtonUrl');

  c.streamUrl = getVal('streamUrl');
  c.apiUrl = getVal('apiUrl');

  c.heroTitleHtml = getVal('heroTitleHtml');
  c.heroSubtitle = getVal('heroSubtitle');

  c.whatsappNumber = getVal('whatsappNumber');
  c.prayerTitleHtml = getVal('prayerTitleHtml');
  c.prayerSubtitle = getVal('prayerSubtitle');
  c.prayerFormHint = getVal('prayerFormHint');

  c.location = getVal('location');
  c.facebookUrl = getVal('facebookUrl');
  c.instagramUrl = getVal('instagramUrl');

  // Slider inputs
  document.querySelectorAll('#sliderEditor input[data-k]').forEach((inp) => {
    const i = Number(inp.dataset.i);
    const k = inp.dataset.k;
    c.slider[i][k] = inp.value;
  });

  // Schedule inputs
  document.querySelectorAll('#scheduleEditor input[data-s]').forEach((inp) => {
    const i = Number(inp.dataset.i);
    const k = inp.dataset.s;
    c.schedule[i][k] = inp.value;
  });

  return c;
}

function downloadJson(obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], {
    type: 'application/json',
  });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'content.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(a.href);
}

async function main() {
  $('status').textContent =
    'Listo. Presiona "Cargar" para traer el content.json actual.';

  $('loadBtn').addEventListener('click', async () => {
    try {
      CONTENT = await fetchContent();
      fillForm(CONTENT);
      $('status').textContent = 'Cargado ✅ Ahora edita y descarga.';
    } catch (e) {
      $('status').textContent = 'Error: ' + e.message;
    }
  });

  $('downloadBtn').addEventListener('click', () => {
    if (!CONTENT) {
      $('status').textContent = 'Primero carga el content.json actual.';
      return;
    }
    const updated = readForm();
    downloadJson(updated);
    $('status').textContent =
      'Descargado ✅ Súbelo a /data/content.json en tu hosting.';
  });
}

main();
