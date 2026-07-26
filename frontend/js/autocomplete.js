// Reusable "type a city, get a live dropdown of real places" behaviour.
// Used on both the dashboard search bar and the full-page map's search
// bar, so the fetch/debounce/keyboard-nav logic only lives in one place.

import { WeatherAPI } from "./api.js";
import { debounce } from "./utils.js";
import { flagEmoji } from "./icons.js";

/**
 * @param {object} opts
 * @param {HTMLInputElement} opts.input      the text field to watch
 * @param {HTMLElement} opts.dropdown        an (initially empty/hidden) <ul> to render into
 * @param {(place: {name:string,state:string,country:string,lat:number,lon:number}) => void} opts.onSelect
 */
export function attachAutocomplete({ input, dropdown, onSelect }) {
  let results = [];
  let activeIndex = -1;
  let currentQuery = "";
  let requestToken = 0;

  function closeDropdown() {
    dropdown.hidden = true;
    dropdown.innerHTML = "";
    activeIndex = -1;
    input.setAttribute("aria-expanded", "false");
  }

  function labelFor(place) {
    return [place.name, place.state, place.country].filter(Boolean).join(", ");
  }

  function renderDropdown() {
    if (!results.length) {
      dropdown.innerHTML = `<li class="suggest-empty">No matching places found.</li>`;
      dropdown.hidden = false;
      input.setAttribute("aria-expanded", "true");
      return;
    }

    dropdown.innerHTML = results
      .map(
        (place, i) => `
        <li class="suggest-item${i === activeIndex ? " is-active" : ""}" role="option" id="suggest-opt-${i}" data-index="${i}">
          <span class="suggest-flag" aria-hidden="true">${flagEmoji(place.country) || "📍"}</span>
          <span class="suggest-text">
            <span class="suggest-name">${place.name}</span>
            <span class="suggest-sub">${[place.state, place.country].filter(Boolean).join(", ")}</span>
          </span>
        </li>`
      )
      .join("");

    dropdown.hidden = false;
    input.setAttribute("aria-expanded", "true");

    dropdown.querySelectorAll(".suggest-item").forEach((li) => {
      li.addEventListener("mousedown", (e) => {
        // mousedown (not click) fires before the input's blur handler closes the list
        e.preventDefault();
        selectByIndex(Number(li.dataset.index));
      });
    });
  }

  function selectByIndex(i) {
    const place = results[i];
    if (!place) return;
    input.value = labelFor(place);
    closeDropdown();
    onSelect(place);
  }

  function setActive(i) {
    if (!results.length) return;
    activeIndex = (i + results.length) % results.length;
    dropdown.querySelectorAll(".suggest-item").forEach((li, idx) => {
      li.classList.toggle("is-active", idx === activeIndex);
    });
    const activeEl = dropdown.querySelector(".suggest-item.is-active");
    if (activeEl) activeEl.scrollIntoView({ block: "nearest" });
    input.setAttribute("aria-activedescendant", `suggest-opt-${activeIndex}`);
  }

  const runSearch = debounce(async (query) => {
    const token = ++requestToken;
    try {
      const data = await WeatherAPI.geocode(query);
      if (token !== requestToken || input.value.trim() !== currentQuery) return; // stale response
      results = data;
      activeIndex = -1;
      renderDropdown();
    } catch {
      // Silently fail — autocomplete is a convenience, not a critical path.
      closeDropdown();
    }
  }, 300);

  input.addEventListener("input", () => {
    const query = input.value.trim();
    currentQuery = query;
    if (query.length < 2) {
      closeDropdown();
      return;
    }
    runSearch(query);
  });

  input.addEventListener("keydown", (e) => {
    if (dropdown.hidden && e.key !== "ArrowDown") return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (dropdown.hidden && results.length) renderDropdown();
      setActive(activeIndex + 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive(activeIndex - 1);
    } else if (e.key === "Enter") {
      if (activeIndex >= 0) {
        e.preventDefault();
        selectByIndex(activeIndex);
      } else {
        closeDropdown();
      }
    } else if (e.key === "Escape") {
      closeDropdown();
    }
  });

  input.addEventListener("blur", () => {
    // Delay so a mousedown-selection on the dropdown can register first.
    setTimeout(closeDropdown, 120);
  });

  document.addEventListener("click", (e) => {
    if (!dropdown.contains(e.target) && e.target !== input) closeDropdown();
  });

  return { close: closeDropdown };
}
