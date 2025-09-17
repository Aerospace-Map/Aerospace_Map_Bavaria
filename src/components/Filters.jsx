import { useMemo } from "react";
import { useStore } from "../store";

export default function Filters({ data }) {
  const { filters, setFilters } = useStore();
  const allTags = useMemo(() => {
    const s = new Set();
    data.forEach((c) => c.tags?.forEach((t) => s.add(t)));
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [data]);

  return (
    <aside className="card sticky" style={{ height: "fit-content" }}>
      <div className="grid" style={{ gap: 12 }}>
        <div>
          <label className="muted">Search</label>
          <input
            className="input"
            placeholder="Name, address, description…"
            value={filters.q}
            onChange={(e) => setFilters({ q: e.target.value })}
          />
        </div>
        <div>
          <label className="muted">Website</label>
          <div className="toolbar">
            {[
              { label: "Any", val: null },
              { label: "Has website", val: true },
              { label: "No website", val: false },
            ].map((opt) => (
              <button
                key={String(opt.val)}
                className={`button ${
                  filters.hasWebsite === opt.val ? "primary" : ""
                }`}
                onClick={() => setFilters({ hasWebsite: opt.val })}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="muted">Tags</label>
          <div className="toolbar" style={{ flexWrap: "wrap" }}>
            {allTags.map((t) => {
              const active = filters.tags.includes(t);
              return (
                <button
                  key={t}
                  className={`button ${active ? "primary" : ""}`}
                  onClick={() =>
                    setFilters({
                      tags: active
                        ? filters.tags.filter((x) => x !== t)
                        : [...filters.tags, t],
                    })
                  }
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}
