/* ============ CONFIG ============ */
const CONFIG = {
  // Access key gratuita de https://web3forms.com (se genera con el email donde querés recibir las consultas)
  WEB3FORMS_KEY: "169b50c3-a335-4c85-876b-f7631e854a63",
  WHATSAPP_NUMBER: "5493512151260",
  WHATSAPP_MESSAGE: "Hola! Quiero pedir un presupuesto para un proyecto en Córdoba.",
};

/* ============ WhatsApp flotante ============ */
document.getElementById("wa").href =
  `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(CONFIG.WHATSAPP_MESSAGE)}`;

/* ============ Menú móvil ============ */
(() => {
  const btn = document.getElementById("menu-btn");
  const nav = document.getElementById("main-nav");
  const set = open => {
    nav.classList.toggle("open", open);
    btn.setAttribute("aria-expanded", open);
    btn.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
  };
  btn.addEventListener("click", () => set(!nav.classList.contains("open")));
  nav.addEventListener("click", e => { if (e.target.tagName === "A") set(false); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") set(false); });
})();

/* ============ Hero: slider plano / obra terminada ============ */
(() => {
  const hero = document.getElementById("stage");
  const heroSection = document.getElementById("hero");
  const plano = document.getElementById("plano");
  const divider = document.getElementById("divider");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  let current = 50, target = 50, dragging = false, interacted = false;

  const render = p => {
    plano.style.clipPath = `inset(0 ${100 - p}% 0 0)`;
    divider.style.left = p + "%";
  };
  render(50);

  const toPercent = x => {
    const r = hero.getBoundingClientRect();
    return Math.min(100, Math.max(0, ((x - r.left) / r.width) * 100));
  };

  // Barrido inicial: 0 → 100 → 50
  if (!reduce) {
    render(0);
    const ease = t => 1 - Math.pow(1 - t, 3);
    const t0 = performance.now() + 500;
    const intro = now => {
      if (interacted) return;
      const t = (now - t0) / 2600;
      if (t < 0) { requestAnimationFrame(intro); return; }
      if (t < 0.6) current = target = 100 * ease(t / 0.6);
      else if (t < 1) current = target = 100 - 50 * ease((t - 0.6) / 0.4);
      else { current = target = 50; render(50); return; }
      render(current);
      requestAnimationFrame(intro);
    };
    requestAnimationFrame(intro);
  }

  const take = x => {
    interacted = true;
    heroSection.classList.add("touched");
    target = toPercent(x);
  };
  hero.addEventListener("pointerdown", e => { dragging = true; take(e.clientX); });
  window.addEventListener("pointerup", () => (dragging = false));
  window.addEventListener("pointercancel", () => (dragging = false));
  hero.addEventListener("pointermove", e => {
    if ((e.pointerType === "mouse" || dragging) && !e.target.closest(".btn")) take(e.clientX);
  });

  (function loop() {
    if (interacted) {
      current += (target - current) * 0.14;
      render(current);
    }
    requestAnimationFrame(loop);
  })();
})();

/* ============ Servicios → preselecciona en el formulario ============ */
document.querySelectorAll(".card[data-service]").forEach(card => {
  card.addEventListener("click", () => {
    document.getElementById("servicio").value = card.dataset.service;
  });
});

/* ============ Formulario → email (Web3Forms) ============ */
(() => {
  const form = document.getElementById("form");
  const status = document.getElementById("status");
  const submit = document.getElementById("submit");
  const required = ["nombre", "contacto", "mensaje"];

  const say = (msg, cls) => { status.textContent = msg; status.className = "form-status " + (cls || ""); };

  form.addEventListener("submit", async e => {
    e.preventDefault();
    say("");

    let ok = true;
    required.forEach(n => {
      const el = form.elements[n];
      const bad = !el.value.trim();
      el.classList.toggle("invalid", bad);
      if (bad) ok = false;
    });
    if (!ok) { say("Completá nombre, un medio de contacto y tu mensaje.", "err"); return; }

    if (CONFIG.WEB3FORMS_KEY.startsWith("YOUR_")) {
      say("El formulario todavía no está configurado (falta la access key).", "err");
      return;
    }

    const f = new FormData(form);
    f.append("access_key", CONFIG.WEB3FORMS_KEY);
    f.append("subject", `Nueva consulta web: ${f.get("servicio") || "Presupuesto"} - ${f.get("nombre")}`);
    f.append("from_name", "Planos Aprobados Córdoba (web)");

    const label = submit.innerHTML;
    submit.disabled = true;
    submit.innerHTML = "Enviando…";
    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: f,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        form.reset();
        say("¡Gracias! Recibimos tu consulta y te respondemos a la brevedad.", "ok");
      } else {
        throw new Error(data.message || "error");
      }
    } catch (err) {
      say("No pudimos enviar tu consulta. Probá de nuevo o escribinos por WhatsApp.", "err");
    } finally {
      submit.disabled = false;
      submit.innerHTML = label;
    }
  });

  form.addEventListener("input", e => e.target.classList.remove("invalid"));
})();
