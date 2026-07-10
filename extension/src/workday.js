// Workday (*.myworkdayjobs.com) — PARTIAL / EXPERIMENTAL.
//
// Workday is the hardest ATS to autofill: it's a heavily virtualized React
// app, many fields live in nested data-automation-id nodes, the flow is
// multi-step behind a required account login, and inputs re-mount as you
// scroll. Beacon fills the obvious top-level contact fields on a best-effort
// basis; expect to complete the rest by hand. Full Workday support is tracked
// for later — see extension/README.md.
window.__beaconFill = async function () {
  const p = await Beacon.getProfile();
  if (!p) {
    Beacon.toast("Beacon: no saved profile. Open the extension to add one.");
    return 0;
  }
  const [first, ...rest] = (p.name || "").split(/\s+/);
  const byAuto = (id) =>
    document.querySelector(`[data-automation-id="${id}"] input, input[data-automation-id="${id}"]`);

  const attempts = [
    [byAuto("legalNameSection_firstName"), first],
    [byAuto("legalNameSection_lastName"), rest.join(" ")],
    [byAuto("email"), p.email],
    [byAuto("phone-number"), p.phone],
  ];
  let n = 0;
  for (const [el, val] of attempts) {
    if (el && Beacon.setValue(el, val)) n++;
  }
  // Fall back to the generic keyword matcher for anything else visible.
  n += Beacon.fillMappings(Beacon.standardMappings(p));
  Beacon.toast(
    `Beacon filled ${n} field${n === 1 ? "" : "s"} (Workday is partial — finish the rest manually).`
  );
  return n;
};
