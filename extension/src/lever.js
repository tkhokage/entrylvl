// Lever application forms (jobs.lever.co/{company}/{id}/apply).
window.__beaconFill = async function () {
  const p = await Beacon.getProfile();
  if (!p) {
    Beacon.toast("Beacon: no saved profile. Open the extension to add one.");
    return 0;
  }
  // Lever uses name attributes like "name", "email", "phone", "urls[LinkedIn]".
  const mappings = Beacon.standardMappings(p).concat([
    { keywords: ["urls[linkedin]"], value: p.links?.linkedin },
    { keywords: ["urls[github]"], value: p.links?.github },
    { keywords: ["urls[portfolio]", "urls[other]"], value: p.links?.portfolio },
    { keywords: ["org", "current company"], value: "" },
  ]);
  const n = Beacon.fillMappings(mappings);
  Beacon.toast(
    n > 0
      ? `Beacon filled ${n} field${n === 1 ? "" : "s"}. Review and submit.`
      : "Beacon: no matching fields found on this page yet."
  );
  return n;
};
