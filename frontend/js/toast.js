const container = document.getElementById("toast-container");

/**
 * Shows a small transient notification. variant controls the accent
 * border color; see components.css .toast[data-variant].
 */
export function showToast(message, variant = "info", duration = 4000) {
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.setAttribute("data-variant", variant);
  toast.setAttribute("role", "status");
  toast.textContent = message;

  container.appendChild(toast);

  const remove = () => {
    toast.classList.add("is-leaving");
    toast.addEventListener("animationend", () => toast.remove(), { once: true });
  };

  setTimeout(remove, duration);
  toast.addEventListener("click", remove);
}
