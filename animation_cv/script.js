const periods = document.querySelectorAll(".period");

periods.forEach((period) => {
  const trigger = period.querySelector(".period-trigger");
  const branchList = period.querySelector(".branches");
  const branchItems = branchList.querySelectorAll("li");
  branchList.style.setProperty("--branch-count", branchItems.length);
  branchItems.forEach((branch, index) => branch.style.setProperty("--index", index));
  trigger.addEventListener("click", () => {
    const willOpen = !period.classList.contains("is-open");
    period.classList.toggle("is-open", willOpen);
    trigger.setAttribute("aria-expanded", String(willOpen));
  });
});

document.querySelector("#current-year").textContent = new Date().getFullYear();
