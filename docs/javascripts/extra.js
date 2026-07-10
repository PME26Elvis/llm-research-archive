const applyNotesEnhancements = () => {
  const ownHosts = [
    "PME26Elvis.github.io",
    "github.com/PME26Elvis/llm-research-archive",
  ];

  document
    .querySelectorAll('.md-content a[href^="http"]')
    .forEach((link) => {
      const href = link.getAttribute("href") || "";
      const isOwnLink = ownHosts.some((host) => href.includes(host));

      if (!isOwnLink) {
        link.setAttribute("target", "_blank");
        link.setAttribute("rel", "noopener noreferrer");
      }
    });

  document.querySelectorAll(".notes-card").forEach((card) => {
    if (card.dataset.spotlightReady === "true") return;
    card.dataset.spotlightReady = "true";
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--spot-x", `${event.clientX - rect.left}px`);
      card.style.setProperty("--spot-y", `${event.clientY - rect.top}px`);
    });
  });

  document.querySelectorAll(".constellation-canvas").forEach((canvas) => {
    if (canvas.dataset.ready === "true") return;
    canvas.dataset.ready = "true";
    const context = canvas.getContext("2d");
    const hero = canvas.closest(".constellation-hero");
    if (!context || !hero) return;
    const stars = Array.from({ length: 74 }, (_, index) => ({
      x: (Math.sin(index * 41.7) + 1) / 2,
      y: (Math.cos(index * 23.3) + 1) / 2,
      r: 0.7 + ((index * 13) % 24) / 14,
      pulse: index * 0.37,
    }));

    const resize = () => {
      const rect = hero.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(rect.width * ratio));
      canvas.height = Math.max(1, Math.floor(rect.height * ratio));
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      positionNodes();
    };

    const draw = (time) => {
      const rect = hero.getBoundingClientRect();
      context.clearRect(0, 0, rect.width, rect.height);
      stars.forEach((star, index) => {
        const x = star.x * rect.width;
        const y = star.y * rect.height;
        const alpha = 0.38 + Math.sin(time / 900 + star.pulse) * 0.22;
        context.beginPath();
        context.fillStyle = `rgba(186, 230, 253, ${alpha})`;
        context.arc(x, y, star.r, 0, Math.PI * 2);
        context.fill();

        for (let next = index + 1; next < stars.length; next += 1) {
          const target = stars[next];
          const tx = target.x * rect.width;
          const ty = target.y * rect.height;
          const distance = Math.hypot(tx - x, ty - y);
          if (distance < 145) {
            context.beginPath();
            context.strokeStyle = `rgba(125, 211, 252, ${0.16 * (1 - distance / 145)})`;
            context.lineWidth = 1;
            context.moveTo(x, y);
            context.lineTo(tx, ty);
            context.stroke();
          }
        }
      });
      window.requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize, { passive: true });
    window.requestAnimationFrame(draw);
  });
};

if (typeof document$ !== "undefined") {
  document$.subscribe(applyNotesEnhancements);
} else {
  document.addEventListener("DOMContentLoaded", applyNotesEnhancements);
}

const applyResearchObservatory = () => {
  document.querySelectorAll("[data-observatory]").forEach((shell) => {
    if (shell.dataset.observatoryReady === "true") return;
    shell.dataset.observatoryReady = "true";

    const dataScript = shell.querySelector("#observatory-data");
    const canvas = shell.querySelector(".observatory-starmap");
    const nodeLayer = shell.querySelector(".observatory-node-layer");
    const context = canvas && canvas.getContext("2d");
    if (!dataScript || !canvas || !nodeLayer || !context) return;

    const signals = JSON.parse(dataScript.textContent || "[]");
    const state = {
      filter: "all",
      active: signals[0],
      pointerX: 0.5,
      pointerY: 0.5,
      tick: 0,
    };

    const elements = {
      count: shell.querySelector("[data-observatory-count]"),
      focus: shell.querySelector("[data-observatory-focus]"),
      title: shell.querySelector("[data-intel-title]"),
      copy: shell.querySelector("[data-intel-copy]"),
      theme: shell.querySelector("[data-intel-theme]"),
      energy: shell.querySelector("[data-intel-energy]"),
      route: shell.querySelector("[data-intel-route]"),
      link: shell.querySelector("[data-intel-link]"),
    };

    const themeLabel = (theme) => ({
      agents: "Agents",
      compute: "Compute",
      llm: "LLM",
      carbon: "Carbon",
      cs: "CS",
    }[theme] || theme);

    const filteredSignals = () => signals.filter((signal) => state.filter === "all" || signal.theme === state.filter);

    const syncNodeState = () => {
      nodeLayer.querySelectorAll(".obs-node").forEach((node) => {
        const signal = signals.find((item) => item.id === node.dataset.signalId);
        const visible = signal && (state.filter === "all" || signal.theme === state.filter);
        node.classList.toggle("is-muted", !visible);
        node.classList.toggle("is-active", Boolean(signal && state.active && state.active.id === signal.id));
        node.setAttribute("aria-pressed", Boolean(signal && state.active && state.active.id === signal.id));
      });
    };

    const setActive = (signal) => {
      state.active = signal;
      elements.title.textContent = signal.title;
      elements.copy.textContent = signal.copy;
      elements.theme.textContent = themeLabel(signal.theme);
      elements.energy.textContent = signal.energy;
      elements.route.textContent = signal.route;
      elements.link.setAttribute("href", signal.link);
      elements.focus.textContent = themeLabel(signal.theme);
      syncNodeState();
    };

    const positionNodes = () => {
      const rect = shell.getBoundingClientRect();
      nodeLayer.querySelectorAll(".obs-node").forEach((node) => {
        const signal = signals.find((item) => item.id === node.dataset.signalId);
        if (!signal) return;
        node.style.left = `${signal.x * rect.width}px`;
        node.style.top = `${signal.y * rect.height + 120}px`;
      });
    };

    const buildNodes = () => {
      nodeLayer.textContent = "";
      signals.forEach((signal) => {
        const node = document.createElement("button");
        node.type = "button";
        node.className = "obs-node";
        node.dataset.signalId = signal.id;
        node.dataset.label = themeLabel(signal.theme);
        node.dataset.theme = signal.theme;
        node.setAttribute("aria-label", `選取研究節點：${signal.title}`);
        node.addEventListener("click", () => setActive(signal));
        nodeLayer.appendChild(node);
      });
      positionNodes();
      syncNodeState();
    };

    const resize = () => {
      const rect = shell.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(rect.width * ratio));
      canvas.height = Math.max(1, Math.floor(rect.height * ratio));
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      positionNodes();
    };

    const drawSignal = (signal, rect, time) => {
      const parallaxX = (state.pointerX - 0.5) * 34;
      const parallaxY = (state.pointerY - 0.5) * 28;
      const x = signal.x * rect.width + parallaxX;
      const y = signal.y * rect.height + parallaxY + 120;
      const active = state.active && state.active.id === signal.id;
      const visible = state.filter === "all" || state.filter === signal.theme;
      const radius = (active ? 12 : 7) + Math.sin(time / 420 + signal.energy) * 1.5;
      const alpha = visible ? 1 : 0.16;

      context.save();
      context.globalAlpha = alpha;
      context.beginPath();
      context.fillStyle = active ? "rgba(240, 249, 255, 0.98)" : "rgba(125, 211, 252, 0.88)";
      context.shadowColor = active ? "rgba(34, 211, 238, 0.95)" : "rgba(125, 211, 252, 0.55)";
      context.shadowBlur = active ? 26 : 16;
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();

      context.shadowBlur = 0;
      context.strokeStyle = active ? "rgba(255, 255, 255, 0.72)" : "rgba(125, 211, 252, 0.28)";
      context.lineWidth = active ? 2 : 1;
      context.beginPath();
      context.arc(x, y, radius + 13 + Math.sin(time / 620) * 3, 0, Math.PI * 2);
      context.stroke();

      if (visible) {
        context.fillStyle = "rgba(226, 232, 240, 0.72)";
        context.font = "700 12px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
        context.fillText(themeLabel(signal.theme).toUpperCase(), x + 16, y - 14);
      }
      context.restore();
      return { signal, x, y, radius: radius + 18, visible };
    };

    const draw = (time) => {
      state.tick = time;
      const rect = shell.getBoundingClientRect();
      context.clearRect(0, 0, rect.width, rect.height);

      const gradient = context.createRadialGradient(rect.width * 0.5, rect.height * 0.32, 40, rect.width * 0.5, rect.height * 0.34, rect.width * 0.82);
      gradient.addColorStop(0, "rgba(34, 211, 238, 0.12)");
      gradient.addColorStop(0.52, "rgba(79, 70, 229, 0.06)");
      gradient.addColorStop(1, "rgba(2, 6, 23, 0)");
      context.fillStyle = gradient;
      context.fillRect(0, 0, rect.width, rect.height);

      const points = signals.map((signal) => ({
        signal,
        x: signal.x * rect.width + (state.pointerX - 0.5) * 34,
        y: signal.y * rect.height + (state.pointerY - 0.5) * 28 + 120,
      }));

      points.forEach((point, index) => {
        points.slice(index + 1).forEach((target) => {
          const sameVisible = (state.filter === "all" || point.signal.theme === state.filter || target.signal.theme === state.filter);
          const distance = Math.hypot(target.x - point.x, target.y - point.y);
          if (distance < 430) {
            context.beginPath();
            context.strokeStyle = `rgba(125, 211, 252, ${sameVisible ? 0.16 * (1 - distance / 430) : 0.035})`;
            context.lineWidth = sameVisible ? 1.4 : 0.7;
            context.moveTo(point.x, point.y);
            context.lineTo(target.x, target.y);
            context.stroke();
          }
        });
      });

      shell._observatoryHitTargets = signals.map((signal) => drawSignal(signal, rect, time));
      window.requestAnimationFrame(draw);
    };

    shell.dataset.visualMode = "cinematic";

    shell.querySelectorAll(".display-mode").forEach((button) => {
      button.addEventListener("click", () => {
        shell.querySelectorAll(".display-mode").forEach((item) => item.classList.remove("is-active"));
        button.classList.add("is-active");
        shell.dataset.visualMode = button.dataset.mode || "cinematic";
      });
    });

    shell.querySelectorAll(".obs-filter").forEach((button) => {
      button.addEventListener("click", () => {
        shell.querySelectorAll(".obs-filter").forEach((item) => item.classList.remove("is-active"));
        button.classList.add("is-active");
        state.filter = button.dataset.filter || "all";
        const visible = filteredSignals();
        elements.count.textContent = visible.length;
        if (visible.length) setActive(visible[0]);
        syncNodeState();
      });
    });

    shell.addEventListener("pointermove", (event) => {
      const rect = shell.getBoundingClientRect();
      state.pointerX = (event.clientX - rect.left) / rect.width;
      state.pointerY = (event.clientY - rect.top) / rect.height;
      shell.querySelectorAll(".obs-panel, .route-card").forEach((panel) => {
        const panelRect = panel.getBoundingClientRect();
        panel.style.setProperty("--spot-x", `${event.clientX - panelRect.left}px`);
        panel.style.setProperty("--spot-y", `${event.clientY - panelRect.top}px`);
      });
    });

    canvas.addEventListener("click", (event) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const target = (shell._observatoryHitTargets || [])
        .filter((hit) => hit.visible)
        .find((hit) => Math.hypot(hit.x - x, hit.y - y) <= hit.radius);
      if (target) setActive(target.signal);
    });

    buildNodes();
    resize();
    setActive(state.active);
    elements.count.textContent = signals.length;
    window.addEventListener("resize", resize, { passive: true });
    window.requestAnimationFrame(draw);
  });
};

if (typeof document$ !== "undefined") {
  document$.subscribe(applyResearchObservatory);
} else {
  document.addEventListener("DOMContentLoaded", applyResearchObservatory);
}
