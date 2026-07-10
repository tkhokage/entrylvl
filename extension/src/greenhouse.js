// Greenhouse application forms (boards.greenhouse.io, embedded #grnhse_app).
window.__beaconFill = async function () {
  const p = await Beacon.getProfile();
  if (!p) {
    Beacon.toast("Beacon: no saved profile. Open the extension to add one.");
    return 0;
  }
  const n = Beacon.fillMappings(Beacon.standardMappings(p));
  Beacon.toast(
    n > 0
      ? `Beacon filled ${n} field${n === 1 ? "" : "s"}. Review and submit.`
      : "Beacon: no matching fields found on this page yet."
  );
  return n;
};
