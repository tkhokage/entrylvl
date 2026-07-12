"use client";

import { useCallback, useRef, useState } from "react";

type Tab = "upload" | "paste" | "linkedin";

export function ImportPanel({
  onFile,
  onText,
  busy,
  error,
  onBack,
}: {
  onFile: (file: File) => void;
  onText: (text: string) => void;
  busy: boolean;
  error: string | null;
  onBack?: () => void;
}) {
  const [tab, setTab] = useState<Tab>("upload");
  const [dragging, setDragging] = useState(false);
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const f = files?.[0];
      if (f && !busy) onFile(f);
    },
    [onFile, busy]
  );

  const tabs: { id: Tab; label: string }[] = [
    { id: "upload", label: "Upload file" },
    { id: "paste", label: "Paste text" },
    { id: "linkedin", label: "LinkedIn" },
  ];

  return (
    <div className="mx-auto w-full max-w-xl animate-fade-up">
      <div className="mb-6 text-center">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-charcoal">
          Import your resume
        </h1>
        <p className="mt-2 text-[15px] text-taupe">
          We only use it to find your matches. Nothing is stored beyond your
          session.
        </p>
      </div>

      <div className="card p-2">
        {/* Tabs */}
        <div className="mb-2 flex gap-1 rounded-xl bg-cream p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 rounded-lg px-3 py-2 text-[14px] font-medium transition ${
                tab === t.id
                  ? "bg-sand text-charcoal shadow-sm"
                  : "text-taupe hover:text-charcoal"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-3">
          {tab === "upload" && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                handleFiles(e.dataTransfer.files);
              }}
              className={`rounded-2xl border-2 border-dashed p-10 text-center transition duration-300 ease-physical ${
                dragging ? "border-amber bg-amber/[0.06]" : "border-beige bg-cream"
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.docx,.txt,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
                disabled={busy}
              />
              <p className="text-[15px] font-medium text-charcoal">
                {busy ? "Reading your resume…" : "Drop your resume here"}
              </p>
              <p className="mt-1 text-[13px] text-taupe">
                PDF or Word (.docx). We only use it to find your matches.
              </p>
              {!busy && (
                <button
                  type="button"
                  className="btn-primary mt-4"
                  onClick={() => inputRef.current?.click()}
                >
                  Choose a file
                </button>
              )}
            </div>
          )}

          {tab === "paste" && (
            <div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your full resume text here…"
                rows={9}
                disabled={busy}
                className="w-full resize-y rounded-xl border border-beige bg-cream p-3.5 text-[15px] text-charcoal outline-none transition placeholder:text-taupe/70 focus:border-amber"
              />
              <button
                className="btn-primary mt-3 w-full"
                disabled={busy || text.trim().length < 40}
                onClick={() => onText(text.trim())}
              >
                {busy ? "Reading…" : "Find my matches →"}
              </button>
            </div>
          )}

          {tab === "linkedin" && (
            <div>
              <div className="mb-3 rounded-xl border border-beige bg-cream p-3.5 text-[13px] leading-relaxed text-taupe">
                LinkedIn doesn't allow direct imports, so here's the reliable way:
                open your profile → <strong className="text-charcoal">More → Save to PDF</strong>,
                then upload that on the <strong className="text-charcoal">Upload file</strong> tab —
                or just copy your profile text and paste it below.
              </div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your LinkedIn profile text (About, Experience, Skills)…"
                rows={7}
                disabled={busy}
                className="w-full resize-y rounded-xl border border-beige bg-cream p-3.5 text-[15px] text-charcoal outline-none transition placeholder:text-taupe/70 focus:border-amber"
              />
              <button
                className="btn-primary mt-3 w-full"
                disabled={busy || text.trim().length < 40}
                onClick={() => onText(text.trim())}
              >
                {busy ? "Reading…" : "Find my matches →"}
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3.5 text-[14px] text-red-700">
          {error}
        </div>
      )}

      {onBack && !busy && (
        <button
          onClick={onBack}
          className="mx-auto mt-5 block text-[14px] text-taupe transition hover:text-charcoal"
        >
          ← Back
        </button>
      )}
    </div>
  );
}
