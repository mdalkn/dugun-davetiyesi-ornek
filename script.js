/* ====== Lightweight interactions: countdown, reveal, RSVP ====== */
const targetDate = new Date('2026-07-04T19:00:00+03:00');
const whatsappPhoneNumber = '905055808758';

function typeWriter(element, text, speed = 90) {
  let index = 0;
  element.textContent = '';
  element.style.opacity = '1';

  function type() {
    if (index < text.length) {
      element.textContent += text.charAt(index);
      index++;
      setTimeout(type, speed);
    }
  }
  type();
}

const els = {
  days: document.getElementById('days'),
  hours: document.getElementById('hours'),
  minutes: document.getElementById('minutes'),
  seconds: document.getElementById('seconds'),
  message: document.getElementById('countdownMessage'),
  mapsButton: document.getElementById('mapsButton'),
  kinaMapsButton: document.getElementById('kinaMapsButton'),
  form: document.getElementById('rsvpForm'),
  toast: document.getElementById('toast'),
  whatsapp: document.getElementById('whatsappButton'),
  modal: document.getElementById('rsvpModal'),
  modalSummary: document.getElementById('modalSummary'),
  navToggle: document.querySelector('.nav-toggle'),
  nav: document.getElementById('primaryNav'),
  navBackdrop: document.getElementById('navBackdrop'),
  sheetsButton: document.getElementById('sheetsButton'),
};

function pad(v) { return String(v).padStart(2, '0'); }

function updateCountdown() {
  if (!els.days) return;
  const now = new Date();
  const diff = targetDate - now;
  if (diff <= 0) {
    els.message.textContent = 'Düğün günü geldi';
    ['days', 'hours', 'minutes', 'seconds'].forEach((k) => { els[k].textContent = '00'; });
    return;
  }
  const s = Math.floor(diff / 1000);
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  els.days.textContent = pad(days);
  els.hours.textContent = pad(hours);
  els.minutes.textContent = pad(mins);
  els.seconds.textContent = pad(secs);
}
updateCountdown();
setInterval(updateCountdown, 1000);

document.addEventListener('DOMContentLoaded', () => {
  const h1 = document.getElementById('typewriter');
  if (h1) {
    const originalText = h1.textContent;
    typeWriter(h1, originalText, 85);
  }
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.18 });
document.querySelectorAll('.reveal').forEach((node) => observer.observe(node));

const weddingAddressText = 'Sarıyer Garden\nMaden Mah. Boğazkent Cad. Sarıtoprak Sk. No:1\nSarıyer / İstanbul';
const kinaAddressText = 'Yanıklar Otel\nGölevi Mah. Devlet Sahil Yolu No: 358\nÜnye / Ordu';
if (els.mapsButton) {
  els.mapsButton.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(weddingAddressText)}`;
}
if (els.kinaMapsButton) {
  els.kinaMapsButton.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(kinaAddressText)}`;
}

function getFormData() {
  if (!els.form) return {};
  const fd = new FormData(els.form);
  return {
    fullName: (fd.get('fullName') || '').toString().trim(),
    phone: (fd.get('phone') || '').toString().trim(),
    guests: fd.get('guests') || '1',
    status: fd.get('status') || 'Geliyorum',
    note: (fd.get('note') || '').toString().trim(),
    createdAt: new Date().toISOString(),
  };
}

function saveEntry(entry) {
  const arr = JSON.parse(localStorage.getItem('rsvpEntries') || '[]');
  arr.push(entry);
  localStorage.setItem('rsvpEntries', JSON.stringify(arr));
}

async function sendToSheets() {
  if (!els.form || !els.sheetsButton) return;
  const endpoint = (els.form.dataset.sheetsEndpoint || '').trim();
  if (!endpoint || endpoint.includes('XXXX')) {
    showToast('Google Sheets bağlantısı tanımlı değil.');
    return;
  }

  const data = getFormData();
  if (!data.fullName) {
    const f = els.form.querySelector('input[name="fullName"]');
    if (f) f.focus();
    return;
  }

  const btn = els.sheetsButton;
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Gönderiliyor...';

  try {
    const body = new URLSearchParams(data).toString();
    const res = await fetch(endpoint, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body,
    });

    if (res.ok || res.type === 'opaque') {
      saveEntry(data);
      openModal(`${data.fullName} - ${data.status} - ${data.guests} kişi` + (data.note ? ` - Not: ${data.note}` : ''));
      showToast("Google Sheets'e gönderildi. Teşekkürler.");
      els.form.reset();
    } else {
      throw new Error('Sheet submit failed');
    }
  } catch (err) {
    showToast('Gönderim başarısız. Lütfen tekrar deneyin.');
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

function showToast(text) {
  if (!els.toast) return;
  els.toast.textContent = text;
  els.toast.classList.add('show');
  els.toast.setAttribute('aria-hidden', 'false');
  setTimeout(() => {
    els.toast.classList.remove('show');
    els.toast.setAttribute('aria-hidden', 'true');
  }, 3200);
}

function openModal(text) {
  if (!els.modal) return;
  els.modal.setAttribute('aria-hidden', 'false');
  if (els.modalSummary) els.modalSummary.textContent = text;
}

function closeModal() {
  if (!els.modal) return;
  els.modal.setAttribute('aria-hidden', 'true');
}

document.addEventListener('click', (e) => {
  if (e.target.matches('.modal-close') || e.target.matches('.modal-ok')) closeModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
    setNavOpen(false);
  }
});

if (els.form) {
  els.form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const data = getFormData();
    if (!data.fullName) {
      const f = els.form.querySelector('input[name="fullName"]');
      if (f) f.focus();
      return;
    }
    saveEntry(data);
    openModal(`${data.fullName} - ${data.status} - ${data.guests} kişi` + (data.note ? ` - Not: ${data.note}` : ''));
    showToast('Bilgiler kaydedildi. Teşekkürler.');
    els.form.reset();
  });
}

if (els.sheetsButton) {
  els.sheetsButton.addEventListener('click', (ev) => {
    ev.preventDefault();
    sendToSheets();
  });
}

if (els.whatsapp) {
  els.whatsapp.addEventListener('click', () => {
    const d = getFormData();
    const msg = `Nur Sena & Mert Kına ve Düğün Davetiyesi RSVP\n\nAd Soyad: ${d.fullName || '-'}\nTelefon: ${d.phone || '-'}\nKişi Sayısı: ${d.guests || '-'}\nKatılım: ${d.status || '-'}\nNot: ${d.note || '-'}`;
    const enc = encodeURIComponent(msg);
    const isMobile = /Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const url = isMobile
      ? `whatsapp://send?phone=${whatsappPhoneNumber}&text=${enc}`
      : `https://web.whatsapp.com/send?phone=${whatsappPhoneNumber}&text=${enc}`;
    window.open(url, '_blank', 'noreferrer');
  });
}

const statusSelect = document.querySelector('select[name="status"]');
const giftInfo = document.getElementById('giftInfo');
if (statusSelect && giftInfo) {
  statusSelect.addEventListener('change', (e) => {
    giftInfo.style.display = e.target.value === 'Gelemiyorum' ? 'block' : 'none';
  });
}

function setNavOpen(isOpen) {
  if (!els.nav || !els.navToggle || !els.navBackdrop) return;
  els.nav.classList.toggle('open', isOpen);
  els.navBackdrop.classList.toggle('show', isOpen);
  els.navToggle.setAttribute('aria-expanded', String(isOpen));
  document.body.classList.toggle('nav-open', isOpen);
}

if (els.navToggle && els.nav && els.navBackdrop) {
  els.navToggle.addEventListener('click', () => {
    const isOpen = els.nav.classList.contains('open');
    setNavOpen(!isOpen);
  });
  els.navBackdrop.addEventListener('click', () => setNavOpen(false));
  els.nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setNavOpen(false)));
  const navMedia = window.matchMedia('(min-width: 901px)');
  if (navMedia.addEventListener) {
    navMedia.addEventListener('change', (e) => { if (e.matches) setNavOpen(false); });
  }
}
