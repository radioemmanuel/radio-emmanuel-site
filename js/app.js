let CONTENT = null;
let audio = null;

const $ = (id) => document.getElementById(id);

function safeText(el, value) {
  if (!el) return;
  el.textContent = value ?? '';
}

function safeHtml(el, value) {
  if (!el) return;
  el.innerHTML = value ?? '';
}

async function loadContent() {
  const res = await fetch('data/content.json', { cache: 'no-store' });
  if (!res.ok) throw new Error('No se pudo cargar data/content.json');
  return await res.json();
}

function renderSlider(slider) {
  const wrap = $('sliderWrapper');
  if (!wrap) return;
  wrap.innerHTML = '';

  (slider || []).forEach((s) => {
    const slide = document.createElement('div');
    slide.className = 'swiper-slide relative';
    slide.innerHTML = `
      <img src="${s.image}" alt="${s.title ?? ''}" />
      <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent"></div>
      <div class="absolute bottom-8 left-8 right-8">
        <p class="text-sky-400 text-[10px] font-black uppercase tracking-widest">${s.tag ?? ''}</p>
        <h3 class="text-white text-3xl font-extrabold italic leading-tight">${s.title ?? ''}</h3>
      </div>
    `;
    wrap.appendChild(slide);
  });
}

function renderSchedule(schedule) {
  const grid = $('scheduleGrid');
  if (!grid) return;
  grid.innerHTML = '';

  (schedule || []).forEach((p, idx) => {
    const card = document.createElement('div');
    card.id = `prog-${idx}`;
    card.className =
      'glass p-6 md:p-8 rounded-[2rem] border-l-4 border-transparent hover:bg-white/5 transition-colors group';
    card.dataset.highlightWhen = p.highlightWhen || '';
    card.innerHTML = `
      <span class="text-slate-500 font-bold text-[9px] uppercase tracking-widest">${p.days ?? ''}</span>
      <h4 class="text-lg md:text-xl font-bold mt-1 italic group-hover:text-sky-400">${p.title ?? ''}</h4>
      <p class="text-slate-500 text-xs mt-1 font-semibold italic">${p.detail ?? ''}</p>
    `;
    grid.appendChild(card);
  });
}

function highlightSchedule() {
  const day = new Date().getDay(); // 0 dom, 1 lun, ... 6 sab
  const isWeekday = day >= 1 && day <= 5;
  const isMonday = day === 1;

  document
    .querySelectorAll('[data-highlight-when], [data-highlightwhen]')
    .forEach((el) => {
      el.classList.remove('active-day');
    });

  document.querySelectorAll('[data-highlight-when]').forEach((card) => {
    const rule = (card.dataset.highlightWhen || '').toLowerCase();
    if (rule === 'weekday' && isWeekday) card.classList.add('active-day');
    if (rule === 'monday' && isMonday) card.classList.add('active-day');
  });
}

function initPlayer(streamUrl) {
  audio = new Audio(streamUrl);
  audio.preload = 'none';
  audio.volume = (Number($('volControl')?.value || 80) || 80) / 100;

  const mainPlayBtn = $('mainPlayBtn');
  const footerPlayBtn = $('footerPlayBtn');
  const volControl = $('volControl');

  function updateIcons(isPlaying) {
    const mIcon = mainPlayBtn?.querySelector('i');
    const fIcon = footerPlayBtn?.querySelector('i');

    if (mIcon)
      mIcon.className = isPlaying ? 'fas fa-pause' : 'fas fa-play ml-1';
    if (fIcon)
      fIcon.className = isPlaying
        ? 'fas fa-pause-circle'
        : 'fas fa-play-circle';

    if (mainPlayBtn) {
      if (isPlaying) mainPlayBtn.classList.remove('pulse-ring');
      else mainPlayBtn.classList.add('pulse-ring');
    }
  }

  async function togglePlay() {
    if (!audio) return;
    if (audio.paused) {
      try {
        await audio.play();
        updateIcons(true);
      } catch (e) {
        console.error(e);
        updateIcons(false);
      }
    } else {
      audio.pause();
      updateIcons(false);
    }
  }

  volControl &&
    (volControl.oninput = function () {
      if (!audio) return;
      audio.volume = this.value / 100;
      safeText($('volLabel'), this.value + '%');
    });

  mainPlayBtn?.addEventListener('click', togglePlay);
  footerPlayBtn?.addEventListener('click', togglePlay);

  audio.addEventListener('pause', () => updateIcons(false));
  audio.addEventListener('playing', () => updateIcons(true));
}

async function updateNowPlaying(apiUrl) {
  try {
    const response = await fetch(apiUrl, { cache: 'no-store' });
    const data = await response.json();

    safeText(
      $('trackTitle'),
      data?.now_playing?.song?.title || CONTENT?.brandName || 'Radio Emmanuel',
    );
    safeText(
      $('trackArtist'),
      data?.now_playing?.song?.artist || CONTENT?.location || 'Edinburg, Texas',
    );

    if (data?.live?.is_live) {
      safeText(
        $('liveIndicator'),
        `VIVO: ${data?.live?.streamer_name || 'En Vivo'}`,
      );
    } else {
      safeText($('liveIndicator'), 'EN VIVO AHORA');
    }
  } catch (e) {
    // Si no hay API aún, no rompemos nada
  }
}

function applyContent(c) {
  safeText($('brandName'), c.brandName);
  safeText($('brandTag'), c.brandTag);
  safeHtml($('heroTitle'), c.heroTitleHtml);
  safeText($('heroSubtitle'), c.heroSubtitle);

  const appBtn = $('appBtn');
  if (appBtn) appBtn.href = c.appButtonUrl || '#';

  renderSlider(c.slider);
  renderSchedule(c.schedule);

  const whats = $('whatsLink');
  if (whats) whats.href = `https://wa.me/${c.whatsappNumber || ''}`;

  safeHtml($('prayerTitle'), c.prayerTitleHtml);
  safeText($('prayerSubtitle'), c.prayerSubtitle);
  safeText($('prayerFormHint'), c.prayerFormHint);

  safeText($('footerLocation'), c.location);
  safeText($('trackArtist'), c.location);

  const fb = $('fbLink');
  const ig = $('igLink');
  if (fb) fb.href = c.facebookUrl || '#';
  if (ig) ig.href = c.instagramUrl || '#';

  safeText($('footerBrand'), (c.brandName || 'Radio Emmanuel').toUpperCase());
}

function initSwiper() {
  // Si no hay slider (ej. móvil), no pasa nada
  try {
    new Swiper('.mySwiper', {
      loop: true,
      autoplay: { delay: 4500, disableOnInteraction: false },
      effect: 'fade',
      fadeEffect: { crossFade: true },
      speed: 1200,
    });
  } catch (e) {}
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    CONTENT = await loadContent();
    applyContent(CONTENT);

    initSwiper();
    highlightSchedule();

    initPlayer(CONTENT.streamUrl);

    // Metadatos cada 15s si hay API
    if (CONTENT.apiUrl) {
      await updateNowPlaying(CONTENT.apiUrl);
      setInterval(() => updateNowPlaying(CONTENT.apiUrl), 15000);
    }

    // Evita submit real del form por ahora (no rompe)
    const form = $('prayerForm');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      alert(
        'Petición enviada (demo). Conéctalo a Formspree o backend cuando gustes.',
      );
    });
  } catch (err) {
    console.error(err);
  }
});
