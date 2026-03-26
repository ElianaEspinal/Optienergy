document.addEventListener("DOMContentLoaded", () => {
  // —— Navbar: uso de delegación de eventos para que funcione con <ion-icon> en producción (Shadow DOM / carga asíncrona) ——
  const nav = document.getElementById("navbar");
  const navToggle = document.getElementById("nav-toggle");
  const navClose = document.getElementById("nav-close");
  const navTogglesContainer = document.querySelector(".nav_toggles");
  const toggles = document.querySelectorAll(".submenu-toggle");

  // Función para abrir el menú (solo si nav existe)
  const openMenu = () => {
    if (!nav) return;
    nav.classList.add("show-menu");
    document.body.style.overflow = "hidden";
  };

  // Función para cerrar el menú
  const closeMenu = () => {
    if (!nav) return;
    nav.classList.remove("show-menu");
    document.body.style.overflow = "";

    document.querySelectorAll(".has-submenu").forEach(item => {
      item.classList.remove("open");
      const btn = item.querySelector(".submenu-toggle");
      if (btn) btn.setAttribute("aria-expanded", "false");
    });
  };

  // —— Delegación de eventos para abrir/cerrar menú (robusto con ion-icon y Shadow DOM) ——
  const handleNavToggleClick = (e) => {
    const openBtn = e.target.closest("#nav-toggle");
    const closeBtn = e.target.closest("#nav-close");
    if (openBtn) {
      e.preventDefault();
      openMenu();
    } else if (closeBtn) {
      e.preventDefault();
      closeMenu();
    }
  };

  if (navTogglesContainer) {
    navTogglesContainer.addEventListener("click", handleNavToggleClick);
  } else {
    if (navToggle) navToggle.addEventListener("click", (e) => { e.preventDefault(); openMenu(); });
    if (navClose) navClose.addEventListener("click", (e) => { e.preventDefault(); closeMenu(); });
  }

  // Cerrar menú al hacer click en el overlay (solo si nav existe para evitar error)
  if (nav) {
    nav.addEventListener("click", (e) => {
      if (e.target === nav && nav.classList.contains("show-menu")) {
        closeMenu();
      }
    });
  }

  window.addEventListener("resize", () => {
    if (window.innerWidth >= 1200) closeMenu();
  });

  // —— Submenús móvil ——
  toggles.forEach(toggle => {
    toggle.addEventListener("click", (e) => {
      if (window.innerWidth >= 1024) return;

      e.preventDefault();

      const parent = toggle.closest(".has-submenu");
      if (!parent) return;

      const isOpen = parent.classList.contains("open");

      document.querySelectorAll(".has-submenu").forEach(item => {
        item.classList.remove("open");
        const btn = item.querySelector(".submenu-toggle");
        if (btn) btn.setAttribute("aria-expanded", "false");
      });

      if (!isOpen) {
        parent.classList.add("open");
        toggle.setAttribute("aria-expanded", "true");
      }
    });
  });

  // ——— Tabs de Servicios ———
  const serviciosTabs = document.querySelectorAll(".servicios_tab");
  const serviciosPanels = document.querySelectorAll(".servicios_panel");

  serviciosTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const targetId = "panel-" + tab.dataset.tab;

      serviciosTabs.forEach((t) => {
        t.classList.remove("active");
        t.setAttribute("aria-selected", "false");
      });
      tab.classList.add("active");
      tab.setAttribute("aria-selected", "true");

      serviciosPanels.forEach((panel) => {
        if (panel.id === targetId) {
          panel.classList.add("active");
          panel.removeAttribute("hidden");
        } else {
          panel.classList.remove("active");
          panel.setAttribute("hidden", "");
        }
      });
    });
  });

  // ——— Formulario de contacto: validación y envío a Formspree ———
  const formContacto = document.getElementById("form-contacto");
  if (formContacto) {
    const nombre = formContacto.querySelector("#contacto_nombre");
    const email = formContacto.querySelector("#contacto_email");
    const empresa = formContacto.querySelector("#contacto_empresa");
    const telefono = formContacto.querySelector("#contacto_telefono");
    const mensaje = formContacto.querySelector("#contacto_mensaje");
    const factura = null; // adjunto vía Cloudinary; URL se guarda en #archivo_url
    const honeypot = formContacto.querySelector("#contacto_web");
    const btnEnviar = formContacto.querySelector("#contacto_submit") || formContacto.querySelector("#btn-enviar");
    const estadoEl = document.getElementById("contacto_estado");

    const reEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function showError(field, msg) {
      if (!field) return;
      const id = field.id;
      const errEl = document.getElementById("error-" + id.replace("contacto_", ""));
      if (errEl) {
        errEl.textContent = msg;
        field.classList.toggle("error", !!msg);
      }
    }

    function setEstado(msg) {
      if (estadoEl) estadoEl.textContent = msg;
    }

    function validar() {
      let ok = true;
      showError(nombre, "");
      showError(email, "");
      showError(mensaje, "");

      const n = (nombre && nombre.value) ? nombre.value.trim() : "";
      if (!n) {
        showError(nombre, "Indica tu nombre completo.");
        ok = false;
      } else if (n.length > 200) {
        showError(nombre, "Máximo 200 caracteres.");
        ok = false;
      }

      const e = (email && email.value) ? email.value.trim() : "";
      if (!e) {
        showError(email, "Indica tu email.");
        ok = false;
      } else if (!reEmail.test(e)) {
        showError(email, "Email no válido.");
        ok = false;
      } else if (e.length > 254) {
        showError(email, "Email demasiado largo.");
        ok = false;
      }

      const m = (mensaje && mensaje.value) ? mensaje.value.trim() : "";
      if (!m) {
        showError(mensaje, "Escribe tu mensaje.");
        ok = false;
      } else if (m.length > 2000) {
        showError(mensaje, "Máximo 2000 caracteres.");
        ok = false;
      }

      return ok;
    }

    formContacto.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (honeypot && honeypot.value.trim() !== "") return;
      if (!validar()) return;

      // Usar action del formulario (Formspree) y FormData del propio form
      const formData = new FormData(formContacto);
      const submitText = btnEnviar ? btnEnviar.textContent : "";

      if (btnEnviar) {
        btnEnviar.disabled = true;
        btnEnviar.textContent = "Enviando…";
      }
      setEstado("Enviando mensaje...");

      try {
        const response = await fetch(formContacto.action, {
          method: formContacto.method,
          body: formData,
          headers: { Accept: "application/json" }
        });

        if (response.ok) {
          formContacto.reset();
          const path = window.location.pathname;
          const thanksUrl = path.indexOf("/ca/") === 0 ? "/ca/contacte-gracies.html" : path.indexOf("/es/") === 0 ? "/es/contacto-gracias.html" : "/contacto-gracias.html";
          window.location.href = thanksUrl;
          return;
        } else {
          let errorMsg = "No se pudo enviar el mensaje. Puedes llamarnos al +34 613 712 902 o escribir a info@optienergy.es.";
          try {
            const data = await response.json();
            if (data && data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
              errorMsg = data.errors.map((err) => err.message).join(" ");
            } else if (data && data.error) {
              errorMsg = data.error;
            }
          } catch (_) {}
          if (response.status === 404 || response.status === 422) {
            errorMsg += " Comprueba en Formspree que el formulario está activado (email de verificación) y que el enlace del form es correcto.";
          }
          console.error("Formspree error:", response.status, errorMsg);
          setEstado(errorMsg);
          if (btnEnviar) {
            btnEnviar.disabled = false;
            btnEnviar.textContent = submitText;
          }
        }
      } catch (err) {
        setEstado("Ha ocurrido un problema de conexión. Comprueba tu red e inténtalo de nuevo.");
        if (btnEnviar) {
          btnEnviar.disabled = false;
          btnEnviar.textContent = submitText;
        }
      }
    });
  }

  // ——— Acordeón FAQ (página de servicio) ———
  const faqItems = document.querySelectorAll(".faq-item");
  faqItems.forEach((item) => {
    const btn = item.querySelector(".faq-question");
    if (!btn) return;

    btn.addEventListener("click", () => {
      const isOpen = item.classList.contains("is-open");

      // Cerrar todos
      faqItems.forEach((other) => {
        other.classList.remove("is-open");
        const otherBtn = other.querySelector(".faq-question");
        if (otherBtn) {
          otherBtn.setAttribute("aria-expanded", "false");
        }
      });

      // Abrir el clicado si estaba cerrado
      if (!isOpen) {
        item.classList.add("is-open");
        btn.setAttribute("aria-expanded", "true");
      }
    });
  });

  // ——— Acordeón FAQ landing (Asesoramiento Hogares) ———
  const faqLandingItems = document.querySelectorAll(".faq-item-landing");
  faqLandingItems.forEach((item) => {
    const btn = item.querySelector(".faq-landing_q");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const isOpen = item.classList.contains("is-open");
      faqLandingItems.forEach((other) => {
        other.classList.remove("is-open");
        const otherBtn = other.querySelector(".faq-landing_q");
        if (otherBtn) otherBtn.setAttribute("aria-expanded", "false");
      });
      if (!isOpen) {
        item.classList.add("is-open");
        btn.setAttribute("aria-expanded", "true");
      }
    });
  });

  // ——— Reveal suave al hacer scroll (página de servicio) ———
  // No animamos .articulo-conclusion para que el CTA final esté siempre visible
  const mainContent = document.querySelector(".page-servicio");
  if (mainContent && "IntersectionObserver" in window) {
    const sections = mainContent.querySelectorAll(".cta-box, .faq-section");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      { rootMargin: "0px 0px -40px 0px", threshold: 0.05 }
    );
    sections.forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(14px)";
      el.style.transition = "opacity 0.5s ease, transform 0.5s ease";
      observer.observe(el);
    });
  }
});
