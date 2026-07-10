// Shared helpers for Beacon Autofill content scripts.
// The saved profile lives in chrome.storage.local under "beaconProfile".
// Shape matches the web app's ResumeProfile (see src/lib/types.ts).

const Beacon = {
  async getProfile() {
    const { beaconProfile } = await chrome.storage.local.get("beaconProfile");
    return beaconProfile || null;
  },

  /** Set a value on an input/textarea/select and fire the events React expects. */
  setValue(el, value) {
    if (!el || value == null || value === "") return false;
    const proto =
      el.tagName === "TEXTAREA"
        ? window.HTMLTextAreaElement.prototype
        : window.HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
    if (setter) setter.call(el, value);
    else el.value = value;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    el.dispatchEvent(new Event("blur", { bubbles: true }));
    return true;
  },

  /** Find the first field whose label/name/placeholder matches any keyword. */
  findField(keywords) {
    const inputs = Array.from(
      document.querySelectorAll("input, textarea")
    ).filter((el) => el.type !== "hidden" && el.type !== "file");
    const kw = keywords.map((k) => k.toLowerCase());
    for (const el of inputs) {
      const hay = [
        el.name,
        el.id,
        el.placeholder,
        el.getAttribute("aria-label"),
        Beacon.labelText(el),
        el.autocomplete,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (kw.some((k) => hay.includes(k))) return el;
    }
    return null;
  },

  labelText(el) {
    if (el.id) {
      const lab = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
      if (lab) return lab.textContent || "";
    }
    const wrap = el.closest("label");
    return wrap ? wrap.textContent || "" : "";
  },

  /** Fill a set of {keywords, value} mappings; returns count filled. */
  fillMappings(mappings) {
    let filled = 0;
    for (const m of mappings) {
      if (!m.value) continue;
      const el = Beacon.findField(m.keywords);
      if (el && !el.value && Beacon.setValue(el, m.value)) filled++;
    }
    return filled;
  },

  /** Standard field mappings derived from a Beacon profile. */
  standardMappings(p) {
    const [first, ...rest] = (p.name || "").split(/\s+/);
    return [
      { keywords: ["first name", "firstname", "given"], value: first || "" },
      { keywords: ["last name", "lastname", "surname", "family"], value: rest.join(" ") },
      { keywords: ["full name", "your name", "name"], value: p.name },
      { keywords: ["email", "e-mail"], value: p.email },
      { keywords: ["phone", "mobile", "tel"], value: p.phone },
      { keywords: ["location", "city", "address"], value: p.location },
      { keywords: ["linkedin"], value: p.links?.linkedin },
      { keywords: ["github"], value: p.links?.github },
      { keywords: ["portfolio", "website", "personal site"], value: p.links?.portfolio },
      { keywords: ["school", "university", "college"], value: p.education?.[0]?.school },
      { keywords: ["degree"], value: p.education?.[0]?.degree },
    ];
  },

  toast(msg) {
    const el = document.createElement("div");
    el.textContent = msg;
    el.style.cssText =
      "position:fixed;bottom:20px;right:20px;z-index:2147483647;background:#1c5cf5;color:#fff;padding:10px 14px;border-radius:10px;font:14px system-ui;box-shadow:0 6px 20px rgba(0,0,0,.2)";
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2600);
  },
};

// Listen for the popup's "fill now" command.
chrome.runtime?.onMessage?.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "BEACON_FILL" && typeof window.__beaconFill === "function") {
    window.__beaconFill().then((n) => sendResponse({ filled: n }));
    return true; // async
  }
});
