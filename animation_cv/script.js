const periods = document.querySelectorAll(".period");

function setPeriodOpen(period, open) {
  period.classList.toggle("is-open", open);
  period.querySelector(".period-trigger").setAttribute("aria-expanded", String(open));
}

periods.forEach((period) => {
  const trigger = period.querySelector(".period-trigger");
  const branchList = period.querySelector(".branches");
  const branchItems = branchList.querySelectorAll("li");
  branchList.style.setProperty("--branch-count", branchItems.length);
  branchItems.forEach((branch, index) => branch.style.setProperty("--index", index));
  trigger.addEventListener("click", () => {
    const willOpen = !period.classList.contains("is-open");
    setPeriodOpen(period, willOpen);
  });
});

// As one chapter opens, it pushes the next node down so the graph unfolds in
// sequence instead of revealing every branch at the same time.
if ("IntersectionObserver" in window) {
  let nextPeriodIndex = 0;
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      setPeriodOpen(entry.target.closest(".period"), true);
      observer.unobserve(entry.target);

      nextPeriodIndex += 1;
      window.setTimeout(() => {
        const nextTrigger = periods[nextPeriodIndex]?.querySelector(".period-trigger");
        if (nextTrigger) observer.observe(nextTrigger);
      }, 700);
    });
  }, { rootMargin: "0px 0px -28% 0px", threshold: 0.45 });

  const startScrollReveal = () => {
    revealObserver.observe(periods[0].querySelector(".period-trigger"));
  };

  window.addEventListener("scroll", startScrollReveal, {
    once: true,
    passive: true
  });
}

document.querySelector("#current-year").textContent = new Date().getFullYear();
