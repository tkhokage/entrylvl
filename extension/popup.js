const $ = (id) => document.getElementById(id);
const statusEl = $("status");

function setStatus(msg, ok) {
  statusEl.textContent = msg;
  statusEl.className = "status" + (ok ? " ok" : "");
}

// Load any saved profile into the editor.
chrome.storage.local.get("beaconProfile").then(({ beaconProfile }) => {
  if (beaconProfile) $("profile").value = JSON.stringify(beaconProfile, null, 2);
});

$("save").addEventListener("click", async () => {
  try {
    const profile = JSON.parse($("profile").value);
    await chrome.storage.local.set({ beaconProfile: profile });
    setStatus("Saved. You can now fill applications.", true);
  } catch {
    setStatus("That isn't valid JSON. Paste the profile from Beacon.", false);
  }
});

$("fill").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  chrome.tabs.sendMessage(tab.id, { type: "BEACON_FILL" }, (res) => {
    if (chrome.runtime.lastError) {
      setStatus(
        "Open a Greenhouse, Lever or Ashby application page first.",
        false
      );
      return;
    }
    const n = res?.filled ?? 0;
    setStatus(
      n > 0 ? `Filled ${n} field(s). Review and submit.` : "No fields matched here.",
      n > 0
    );
  });
});
