/* =====================================================================
   FINANCIAL ADVISOR · script.js
   Todo el comportamiento de la landing. Cada módulo corre aislado
   (si uno falla, los demás siguen) y ningún contenido depende del JS
   para verse: las animaciones solo mejoran lo que ya está en pantalla.
   ===================================================================== */
(() => {
  'use strict';

  /* ---------------------------------------------------------------
     CONFIGURACIÓN — edita solo estas constantes
     --------------------------------------------------------------- */
  // Número de WhatsApp del negocio: 10 dígitos, sin +52 ni espacios (ej. "3312345678").
  // Vacío = el botón flotante y el envío del formulario se ocultan con elegancia.
  const WHATSAPP_NUMERO = '';
  // true: muestra el toro y el oso en la sección Mercados. false: versión sin ellos.
  const MOSTRAR_TORO_OSO = true;

  /* ---------------------------------------------------------------
     Utilidades
     --------------------------------------------------------------- */
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const root = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fino = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => 1 - Math.pow(1 - t, 3);
  const easeIO = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  const dig = String(WHATSAPP_NUMERO || '').replace(/\D/g, '');
  const WA = dig.length === 10 ? '52' + dig : (dig.length === 12 && dig.indexOf('52') === 0 ? dig : '');
  const hayWA = WA !== '';
  const urlWA = texto => 'https://wa.me/' + WA + '?text=' + encodeURIComponent(texto);

  function enlazarWA(a) {
    if (!hayWA || !a || !a.dataset.wa) return;
    a.href = urlWA(a.dataset.wa);
    a.target = '_blank';
    a.rel = 'noopener';
  }

  const safe = fn => {
    try { fn(); } catch (e) { if (window.console) console.warn('[FINANCIAL ADVISOR]', fn.name, e); }
  };

  /* ---------------------------------------------------------------
     Estado compartido del scroll
     --------------------------------------------------------------- */
  let revelarVisibles = () => {};
  let lits = [];
  let steps = [];
  let navLinks = [];

  /* ---------------------------------------------------------------
     Banderas globales (WhatsApp, toro y oso, año)
     --------------------------------------------------------------- */
  function banderas() {
    if (!hayWA) root.classList.add('sin-wa');
    if (!MOSTRAR_TORO_OSO) root.classList.add('sin-mascotas');
    const y = $('#anio');
    if (y) y.textContent = new Date().getFullYear();
  }

  function whatsapp() {
    const fl = $('#waFloat');
    if (hayWA && fl) {
      fl.hidden = false;
      fl.href = urlWA('Hola, quiero mi diagnóstico financiero para mi empresa.');
    }
    $$('[data-wa]').forEach(enlazarWA);

    // Al pulsar un CTA de servicio, el formulario recuerda qué interesa.
    const sel = $('#f-servicio');
    document.addEventListener('click', e => {
      const a = e.target && e.target.closest ? e.target.closest('[data-servicio]') : null;
      if (a && sel) sel.value = a.dataset.servicio;
    });
  }

  /* ---------------------------------------------------------------
     Cargador: desaparece solo (≤ 2.2 s). El CSS tiene su propio respaldo.
     --------------------------------------------------------------- */
  function cargador() {
    const el = $('#loader');
    if (!el) return;
    const bar = $('#loaderBar');
    const pct = $('#loaderPct');
    const DUR = 1700;
    const t0 = performance.now();
    let listo = false;
    const fin = () => {
      if (listo) return;
      listo = true;
      el.classList.add('is-done');
      setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 1200);
    };
    (function tick(now) {
      const p = clamp((now - t0) / DUR);
      const e = ease(p);
      if (bar) bar.style.transform = 'scaleX(' + e.toFixed(3) + ')';
      if (pct) pct.textContent = Math.round(e * 100);
      if (p < 1 && !listo) requestAnimationFrame(tick); else fin();
    })(t0);
    setTimeout(fin, 2200);
  }

  /* ---------------------------------------------------------------
     Encabezado y menú móvil
     --------------------------------------------------------------- */
  function cabecera() {
    const burger = $('#burger');
    const nav = $('#nav');
    if (!burger || !nav) return;
    const set = abierto => {
      root.classList.toggle('menu-open', abierto);
      burger.setAttribute('aria-expanded', abierto ? 'true' : 'false');
      burger.setAttribute('aria-label', abierto ? 'Cerrar menú' : 'Abrir menú');
    };
    burger.addEventListener('click', () => set(!root.classList.contains('menu-open')));
    $$('a', nav).forEach(a => a.addEventListener('click', () => set(false)));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
    const mq = window.matchMedia('(min-width: 1024px)');
    const alCambiar = e => { if (e.matches) set(false); };
    if (mq.addEventListener) mq.addEventListener('change', alCambiar);
    navLinks = $$('a[href^="#"]:not(.btn)', nav);
  }

  /* ---------------------------------------------------------------
     Revelado al hacer scroll + respaldo por geometría
     --------------------------------------------------------------- */
  function contar(el) {
    const to = parseInt(el.dataset.to, 10);
    if (isNaN(to)) return;
    if (reduce) { el.textContent = to; return; }
    const t0 = performance.now();
    const d = 1400;
    (function f(now) {
      const p = clamp((now - t0) / d);
      el.textContent = Math.round(to * ease(p));
      if (p < 1) requestAnimationFrame(f);
    })(t0);
  }

  function revelados() {
    const els = $$('[data-reveal]');
    $$('[data-stagger]').forEach(p => {
      Array.from(p.children).filter(c => c.hasAttribute('data-reveal')).forEach((c, i) => {
        c.style.setProperty('--d', (i * 0.09).toFixed(2) + 's');
      });
    });
    const mostrar = el => {
      if (el.classList.contains('is-in')) return;
      el.classList.add('is-in');
      $$('.count', el).forEach(contar);
    };
    // Respaldo: revela todo lo que ya esté dentro (o por encima) de la ventana.
    revelarVisibles = () => {
      const vh = window.innerHeight;
      els.forEach(el => {
        if (el.classList.contains('is-in')) return;
        const r = el.getBoundingClientRect();
        if (r.top < vh * 0.92) mostrar(el);
      });
    };
    if (!('IntersectionObserver' in window) || reduce) { els.forEach(mostrar); return; }
    const io = new IntersectionObserver(es => {
      es.forEach(e => {
        if (e.isIntersecting) { mostrar(e.target); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach(el => io.observe(el));
  }

  /* ---------------------------------------------------------------
     Texto que se enciende palabra por palabra con el scroll
     --------------------------------------------------------------- */
  function palabrasLit() {
    lits = $$('[data-lit]');
    lits.forEach(el => {
      const walk = node => {
        Array.from(node.childNodes).forEach(ch => {
          if (ch.nodeType === 3) {
            const frag = document.createDocumentFragment();
            ch.textContent.split(/(\s+)/).forEach(tok => {
              if (!tok) return;
              if (/^\s+$/.test(tok)) {
                frag.appendChild(document.createTextNode(' '));
              } else {
                const s = document.createElement('span');
                s.className = 'w';
                s.textContent = tok;
                frag.appendChild(s);
              }
            });
            ch.replaceWith(frag);
          } else if (ch.nodeType === 1) {
            walk(ch);
          }
        });
      };
      walk(el);
      el._w = $$('.w', el);
    });
  }

  function actualizarLit(vh) {
    lits.forEach(el => {
      const ws = el._w || [];
      if (!ws.length) return;
      const r = el.getBoundingClientRect();
      const p = r.bottom < 0 ? 1 : clamp((vh * 0.88 - r.top) / (vh * 0.5 + r.height * 0.5));
      const n = Math.round(p * ws.length);
      ws.forEach((w, i) => w.classList.toggle('on', i < n));
    });
  }

  /* ---------------------------------------------------------------
     HERO · velas de mercado + red de nodos (siempre en movimiento)
     --------------------------------------------------------------- */
  function lienzoHero() {
    const c = $('#lienzo');
    const hero = $('.hero');
    if (!c || !c.getContext || !hero) return;
    const ctx = c.getContext('2d');
    const STEP = 15;
    let W = 0, H = 0, dpr = 1, nodes = [], candles = [], off = 0, vivo = false, raf = 0;
    const mouse = { x: -9999, y: -9999 };
    const rnd = (a, b) => a + Math.random() * (b - a);
    const yOf = p => H * (0.97 - p * 0.58);
    const vela = prev => {
      const close = clamp(prev + (Math.random() - 0.465) * 0.085 + (0.5 - prev) * 0.03, 0.12, 0.9);
      return { o: prev, c: close, h: Math.max(prev, close) + rnd(0.004, 0.04), l: Math.min(prev, close) - rnd(0.004, 0.04) };
    };

    function tamano() {
      const r = c.getBoundingClientRect();
      W = Math.max(1, r.width);
      H = Math.max(1, r.height);
      dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      c.width = Math.round(W * dpr);
      c.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const nN = clamp(Math.floor((W * H) / 20000), 22, 64);
      nodes = Array.from({ length: nN }, () => ({ x: rnd(0, W), y: rnd(0, H), vx: rnd(-0.18, 0.18), vy: rnd(-0.14, 0.14), r: rnd(1, 2.2) }));
      const nC = Math.ceil(W / STEP) + 3;
      candles = [];
      let p = 0.45;
      for (let i = 0; i < nC; i++) { const k = vela(p); candles.push(k); p = k.c; }
    }

    function dibuja(mover) {
      ctx.clearRect(0, 0, W, H);
      if (mover) {
        off += 0.38;
        if (off >= STEP) { off -= STEP; candles.shift(); candles.push(vela(candles[candles.length - 1].c)); }
      }
      // Velas
      ctx.lineWidth = 1;
      candles.forEach((k, i) => {
        const x = i * STEP - off + STEP / 2;
        const up = k.c >= k.o;
        ctx.strokeStyle = up ? 'rgba(39,211,245,.32)' : 'rgba(216,174,91,.3)';
        ctx.fillStyle = up ? 'rgba(39,211,245,.15)' : 'rgba(216,174,91,.14)';
        ctx.beginPath(); ctx.moveTo(x, yOf(k.h)); ctx.lineTo(x, yOf(k.l)); ctx.stroke();
        const y1 = yOf(Math.max(k.o, k.c));
        const y2 = yOf(Math.min(k.o, k.c));
        ctx.fillRect(x - 3.5, y1, 7, Math.max(2, y2 - y1));
      });
      // Línea de cierre con brillo + área
      const g = ctx.createLinearGradient(0, 0, W, 0);
      g.addColorStop(0, 'rgba(47,107,255,0)');
      g.addColorStop(0.35, 'rgba(91,141,255,.8)');
      g.addColorStop(0.8, 'rgba(39,211,245,.95)');
      g.addColorStop(1, 'rgba(235,203,134,1)');
      ctx.beginPath();
      let ultimoX = 0;
      candles.forEach((k, i) => {
        const x = i * STEP - off + STEP / 2;
        const y = yOf(k.c);
        if (i === 0) { ctx.moveTo(x, y); } else {
          const px = (i - 1) * STEP - off + STEP / 2;
          const py = yOf(candles[i - 1].c);
          ctx.quadraticCurveTo(px, py, (px + x) / 2, (py + y) / 2);
        }
        ultimoX = x;
      });
      ctx.strokeStyle = g;
      ctx.lineWidth = 2;
      ctx.shadowColor = 'rgba(39,211,245,.7)';
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.lineTo(ultimoX, H);
      ctx.lineTo(0, H);
      ctx.closePath();
      const ga = ctx.createLinearGradient(0, H * 0.35, 0, H);
      ga.addColorStop(0, 'rgba(39,211,245,.10)');
      ga.addColorStop(1, 'rgba(39,211,245,0)');
      ctx.fillStyle = ga;
      ctx.fill();
      // Red de nodos
      ctx.lineWidth = 1;
      ctx.fillStyle = 'rgba(160,195,255,.7)';
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        if (mover) {
          a.x += a.vx; a.y += a.vy;
          if (a.x < 0 || a.x > W) a.vx *= -1;
          if (a.y < 0 || a.y > H) a.vy *= -1;
        }
        ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, 6.2832); ctx.fill();
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
          if (d2 < 14400) {
            ctx.strokeStyle = 'rgba(120,165,255,' + (0.22 * (1 - d2 / 14400)).toFixed(3) + ')';
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        const mx = a.x - mouse.x, my = a.y - mouse.y, md = mx * mx + my * my;
        if (md < 22500) {
          ctx.strokeStyle = 'rgba(39,211,245,' + (0.5 * (1 - md / 22500)).toFixed(3) + ')';
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
      }
    }

    function bucle() {
      raf = 0;
      if (!vivo) return;
      dibuja(true);
      raf = requestAnimationFrame(bucle);
    }

    tamano();
    dibuja(false);
    if (reduce) {
      let t;
      window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(() => { tamano(); dibuja(false); }, 250); });
      return;
    }
    let tr;
    window.addEventListener('resize', () => { clearTimeout(tr); tr = setTimeout(tamano, 250); });
    hero.addEventListener('pointermove', e => {
      const r = c.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    });
    hero.addEventListener('pointerleave', () => { mouse.x = -9999; mouse.y = -9999; });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(es => {
        vivo = es[0].isIntersecting;
        if (vivo && !raf) raf = requestAnimationFrame(bucle);
      }).observe(hero);
    } else {
      vivo = true;
      raf = requestAnimationFrame(bucle);
    }
  }

  /* Inclinación 3D de la órbita siguiendo el puntero */
  function orbita() {
    const hero = $('.hero');
    const o = $('#orbita');
    if (!hero || !o || !fino || reduce) return;
    hero.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      o.style.setProperty('--ry', (x * 14).toFixed(2) + 'deg');
      o.style.setProperty('--rx', (-y * 12).toFixed(2) + 'deg');
    });
    hero.addEventListener('pointerleave', () => {
      o.style.setProperty('--rx', '0deg');
      o.style.setProperty('--ry', '0deg');
    });
  }

  /* Rotador de servicios en el hero */
  function rotador() {
    const r = $('.rot');
    if (!r || reduce) return;
    const items = $$('span', r);
    if (items.length < 2) return;
    let i = 0;
    setInterval(() => {
      const prev = items[i];
      prev.classList.remove('on');
      prev.classList.add('out');
      i = (i + 1) % items.length;
      items[i].classList.remove('out');
      items[i].classList.add('on');
      setTimeout(() => prev.classList.remove('out'), 700);
    }, 2400);
  }

  /* ---------------------------------------------------------------
     Diagnóstico exprés
     --------------------------------------------------------------- */
  const SOL = {
    pyme: {
      icono: 'i-chart', t: 'Crédito PYME',
      p: 'Es tu punto de partida si buscas capital para ampliar tu operación, surtir inventario o abrir una nueva línea. Lo estructuramos según el flujo real de tu empresa.',
      cta: 'Quiero mi crédito PYME', serv: 'Crédito PYME', ctx: 'quiero crecer pero el capital no alcanza'
    },
    arrendamiento: {
      icono: 'i-gear', t: 'Arrendamiento',
      p: 'Equípate con la maquinaria o el equipo que tu operación necesita sin descapitalizarte de golpe. Produces desde hoy y pagas con rentas planeadas.',
      cta: 'Quiero equipar mi empresa', serv: 'Arrendamiento', ctx: 'necesito maquinaria o equipo nuevo'
    },
    factoraje: {
      icono: 'i-invoice', t: 'Factoraje',
      p: 'Si tus clientes te pagan a plazo, adelanta el cobro de tus facturas y mantén el flujo en movimiento sin esperar al vencimiento.',
      cta: 'Quiero liquidez en mis facturas', serv: 'Factoraje', ctx: 'mis clientes me pagan a plazo'
    },
    simple: {
      icono: 'i-target', t: 'Crédito simple',
      p: 'Cuando tu proyecto tiene un monto definido, el crédito simple te da el capital con plazo y pagos pactados desde el inicio. Claridad total desde el primer día.',
      cta: 'Quiero financiar mi proyecto', serv: 'Crédito simple o revolvente', ctx: 'tengo un proyecto con monto definido'
    },
    revolvente: {
      icono: 'i-loop', t: 'Crédito revolvente',
      p: 'Una línea disponible que se renueva conforme pagas: ideal para cubrir capital de trabajo cuando lo necesitas, sin volver a empezar cada vez.',
      cta: 'Quiero mi línea de crédito', serv: 'Crédito simple o revolvente', ctx: 'quiero liquidez disponible todo el año'
    },
    seguros: {
      icono: 'i-shield', t: 'Seguros',
      p: 'Evaluamos los riesgos de tu empresa y te ayudamos a elegir la cobertura adecuada para que un imprevisto no frene tu operación.',
      cta: 'Quiero proteger mi empresa', serv: 'Seguros', ctx: 'un imprevisto podría frenar mi operación'
    }
  };

  function quiz() {
    const opts = $$('.opt');
    const card = $('#res');
    const t = $('#resT');
    const p = $('#resP');
    const cta = $('#resCta');
    const uso = $('#resIco use');
    const sec = $('#diagnostico');
    if (!opts.length || !card || !t || !p || !cta) return;
    const claves = opts.map(o => o.dataset.k);
    let usuario = false;
    let idx = -1;

    function poner(k) {
      const s = SOL[k];
      if (!s) return;
      idx = claves.indexOf(k);
      opts.forEach(o => o.setAttribute('aria-pressed', o.dataset.k === k ? 'true' : 'false'));
      card.classList.remove('is-swap');
      void card.offsetWidth;
      card.classList.add('is-swap');
      t.textContent = s.t;
      p.textContent = s.p;
      if (uso) uso.setAttribute('href', '#' + s.icono);
      const span = $('span', cta);
      if (span) span.textContent = s.cta;
      cta.dataset.wa = 'Hola, ' + s.ctx + '. Me interesa ' + s.t + ' y quiero que me asesoren.';
      cta.dataset.servicio = s.serv;
      enlazarWA(cta);
    }

    opts.forEach(o => o.addEventListener('click', () => { usuario = true; poner(o.dataset.k); }));
    poner(claves[0]);

    // Mientras nadie interactúa, el diagnóstico "respira" recorriendo las opciones.
    if (!reduce) {
      setInterval(() => {
        if (usuario || !sec) return;
        const r = sec.getBoundingClientRect();
        if (r.top < window.innerHeight * 0.8 && r.bottom > window.innerHeight * 0.2) {
          poner(claves[(idx + 1) % claves.length]);
        }
      }, 4200);
    }
  }

  /* ---------------------------------------------------------------
     Mercados: simulador toro / oso (gráfica viva)
     --------------------------------------------------------------- */
  function ciclos() {
    const sec = $('#ciclos');
    const line = $('#chLine');
    const area = $('#chArea');
    const dot = $('#chDot');
    const pulse = $('#chPulse');
    if (!sec || !line || !area) return;
    const btns = $$('[data-modo]', sec);
    const panels = $$('[data-panel]', sec);
    const masc = $$('.ciclos__mascot .mascota', sec);
    const N = 36, W = 600, H = 280;

    // Generador pseudoaleatorio con semilla: la gráfica es siempre la misma.
    let s = 11;
    const rng = () => {
      s |= 0; s = (s + 0x6D2B79F5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const nz = Array.from({ length: N }, () => rng() - 0.5);
    const mk = f => nz.map((n, i) => clamp(f(i / (N - 1), n), 14, 266));
    const SER = {
      alcista: mk((t, n) => 232 - t * 182 + Math.sin(t * 9) * 10 + n * 34 * (0.35 + t * 0.65)),
      bajista: mk((t, n) => 46 + t * 184 + Math.sin(t * 9 + 1) * 10 + n * 34 * (0.35 + t * 0.65))
    };
    let cur = SER.alcista.slice();
    let from = SER.alcista.slice();
    let to = SER.alcista;
    let t0 = -99999;
    let modo = 'alcista';
    let corre = false;
    let visible = false;
    let usuario = false;
    const DUR = 1100;

    function pinta(now) {
      const k = reduce ? 1 : clamp((now - t0) / DUR);
      const e = easeIO(k);
      const pts = [];
      for (let i = 0; i < N; i++) {
        cur[i] = lerp(from[i], to[i], e);
        const wob = reduce ? 0 : Math.sin(now / 650 + i * 0.55) * (i / (N - 1)) * 3.2;
        pts.push([i * W / (N - 1), cur[i] + wob]);
      }
      let d = 'M' + pts[0][0] + ' ' + pts[0][1].toFixed(1);
      for (let i = 1; i < N - 1; i++) {
        const a = pts[i], b = pts[i + 1];
        d += ' Q' + a[0].toFixed(1) + ' ' + a[1].toFixed(1) + ' ' + ((a[0] + b[0]) / 2).toFixed(1) + ' ' + ((a[1] + b[1]) / 2).toFixed(1);
      }
      const L = pts[N - 1];
      d += ' L' + L[0] + ' ' + L[1].toFixed(1);
      line.setAttribute('d', d);
      area.setAttribute('d', d + ' L' + W + ' ' + H + ' L0 ' + H + ' Z');
      if (dot) { dot.setAttribute('cx', L[0]); dot.setAttribute('cy', L[1].toFixed(1)); }
      if (pulse) { pulse.setAttribute('cx', L[0]); pulse.setAttribute('cy', L[1].toFixed(1)); }
    }

    function bucle(now) {
      corre = false;
      pinta(now);
      if (visible && !reduce) { corre = true; requestAnimationFrame(bucle); }
    }
    function arranca() {
      if (!corre) { corre = true; requestAnimationFrame(bucle); }
    }

    function setModo(m, manual) {
      if (manual) usuario = true;
      if (m === modo) return;
      modo = m;
      sec.setAttribute('data-mode', m);
      btns.forEach(b => b.setAttribute('aria-pressed', b.dataset.modo === m ? 'true' : 'false'));
      panels.forEach(p => p.classList.toggle('is-on', p.dataset.panel === m));
      masc.forEach(x => x.classList.toggle('is-on', x.dataset.m === m));
      from = cur.slice();
      to = SER[m];
      t0 = performance.now();
      pinta(t0 + 1);
      if (visible) arranca();
      const activa = masc.filter(x => x.dataset.m === m)[0];
      if (activa && window.anime && !reduce) {
        window.anime({ targets: activa, scale: [0.78, 1], rotate: [-8, 0], duration: 900, easing: 'easeOutElastic(1, .6)' });
      }
    }

    btns.forEach(b => b.addEventListener('click', () => setModo(b.dataset.modo, true)));
    pinta(performance.now());

    const setVis = v => { visible = v; if (v) arranca(); };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(es => setVis(es[0].isIntersecting)).observe(sec);
    } else {
      setVis(true);
    }

    if (!reduce) {
      setInterval(() => {
        if (visible && !usuario) setModo(modo === 'alcista' ? 'bajista' : 'alcista', false);
      }, 6800);
    }
  }

  /* ---------------------------------------------------------------
     Formulario → WhatsApp
     --------------------------------------------------------------- */
  function formulario() {
    const f = $('#form');
    if (!f) return;
    const campoNombre = $('#f-nombre');
    if (campoNombre) {
      campoNombre.addEventListener('input', () => {
        const fld = campoNombre.closest('.field');
        if (fld) fld.classList.remove('field--err');
      });
    }
    f.addEventListener('submit', e => {
      e.preventDefault();
      if (!hayWA) return;
      const val = n => ((f.elements[n] && f.elements[n].value) || '').trim();
      const nombre = val('nombre');
      if (!nombre) {
        const fld = campoNombre && campoNombre.closest('.field');
        if (fld) fld.classList.add('field--err');
        if (campoNombre) campoNombre.focus();
        return;
      }
      const empresa = val('empresa');
      const servicio = val('servicio');
      const mensaje = val('mensaje');
      const partes = ['Hola, soy ' + nombre + (empresa ? ' de ' + empresa : '') + '.'];
      if (servicio) partes.push('Me interesa: ' + servicio + '.');
      if (mensaje) partes.push('Mi caso: ' + mensaje);
      partes.push('Quiero mi diagnóstico financiero con FINANCIAL ADVISOR.');
      const w = window.open(urlWA(partes.join(' ')), '_blank', 'noopener');
      if (!w) window.location.href = urlWA(partes.join(' '));
    });
  }

  /* ---------------------------------------------------------------
     Cuadrícula de puntos con ola (anime.js; si no carga, queda estática)
     --------------------------------------------------------------- */
  function puntos() {
    const box = $('#dotgrid');
    if (!box) return;
    let anim = null;
    function construir() {
      const r = box.getBoundingClientRect();
      const celda = r.width < 600 ? 38 : 50;
      const cols = Math.max(4, Math.floor(r.width / celda));
      const rows = Math.max(3, Math.floor(r.height / celda));
      box.style.setProperty('--cols', cols);
      box.style.setProperty('--rows', rows);
      box.innerHTML = '';
      const frag = document.createDocumentFragment();
      for (let i = 0; i < cols * rows; i++) frag.appendChild(document.createElement('i'));
      box.appendChild(frag);
      if (anim && anim.pause) anim.pause();
      anim = null;
      if (window.anime && !reduce) {
        anim = window.anime({
          targets: '#dotgrid i',
          scale: [{ value: 2.1, duration: 550 }, { value: 1, duration: 750 }],
          opacity: [{ value: 1, duration: 550 }, { value: 0.28, duration: 750 }],
          delay: window.anime.stagger(80, { grid: [cols, rows], from: 'center' }),
          loop: true,
          loopDelay: 700,
          easing: 'easeInOutSine'
        });
      }
    }
    construir();
    let tm;
    window.addEventListener('resize', () => { clearTimeout(tm); tm = setTimeout(construir, 350); });
    if ('IntersectionObserver' in window && box.parentNode) {
      new IntersectionObserver(es => {
        if (!anim) return;
        if (es[0].isIntersecting) anim.play(); else anim.pause();
      }).observe(box.parentNode);
    }
  }

  /* ---------------------------------------------------------------
     Efectos de puntero: foco luminoso en tarjetas + botones magnéticos
     --------------------------------------------------------------- */
  function efectosPuntero() {
    $$('[data-spot]').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
    if (!fino || reduce) return;
    $$('.btn--primary, .btn--gold, .btn--acc').forEach(b => {
      b.addEventListener('pointermove', e => {
        const r = b.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.16;
        const y = (e.clientY - r.top - r.height / 2) * 0.26;
        b.style.translate = x.toFixed(1) + 'px ' + y.toFixed(1) + 'px';
      });
      b.addEventListener('pointerleave', () => { b.style.translate = ''; });
    });
  }

  /* ---------------------------------------------------------------
     Bucle de scroll (un solo rAF para todos los efectos ligados al scroll)
     --------------------------------------------------------------- */
  const heroInner = $('#heroInner');
  const barra = $('#progreso');
  const hdr = $('#hdr');
  const expand = $('#industrias');
  const tl = $('#tl');
  const pila = $$('.srv');
  const mqPila = window.matchMedia('(min-width: 768px) and (min-height: 640px)');
  const spyIds = ['servicios', 'industrias', 'ciclos', 'metodo', 'faq'];

  function efectoPila() {
    const activo = mqPila.matches && !reduce;
    pila.forEach((c, i) => {
      const inner = c.firstElementChild;
      if (!inner) return;
      if (!activo || i === pila.length - 1) {
        inner.style.removeProperty('--sc');
        inner.style.removeProperty('--ov');
        return;
      }
      const r = c.getBoundingClientRect();
      const nr = pila[i + 1].getBoundingClientRect();
      const cubre = clamp((r.bottom - nr.top) / r.height);
      inner.style.setProperty('--sc', (1 - cubre * 0.055).toFixed(4));
      inner.style.setProperty('--ov', cubre.toFixed(3));
    });
  }

  function efectoExpand(vh) {
    if (!expand) return;
    const r = expand.getBoundingClientRect();
    const total = r.height - vh;
    const p = (reduce || total <= 0) ? 1 : clamp(-r.top / (total * 0.62));
    expand.style.setProperty('--p', p.toFixed(4));
    expand.classList.toggle('is-open', p > 0.72);
  }

  function efectoLinea(vh) {
    if (!tl) return;
    const r = tl.getBoundingClientRect();
    tl.style.setProperty('--p', clamp((vh * 0.62 - r.top) / r.height).toFixed(4));
    steps.forEach(st => {
      const sr = st.getBoundingClientRect();
      st.classList.toggle('on', sr.top < vh * 0.62);
    });
  }

  function seccionActiva(vh) {
    if (!navLinks.length) return;
    let actual = '';
    spyIds.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.top < vh * 0.45 && r.bottom > vh * 0.45) actual = id;
    });
    navLinks.forEach(a => {
      if (a.getAttribute('href') === '#' + actual) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  }

  function frame() {
    const sy = window.pageYOffset || root.scrollTop || 0;
    const vh = window.innerHeight;
    const max = root.scrollHeight - vh;
    if (barra) barra.style.transform = 'scaleX(' + (max > 0 ? clamp(sy / max) : 0).toFixed(4) + ')';
    if (hdr) hdr.classList.toggle('is-scrolled', sy > 40);
    if (heroInner && !reduce) {
      if (sy < vh * 1.3) {
        heroInner.style.transform = 'translate3d(0,' + (sy * 0.16).toFixed(1) + 'px,0)';
        heroInner.style.opacity = (1 - clamp((sy - vh * 0.25) / (vh * 0.95)) * 0.9).toFixed(3);
      }
    }
    actualizarLit(vh);
    efectoExpand(vh);
    efectoLinea(vh);
    efectoPila();
    seccionActiva(vh);
    revelarVisibles();
  }

  let pendiente = false;
  const solicita = () => {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(() => { pendiente = false; frame(); });
  };

  /* ---------------------------------------------------------------
     Arranque
     --------------------------------------------------------------- */
  [banderas, cargador, cabecera, whatsapp, revelados, palabrasLit, lienzoHero, orbita, rotador, quiz, ciclos, formulario, puntos, efectosPuntero]
    .forEach(safe);

  steps = $$('.step');

  window.addEventListener('scroll', solicita, { passive: true });
  window.addEventListener('resize', solicita);
  window.addEventListener('load', () => { solicita(); setTimeout(solicita, 600); });
  safe(frame);
  // Respaldos: si el observador o el scroll fallan, lo visible se revela igual.
  setTimeout(() => { revelarVisibles(); solicita(); }, 2000);
  setTimeout(() => { revelarVisibles(); solicita(); }, 4500);
})();
