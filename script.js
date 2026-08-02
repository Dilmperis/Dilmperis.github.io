// Find the elements that JavaScript needs.
const modal = document.querySelector("#content-modal");
const modalTitle = document.querySelector("#modal-title");
const modalContent = document.querySelector("#modal-content");
const closeButton = document.querySelector("#close-modal");
const menuButtons = document.querySelectorAll("[data-view]");
const contactMenus = document.querySelectorAll(".contact-menu");
const contactTriggers = document.querySelectorAll("[data-popover-target]");
const neuralCanvas = document.querySelector("#neural-background");

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
  const layerPositions = [0.6, 0.67, 0.74, 0.81, 0.88, 0.95];
  const flowDuration = 12500;

  function createModel() {
    const compactLayout = width < 760;
    const headerRectangle = document
      .querySelector(".site-header")
      .getBoundingClientRect();
    const panelRectangle = document
      .querySelector(".action-panel")
      .getBoundingClientRect();
    const top = Math.max(height * 0.15, headerRectangle.bottom + 22);
    const bottom = height * 0.88;
    const upperEnd = Math.max(top + 20, panelRectangle.top - 28);
    const lowerStart = Math.min(bottom - 20, panelRectangle.bottom + 28);

    layers = layerSizes.map((layerSize, layerIndex) => {
      const visibleLayerSize = compactLayout
        ? Math.max(1, layerSize - 2)
        : layerSize;
      const upperCount = compactLayout
        ? visibleLayerSize
        : Math.ceil(visibleLayerSize / 2);
      const lowerCount = compactLayout ? 0 : visibleLayerSize - upperCount;

      return Array.from({ length: visibleLayerSize }, (_, nodeIndex) => {
        let y;

        if (layerIndex === layerSizes.length - 1) {
          y = compactLayout
            ? Math.max(top, panelRectangle.top - 42)
            : lowerStart + (bottom - lowerStart) * 0.62;
        } else if (nodeIndex < upperCount) {
          const upperProgress = (nodeIndex + 1) / (upperCount + 1);
          y = top + (upperEnd - top) * upperProgress;
        } else {
          const lowerIndex = nodeIndex - upperCount;
          const lowerProgress = (lowerIndex + 1) / (lowerCount + 1);
          y = lowerStart + (bottom - lowerStart) * lowerProgress;
        }

        return {
          x: width * layerPositions[layerIndex],
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
  return `
    <article class="project-card">
      <img
        src="${constructionImageUrl}"
        alt="Project ${projectNumber} under construction"
      >
      <h3>Project ${projectNumber}</h3>
    </article>
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

/**
 * Open the modal for the selected section.
 *
 * @param {string} view - projects, cv, or extra.
 */
function openModal(view) {
  if (view === "projects") {
    showProjects();
  } else if (view === "cv") {
    showUnderConstruction("CV");
  } else if (view === "extra") {
    showUnderConstruction("Extra");
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

    popover.classList.remove("is-open");
    trigger.setAttribute("aria-expanded", "false");

    window.setTimeout(() => {
      if (!popover.classList.contains("is-open")) {
        popover.hidden = true;
      }
    }, 240);
  });
}

// Toggle each contact popover without leaving the welcome page.
contactTriggers.forEach((trigger) => {
  trigger.addEventListener("click", () => {
    const popover = document.querySelector(`#${trigger.dataset.popoverTarget}`);
    const wasOpen = !popover.hidden && popover.classList.contains("is-open");

    closeContactPopovers(popover);

    if (wasOpen) {
      popover.classList.remove("is-open");
      trigger.setAttribute("aria-expanded", "false");

      window.setTimeout(() => {
        popover.hidden = true;
      }, 240);
      return;
    }

    popover.hidden = false;
    trigger.setAttribute("aria-expanded", "true");

    requestAnimationFrame(() => {
      popover.classList.add("is-open");
    });
  });
});

// Close contact popovers when clicking elsewhere on the page.
document.addEventListener("click", (event) => {
  if (!event.target.closest(".contact-menu")) {
    closeContactPopovers();
  }
});

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

    if (openTrigger) {
      closeContactPopovers();
      openTrigger.focus();
    } else if (!modal.hidden) {
      closeModal();
    }
  }
});
