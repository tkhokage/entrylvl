"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const ROLE_FAMILIES = [
  "Scrum Master", "Agile Coach", "SOC Analyst", "Security Analyst",
  "GRC Analyst", "Product Manager", "Associate Product Manager",
  "Data Analyst", "Data Engineer", "Business Analyst", "Software Engineer",
  "Frontend Engineer", "Backend Engineer", "Full Stack Engineer",
  "DevOps Engineer", "Site Reliability Engineer", "Cloud Engineer",
  "Machine Learning Engineer", "UX Designer", "Product Designer",
  "QA Engineer", "Solutions Engineer", "Sales Engineer", "Support Engineer",
  "Marketing Analyst", "Finance Analyst", "IT Analyst", "Recruiter",
  "Operations Associate", "Research Analyst",
];

export function SearchBar({
  onSearch,
  titles,
  busy,
}: {
  onSearch: (query: string) => void;
  titles: string[];
  busy: boolean;
}) {
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const wrapRef = useRef<HTMLDivElement>(null);

  // Suggestions: curated role families + role families seen in current titles.
  const pool = useMemo(() => {
    const set = new Set(ROLE_FAMILIES);
    for (const t of titles) set.add(t.replace(/\bjunior\b|\bassociate\b|\bsenior\b/gi, "").trim());
    return Array.from(set).filter(Boolean);
  }, [titles]);

  const suggestions = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return [];
    return pool
      .filter((s) => s.toLowerCase().includes(q))
      .slice(0, 6);
  }, [value, pool]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function fire(q: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    onSearch(q.trim());
  }

  function onChange(v: string) {
    setValue(v);
    setOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onSearch(v.trim()), 350);
  }

  function pick(s: string) {
    setValue(s);
    setOpen(false);
    fire(s);
  }

  function clear() {
    setValue("");
    setOpen(false);
    fire("");
  }

  return (
    <div ref={wrapRef} className="relative">
      <div
        className={`flex items-center gap-2 rounded-2xl border bg-sand px-4 py-2.5 transition ${
          active ? "border-amber shadow-card" : "border-beige"
        }`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7A7060" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            setActive(true);
            if (value) setOpen(true);
          }}
          onBlur={() => setActive(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setOpen(false);
              fire(value);
            }
          }}
          placeholder="Search by role — try “scrum”, “SOC analyst”, “product”…"
          className="w-full bg-transparent text-[15px] text-charcoal outline-none placeholder:text-taupe/70"
        />
        {busy && <span className="text-[12px] text-taupe">…</span>}
        {value && (
          <button onClick={clear} className="rounded-full p-1 text-taupe transition hover:bg-cream" aria-label="Clear search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-beige bg-cream shadow-card-hover animate-fade-up">
          {suggestions.map((s) => (
            <button
              key={s}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(s);
              }}
              className="block w-full px-4 py-2.5 text-left text-[15px] text-charcoal transition hover:bg-sand"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
