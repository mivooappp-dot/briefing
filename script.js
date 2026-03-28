// ============================================================
// CONFIG — Preencha com seus dados do Supabase
// ============================================================
const SUPABASE_URL  = 'https://lkbcrzbczfpslcmtblpf.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrYmNyemJjemZwc2xjbXRibHBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MDc1MjksImV4cCI6MjA5MDI4MzUyOX0.cuw2QVxcDcZM0HOqqjSSv2m0RYyJS90pOxdBYrma7HU';
const TABLE_NAME    = 'briefings';
// ============================================================

const TOTAL       = 18; // index do slide de sucesso
let current       = 0;

const slides      = document.querySelectorAll('.slide');
const progressBar = document.getElementById('progress-bar');
const counter     = document.getElementById('counter');
const btnPrev     = document.getElementById('btn-prev');
const btnNext     = document.getElementById('btn-next');

// ── Atualiza UI conforme slide atual ──
function updateUI() {
  slides.forEach((s, i) => {
    s.classList.remove('active', 'exit-up');
    if (i === current) s.classList.add('active');
  });

  const pct = current === 0 ? 0 : Math.round((current / TOTAL) * 100);
  progressBar.style.width = pct + '%';

  if (current === 0 || current === TOTAL) {
    counter.textContent = '';
  } else {
    counter.textContent = current + ' / ' + (TOTAL - 1);
  }

  btnPrev.style.display = current > 1 && current < TOTAL ? 'inline-flex' : 'none';
  btnNext.style.display = current < TOTAL ? 'inline-flex' : 'none';

  if (current === TOTAL - 1) {
    btnNext.innerHTML = 'Enviar <span>✓</span>';
  } else if (current === 0) {
    btnNext.style.display = 'none';
  } else {
    btnNext.innerHTML = 'Próximo →';
  }
}

// ── Navega para um slide específico ──
function goTo(index, direction = 1) {
  if (index < 0 || index > TOTAL) return;

  const leaving = slides[current];
  const exitClass = direction > 0 ? 'exit-up' : 'exit-down';
  leaving.classList.add(exitClass);
  setTimeout(() => leaving.classList.remove('active', 'exit-up', 'exit-down'), 450);

  current = index;
  updateUI();

  setTimeout(() => {
    const inp = slides[current].querySelector(
      'input:not([type=radio]):not([type=checkbox]), textarea'
    );
    if (inp) inp.focus();
  }, 460);
}

// ── Próximo slide (ou enviar) ──
function next() {
  if (current === TOTAL - 1) {
    submitForm();
  } else {
    goTo(current + 1, 1);
  }
}

// ── Slide anterior ──
function prev() {
  goTo(current - 1, -1);
}

// ── Navegação via teclado ──
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    const active = document.activeElement;
    if (active && active.tagName === 'TEXTAREA') return;
    e.preventDefault();
    next();
  }
});

// ── Coleta todos os dados do formulário ──
function collect() {
  const get    = id   => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
  const radios = name => { const el = document.querySelector(`input[name="${name}"]:checked`); return el ? el.value : ''; };
  const checks = name => Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map(e => e.value);

  return {
    empresa:              get('empresa'),
    o_que_faz:            get('o_que_faz'),
    objetivos:            checks('objetivo').join(', '),
    objetivo_outro:       get('objetivo_outro'),
    acao_usuario:         get('acao_usuario'),
    cliente_ideal:        get('cliente_ideal'),
    problema:             get('problema'),
    produtos:             get('produtos'),
    produto_principal:    get('produto_principal'),
    tipo_site:            radios('tipo_site'),
    referencias:          get('referencias'),
    gosta_refs:           get('gosta_refs'),
    tem_logo:             radios('tem_logo'),
    cores_estilo:         get('cores_estilo'),
    tem_textos:           radios('tem_textos'),
    tem_imagens:          radios('tem_imagens'),
    funcionalidades:      checks('funcionalidades').join(', '),
    funcionalidade_outro: get('funcionalidade_outro'),
    observacoes:          get('observacoes'),
    enviado_em:           new Date().toISOString()
  };
}

// ── Envia para o Supabase ──
async function submitForm() {
  const data = collect();

  if (!data.empresa) {
    showToast('Preencha pelo menos o nome da empresa.', 'error');
    goTo(1);
    return;
  }

  btnNext.classList.add('loading');
  btnNext.innerHTML = '<span class="spinner"></span> Enviando...';

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE_NAME}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON,
        'Authorization': `Bearer ${SUPABASE_ANON}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Erro ao enviar');
    }

    btnNext.classList.remove('loading');
    goTo(TOTAL);

  } catch (err) {
    console.error(err);
    btnNext.classList.remove('loading');
    btnNext.innerHTML = 'Enviar ✓';
    showToast('Erro ao enviar. Verifique o Supabase ou tente novamente.', 'error');
  }
}

// ── Toast de notificação ──
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = type ? `show ${type}` : 'show';
  setTimeout(() => { t.className = ''; }, 3500);
}

// ── Init ──
updateUI();
