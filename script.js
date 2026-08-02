// Find the elements that JavaScript needs.
const modal = document.querySelector("#content-modal");
const modalTitle = document.querySelector("#modal-title");
const modalContent = document.querySelector("#modal-content");
const closeButton = document.querySelector("#close-modal");
const menuButtons = document.querySelectorAll("[data-view]");

// This is the construction image currently used in README.md.
const constructionImageUrl =
  "https://github.com/user-attachments/assets/16be7f66-1b20-4365-990c-2983afdce494";

/**
 * Display the list of temporary project buttons.
 */
function showProjects() {
  modalTitle.textContent = "Projects";

  modalContent.innerHTML = `
    <div class="project-list">
      <button class="project-button" type="button">
        Project 1
      </button>

      <button class="project-button" type="button">
        Project 2
      </button>

      <button class="project-button" type="button">
        Project 3
      </button>
    </div>
  `;
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
  }, 180);
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
  if (event.key === "Escape" && !modal.hidden) {
    closeModal();
  }
});