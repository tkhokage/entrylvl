# Beacon Autofill (Chrome extension — Phase 2 scaffold)

A Manifest V3 Chrome extension that fills startup job application forms from your
saved Beacon profile. **You review and submit** — the extension never clicks
submit for you. This is the same model Simplify and Teal use, and it's the only
robust, terms-friendly way to do real autofill: the form lives on the company's
own domain (often behind a login/captcha), so a server can't fill it, but a
content script running in your browser can.

## ATS coverage

| ATS | Status | Notes |
| --- | --- | --- |
| **Greenhouse** | ✅ Supported | `boards.greenhouse.io`, embedded boards. Standard contact + links. |
| **Lever** | ✅ Supported | `jobs.lever.co`. Includes Lever's `urls[...]` link fields. |
| **Ashby** | ✅ Supported | `jobs.ashbyhq.com`. React form; the script retries briefly as fields mount. |
| **Workday** | ⚠️ Partial / experimental | `*.myworkdayjobs.com`. Fills top-level name/email/phone on a best-effort basis only. Workday is heavily virtualized, multi-step, and behind a required account — expect to finish most of it by hand. |
| Everything else | ❌ Not supported | Custom/other ATS aren't recognized. Use the web app's application kit (copy-paste) instead — that path always works. |

What it fills where a matching field exists: first/last/full name, email, phone,
location, LinkedIn, GitHub, portfolio, and the first education entry. It only
fills **empty** fields, so it won't clobber anything you've already typed.

## Install (developer / unpacked)

1. `chrome://extensions` → enable **Developer mode**.
2. **Load unpacked** → select this `extension/` folder.
3. Click the Beacon icon, paste your profile JSON (the `ResumeProfile` object the
   web app produces — matches `src/lib/types.ts`), and **Save profile**.
4. Open a Greenhouse / Lever / Ashby application page and click **Fill this
   form** (or it exposes a "Fill" toast on the page). Review everything, then
   submit yourself.

> In phase 2 proper, the web app will push your profile into the extension
> automatically once accounts exist, so you won't paste JSON by hand.

## Files

```
manifest.json      MV3 manifest, host permissions per ATS
popup.html/js      Save profile + trigger fill
src/common.js      Shared field-detection + value-setting (React-safe events)
src/greenhouse.js  Greenhouse filler
src/lever.js       Lever filler
src/ashby.js       Ashby filler (retries as fields mount)
src/workday.js     Workday filler (partial)
```

## Limitations & safety

- **No auto-submit.** Filling only; you always review and click submit.
- **Fills empty fields only** — never overwrites your edits.
- Resume/file **upload** fields can't be auto-attached by a content script
  (browser security) — attach your resume file manually.
- Custom dropdowns, EEO/demographic questions, and multi-step wizards are left
  for you to complete.
