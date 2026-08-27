// Find the elements that JavaScript needs.
const modal = document.querySelector("#content-modal");
const modalTitle = document.querySelector("#modal-title");
const modalContent = document.querySelector("#modal-content");
const closeButton = document.querySelector("#close-modal");
const menuButtons = document.querySelectorAll("[data-view]");
const contactMenus = document.querySelectorAll(".contact-menu");
const neuralCanvas = document.querySelector("#neural-background");
const dockPdfLink = document.querySelector('.dock-card[href="CV.pdf"]');
const projectShowcase = document.querySelector("#data-attribution-showcase");
const projectShowcasePath = "/data_attribution";

let showcaseReturnFocus = null;

projectShowcase.inert = true;

/**
 * A link opened in a new tab can retain focus when this page is revisited.
 * Blur only the Dock PDF link so its focus-within fan does not stay open.
 */
function releaseDockPdfFocus() {
  if (document.activeElement === dockPdfLink) {
    dockPdfLink.blur();
  }
}

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    releaseDockPdfFocus();
  }
});

window.addEventListener("pageshow", releaseDockPdfFocus);
window.addEventListener("focus", releaseDockPdfFocus);

// This is the construction image currently used in README.md.
const constructionImageUrl =
  "https://github.com/user-attachments/assets/16be7f66-1b20-4365-990c-2983afdce494";

/**
 * Create the slow ambient neural-network animation.
 */
function initializeNeuralBackground() {
  const context = neuralCanvas.getContext("2d");
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  let width = 0;
  let height = 0;
  let layers = [];
  let animationFrame = 0;
  let previousFrameTime = 0;

  const frameInterval = 1000 / 30;
  const layerSizes = [3, 5, 7, 5, 3, 1];
  const flowDuration = 12500;

  function createModel() {
    const compactLayout = width < 760;
    const panelRectangle = document
      .querySelector(".action-panel")
      .getBoundingClientRect();
    const panelCenterX = panelRectangle.left + panelRectangle.width / 2;
    const panelCenterY = panelRectangle.top + panelRectangle.height / 2;
    const desiredHalfWidth = compactLayout ? width * 0.27 : width * 0.2;
    const availableHalfWidth = Math.min(
      panelCenterX - width * (compactLayout ? 0.42 : 0.5),
      width * 0.97 - panelCenterX
    );
    const modelHalfWidth = Math.max(
      width * 0.16,
      Math.min(desiredHalfWidth, availableHalfWidth)
    );
    const modelTop = Math.max(
      height * 0.14,
      panelCenterY - Math.max(panelRectangle.height * 0.95, height * 0.28)
    );
    const modelBottom = Math.min(
      height * 0.9,
      panelCenterY + Math.max(panelRectangle.height * 0.95, height * 0.28)
    );
    const modelHeight = modelBottom - modelTop;
    const layerStep = (modelHalfWidth * 2) / (layerSizes.length - 1);

    layers = layerSizes.map((layerSize, layerIndex) => {
      const visibleLayerSize = compactLayout
        ? Math.max(1, layerSize - 2)
        : layerSize;

      return Array.from({ length: visibleLayerSize }, (_, nodeIndex) => {
        const y =
          layerIndex === layerSizes.length - 1
            ? Math.min(height * 0.88, panelRectangle.bottom + 54)
            : visibleLayerSize === 1
            ? panelCenterY
            : modelTop + (nodeIndex / (visibleLayerSize - 1)) * modelHeight;

        return {
          x: panelCenterX - modelHalfWidth + layerIndex * layerStep,
          y,
          radius: layerIndex === layerSizes.length - 1 ? 5 : 3.2
        };
      });
    });
  }

  function resizeCanvas() {
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

    width = window.innerWidth;
    height = window.innerHeight;

    neuralCanvas.width = Math.round(width * pixelRatio);
    neuralCanvas.height = Math.round(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    createModel();
    drawModel(0);
  }

  function drawConnection(firstNode, secondNode, opacity, lineWidth = 0.65) {
    context.beginPath();
    context.moveTo(firstNode.x, firstNode.y);
    context.lineTo(secondNode.x, secondNode.y);
    context.strokeStyle = `rgba(135, 174, 230, ${opacity})`;
    context.lineWidth = lineWidth;
    context.stroke();
  }

  function drawFlowPulse(firstNode, secondNode, progress, intensity) {
    const x = firstNode.x + (secondNode.x - firstNode.x) * progress;
    const y = firstNode.y + (secondNode.y - firstNode.y) * progress;

    context.beginPath();
    context.arc(x, y, 1.8 + intensity * 1.4, 0, Math.PI * 2);
    context.fillStyle = `rgba(218, 237, 255, ${0.5 + intensity * 0.45})`;
    context.shadowColor = "rgba(91, 164, 255, 0.95)";
    context.shadowBlur = 10 + intensity * 8;
    context.fill();
    context.shadowBlur = 0;
  }

  function drawModel(time) {
    context.clearRect(0, 0, width, height);

    const cycle = reducedMotion ? 0.86 : (time % flowDuration) / flowDuration;
    const segmentCount = layers.length - 1;
    const scaledCycle = cycle * (segmentCount + 0.75);

    layers.slice(0, -1).forEach((layer, layerIndex) => {
      const nextLayer = layers[layerIndex + 1];

      layer.forEach((firstNode) => {
        nextLayer.forEach((secondNode) => {
          drawConnection(firstNode, secondNode, 0.055);
        });
      });
    });

    const activeSegment = Math.min(
      Math.floor(scaledCycle),
      segmentCount - 1
    );
    const segmentProgress = Math.min(scaledCycle - activeSegment, 1);

    if (scaledCycle < segmentCount) {
      const activeLayer = layers[activeSegment];
      const nextLayer = layers[activeSegment + 1];

      activeLayer.forEach((firstNode, firstIndex) => {
        nextLayer.forEach((secondNode, secondIndex) => {
          const selectedPath =
            (firstIndex + secondIndex + activeSegment) % 3 === 0;

          if (!selectedPath) {
            return;
          }

          drawConnection(firstNode, secondNode, 0.16, 1);
          drawFlowPulse(
            firstNode,
            secondNode,
            segmentProgress,
            1 - Math.abs(segmentProgress - 0.5)
          );
        });
      });
    }

    layers.forEach((layer, layerIndex) => {
      const layerActivated = scaledCycle > layerIndex - 0.12;

      layer.forEach((node) => {
        context.beginPath();
        context.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        context.fillStyle = layerActivated
          ? "rgba(218, 235, 255, 0.76)"
          : "rgba(152, 179, 217, 0.32)";
        context.shadowColor = "rgba(105, 168, 255, 0.8)";
        context.shadowBlur = layerActivated ? 11 : 4;
        context.fill();
        context.shadowBlur = 0;
      });
    });

    const outputNode = layers[layers.length - 1][0];
    const predictionActive = scaledCycle >= segmentCount;

    context.font = "600 11px system-ui, sans-serif";
    context.textAlign = "right";
    context.fillStyle = predictionActive
      ? "rgba(226, 240, 255, 0.9)"
      : "rgba(169, 192, 224, 0.42)";
    context.fillText("PREDICTION", outputNode.x - 13, outputNode.y - 12);

    if (predictionActive) {
      const outputPulse = 7 + Math.sin(time * 0.004) * 1.5;

      context.beginPath();
      context.arc(outputNode.x, outputNode.y, outputPulse, 0, Math.PI * 2);
      context.strokeStyle = "rgba(117, 185, 255, 0.7)";
      context.lineWidth = 1;
      context.shadowColor = "rgba(92, 164, 255, 0.9)";
      context.shadowBlur = 14;
      context.stroke();
      context.shadowBlur = 0;
    }
  }

  function animate(time) {
    animationFrame = window.requestAnimationFrame(animate);

    if (time - previousFrameTime < frameInterval) {
      return;
    }

    previousFrameTime = time;
    drawModel(time);
  }

  let resizeTimer;

  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(resizeCanvas, 160);
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      window.cancelAnimationFrame(animationFrame);
    } else if (!reducedMotion) {
      animationFrame = window.requestAnimationFrame(animate);
    }
  });

  resizeCanvas();

  if (!reducedMotion) {
    animationFrame = window.requestAnimationFrame(animate);
  }
}

initializeNeuralBackground();

/**
 * Build one temporary project card.
 *
 * @param {number} projectNumber - Number shown in the project title.
 * @returns {string} HTML for the project card.
 */
function createProjectCard(projectNumber) {
  const tagName = projectNumber === 2 ? "button" : "article";
  const interactiveAttributes = projectNumber === 2
    ? 'type="button" data-project-showcase="data-attribution" aria-label="Open Project 2: Data Attribution"'
    : "";
  const interactiveClass = projectNumber === 2 ? " project-card-button" : "";

  return `
    <${tagName} class="project-card${interactiveClass}" ${interactiveAttributes}>
      <img
        src="${constructionImageUrl}"
        alt="Project ${projectNumber} under construction"
      >
      <h3>Project ${projectNumber}</h3>
    </${tagName}>
  `;
}

/**
 * Display the temporary project gallery.
 */
function showProjects() {
  modalTitle.textContent = "Projects";

  modalContent.innerHTML = `
    <div class="project-grid">
      ${[1, 2, 3].map(createProjectCard).join("")}
    </div>

    <div class="project-grid extra-projects" id="extra-projects" hidden>
      ${[4, 5, 6].map(createProjectCard).join("")}
    </div>

    <button
      class="more-projects-button"
      id="more-projects"
      type="button"
      aria-expanded="false"
      aria-controls="extra-projects"
    >
      More Projects
    </button>
  `;

  const moreProjectsButton = document.querySelector("#more-projects");
  const extraProjects = document.querySelector("#extra-projects");

  moreProjectsButton.addEventListener("click", () => {
    extraProjects.hidden = false;
    moreProjectsButton.setAttribute("aria-expanded", "true");
    moreProjectsButton.hidden = true;

    requestAnimationFrame(() => {
      extraProjects.classList.add("is-visible");
    });
  });
}

/**
 * Display the under-construction content.
 *
 * @param {string} sectionName - Name of the selected section.
 */
function showUnderConstruction(sectionName) {
  modalTitle.textContent = sectionName;

  modalContent.innerHTML = `
    <p class="construction-message">
      This section is currently under construction.
    </p>

    <img
      class="construction-image"
      src="${constructionImageUrl}"
      alt="${sectionName} section under construction"
    >
  `;
}

/** Display the two CV formats. */
function showCvOptions() {
  modalTitle.textContent = "CV";

  modalContent.innerHTML = `
    <div class="option-grid option-grid-two">
      <a class="option-card" href="CV.pdf" target="_blank" rel="noopener">
        <span class="option-icon" aria-hidden="true">PDF</span>
        <span><strong>CV.pdf</strong><small>Open the full curriculum vitae</small></span>
      </a>
      <a class="option-card" href="animation_cv/">
        <span class="option-icon option-icon-play" aria-hidden="true">▶</span>
        <span><strong>Interactive CV</strong><small>Explore the milestones as a branching timeline</small></span>
      </a>
    </div>
  `;
}

/** Display the three Extra placeholders. */
function showExtraOptions() {
  modalTitle.textContent = "Extra";
  modalContent.innerHTML = `
    <div class="option-grid">
      ${[1, 2, 3].map((number) => `
        <article class="option-card option-card-placeholder">
          <span class="option-icon" aria-hidden="true">0${number}</span>
          <span><strong>Extra ${number}</strong><small>Content coming soon</small></span>
        </article>
      `).join("")}
    </div>
  `;
}

/**
 * Open the modal for the selected section.
 *
 * @param {string} view - projects, cv, or extra.
 */
function openModal(view) {
  if (view === "projects") {
    showProjects();
  } else if (view === "cv") {
    showCvOptions();
  } else if (view === "extra") {
    showExtraOptions();
  } else {
    return;
  }

  closeContactPopovers();

  modal.hidden = false;
  document.body.classList.add("modal-open");

  // Wait one frame so the fade-in transition can run.
  requestAnimationFrame(() => {
    modal.classList.add("is-open");
    closeButton.focus();
  });
}

/**
 * Close the modal.
 */
function closeModal() {
  modal.classList.remove("is-open");
  document.body.classList.remove("modal-open");

  // Wait for the closing animation before hiding the modal.
  window.setTimeout(() => {
    modal.hidden = true;
    modalContent.innerHTML = "";
  }, 420);
}

/**
 * Close one anchored contact popover.
 */
function closeContactPopover(trigger, popover) {
  if (popover.hidden) {
    return;
  }

  popover.classList.remove("is-open");
  trigger.setAttribute("aria-expanded", "false");

  window.setTimeout(() => {
    if (!popover.classList.contains("is-open")) {
      popover.hidden = true;
    }
  }, 240);
}

/**
 * Close all anchored contact popovers.
 *
 * @param {HTMLElement|null} exception - Popover that should remain open.
 */
function closeContactPopovers(exception = null) {
  contactMenus.forEach((menu) => {
    const trigger = menu.querySelector("[data-popover-target]");
    const popover = menu.querySelector(".contact-popover");

    if (popover === exception || popover.hidden) {
      return;
    }

    closeContactPopover(trigger, popover);
  });
}

function openContactPopover(trigger, popover) {
  closeContactPopovers(popover);
  popover.hidden = false;
  trigger.setAttribute("aria-expanded", "true");

  requestAnimationFrame(() => {
    popover.classList.add("is-open");
  });
}

// Show contact popovers as soon as their label is hovered or focused.
contactMenus.forEach((menu) => {
  const trigger = menu.querySelector("[data-popover-target]");
  const popover = menu.querySelector(".contact-popover");
  let closeTimer;

  const cancelClose = () => window.clearTimeout(closeTimer);
  const open = () => {
    cancelClose();
    openContactPopover(trigger, popover);
  };
  const closeAfterPointerLeaves = () => {
    cancelClose();
    closeTimer = window.setTimeout(
      () => closeContactPopover(trigger, popover),
      300
    );
  };

  menu.addEventListener("mouseenter", open);
  menu.addEventListener("mouseleave", closeAfterPointerLeaves);
  menu.addEventListener("focusin", open);
  menu.addEventListener("focusout", (event) => {
    if (!menu.contains(event.relatedTarget)) {
      closeContactPopover(trigger, popover);
    }
  });

  // Keep a click toggle for devices that do not support hover.
  trigger.addEventListener("click", () => {
    if (window.matchMedia("(hover: hover)").matches) {
      open();
      return;
    }

    const isOpen = !popover.hidden && popover.classList.contains("is-open");
    if (isOpen) {
      closeContactPopovers();
    } else {
      open();
    }
  });
});

// Close contact popovers when clicking elsewhere on the page.
document.addEventListener("click", (event) => {
  if (!event.target.closest(".contact-menu")) {
    closeContactPopovers();
  }
});

/** Slide from the welcome scene into the Project 2 prototype. */
function openProjectShowcase(trigger, updateHistory = true) {
  showcaseReturnFocus = trigger?.closest("#content-modal")
    ? document.querySelector('.main-button[data-view="projects"]')
    : trigger;

  if (!modal.hidden) {
    closeModal();
  }

  closeContactPopovers();
  projectShowcase.inert = false;
  projectShowcase.setAttribute("aria-hidden", "false");
  document.body.classList.add("showcase-open");

  if (updateHistory && window.location.pathname !== projectShowcasePath) {
    window.history.pushState(
      { projectShowcase: true, openedFromPortfolio: true },
      "",
      projectShowcasePath
    );
  }

  requestAnimationFrame(() => {
    projectShowcase.classList.add("is-open");
    document.documentElement.classList.remove("direct-project-load");
  });
}

/** Slide back to the welcome scene. */
function closeProjectShowcase(updateHistory = true) {
  projectShowcase.classList.remove("is-open");
  document.body.classList.remove("showcase-open");
  projectShowcase.setAttribute("aria-hidden", "true");

  if (updateHistory && window.location.pathname === projectShowcasePath) {
    if (window.history.state?.openedFromPortfolio) {
      window.history.back();
    } else {
      window.history.replaceState({}, "", "/");
    }
  }

  window.setTimeout(() => {
    projectShowcase.inert = true;
    if (showcaseReturnFocus) {
      showcaseReturnFocus.focus();
    }
  }, 620);
}

document.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-project-showcase]");

  if (!trigger) {
    return;
  }

  openProjectShowcase(event.detail === 0 ? trigger : null);
});

// Keep the visible scene synchronized with browser Back/Forward navigation.
window.addEventListener("popstate", () => {
  if (window.location.pathname === projectShowcasePath) {
    openProjectShowcase(null, false);
  } else if (projectShowcase.classList.contains("is-open")) {
    closeProjectShowcase(false);
  }
});

// The small static route page redirects here with this query parameter so a
// direct visit to /data_attribution works on GitHub Pages as well.
const projectFromDirectRoute =
  new URLSearchParams(window.location.search).get("project") === "data-attribution";

if (window.location.pathname === projectShowcasePath || projectFromDirectRoute) {
  window.history.replaceState({ projectShowcase: true }, "", projectShowcasePath);
  openProjectShowcase(null, false);
}

// Open the correct content when a main button is clicked.
menuButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const selectedView = button.dataset.view;
    openModal(selectedView);
  });
});

// Close using the X button.
closeButton.addEventListener("click", closeModal);

// Close when clicking the dark area outside the modal window.
modal.addEventListener("click", (event) => {
  if (event.target === modal) {
    closeModal();
  }
});

// Close when pressing Escape.
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    const openTrigger = document.querySelector(
      '[data-popover-target][aria-expanded="true"]'
    );

    if (projectShowcase.classList.contains("is-open")) {
      closeProjectShowcase();
    } else if (openTrigger) {
      closeContactPopovers();
      openTrigger.focus();
    } else if (!modal.hidden) {
      closeModal();
    }
  }
});
