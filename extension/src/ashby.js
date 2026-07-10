// Ashby application forms (jobs.ashbyhq.com/{org}/{id}/application).
// Ashby is a React app; fields render dynamically, so we retry briefly.
window.__beaconFill = async function () {
  const p = await Beacon.getProfile();
  if (!p) {
    Beacon.toast("Beacon: no saved profile. Open the extension to add one.");
    return 0;
  }
  let n = 0;
  for (let attempt = 0; attempt < 5 && n === 0; attempt++) {
    n = Beacon.fillMappings(Beacon.standardMappings(p));
    if (n === 0) await new Promise((r) => setTimeout(r, 400));
  }
  Beacon.toast(
    n > 0
      ? `Beacon filled ${n} field${n === 1 ? "" : "s"}. Review and submit.`
      : "Beacon: no matching fields found on this page yet."
  );
  return n;
};
