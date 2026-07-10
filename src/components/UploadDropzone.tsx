"use client";

import { useCallback, useRef, useState } from "react";

export function UploadDropzone({
  onFile,
  busy,
}: {
  onFile: (file: File) => void;
  busy: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const f = files?.[0];
      if (f) onFile(f);
    },
    [onFile]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (!busy) handleFiles(e.dataTransfer.files);
      }}
      className={`rounded-2xl border-2 border-dashed p-10 text-center transition ${
        dragging
          ? "border-beacon-500 bg-beacon-50"
          : "border-slate-300 bg-white"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.txt,application/pdf,text/plain"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        disabled={busy}
      />
      <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-beacon-100 text-2xl">
          📄
        </div>
        {busy ? (
          <>
            <p className="font-medium text-slate-800">Reading your resume…</p>
            <p className="text-sm text-slate-500">
              Extracting your profile and matching jobs.
            </p>
          </>
        ) : (
          <>
            <p className="font-medium text-slate-800">
              Drop your resume here, or
            </p>
            <button
              type="button"
              className="btn-primary"
              onClick={() => inputRef.current?.click()}
            >
              Choose a file
            </button>
            <p className="text-xs text-slate-500">
              PDF preferred · .txt also works · max 8&nbsp;MB
            </p>
          </>
        )}
      </div>
    </div>
  );
}
