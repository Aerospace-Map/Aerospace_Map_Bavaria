// src/components/MultiSelect.jsx
import { useEffect, useMemo, useRef, useState } from "react";

export default function MultiSelect({
  label,
  options,
  value = [],
  onChange,
  soft = false,
  onOpenChange = () => {},
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) {
        setOpen(false);
        onOpenChange(false);
      }
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, [onOpenChange]);

  const toggle = (opt) => {
    const has = value.includes(opt);
    onChange(has ? value.filter((v) => v !== opt) : [...value, opt]);
  };

  // NEW: Do NOT list selected option names in the trigger.
  // Show "All" only when nothing is selected; otherwise hide the text but keep the count bubble.
  const showSummaryText = value.length === 0;
  const summary = showSummaryText ? "All" : "";

  // Optional: stable, sorted options list
  const opts = useMemo(() => [...options], [options]);

  return (
    <div className={`multiselect ${soft ? "multiselect--soft" : ""}`} ref={ref}>
      <button
        className={`button ms-trigger ${soft ? "ms-trigger--soft" : ""}`}
        onClick={() => {
          setOpen((v) => {
            const nv = !v;
            onOpenChange(nv);
            return nv;
          });
        }}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={
          value.length
            ? `${label}. ${value.length} selected.`
            : `${label}. All.`
        }
      >
        <span className="ms-label">{label}</span>
        <span className="ms-right">
          {/* Only render the summary text when nothing is selected */}
          {showSummaryText && <span className="ms-summary">{summary}</span>}
          {value.length > 0 && <span className="ms-count">{value.length}</span>}
          <svg
            className={`ms-caret ${open ? "open" : ""}`}
            width="14"
            height="14"
            viewBox="0 0 24 24"
          >
            <path
              d="M7 10l5 5 5-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        </span>
      </button>

      {open && (
        <div className="multiselect-menu" role="menu">
          <div className="ms-list" role="listbox" aria-multiselectable="true">
            {opts.map((opt) => (
              <label key={opt} className="ms-item">
                <input
                  type="checkbox"
                  checked={value.includes(opt)}
                  onChange={() => toggle(opt)}
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
