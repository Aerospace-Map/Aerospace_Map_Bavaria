import * as XLSX from "xlsx";
import { useStore } from "../store";
import { normalizeRow } from "../utils";

export default function UploadBar() {
  const { data, setData } = useStore();

  const onFile = async (file) => {
    const buf = await file.arrayBuffer();
    const workbook = XLSX.read(buf);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);
    const companies = rows.map((r, i) => normalizeRow(r, i));
    setData(companies);
    localStorage.setItem("aero-data", JSON.stringify(companies));
  };

  const onUpload = (e) => {
    const f = e.target.files?.[0];
    if (f) onFile(f);
  };

  const loadSample = () => {
    const sample = [
      {
        id: "sample-1",
        name: "Munich Aerospace Lab",
        address: "Garching, Germany",
        description: "Research institute",
        website: "https://example.org",
        lat: 48.265,
        lng: 11.671,
        tags: ["Research", "Munich Aerospace"],
      },
      {
        id: "sample-2",
        name: "SkyTech GmbH",
        address: "Munich, Germany",
        description: "Avionics and systems",
        website: "",
        lat: 48.137,
        lng: 11.576,
        tags: ["Aviation", "SME"],
      },
    ];
    setData(sample);
    localStorage.setItem("aero-data", JSON.stringify(sample));
  };

  const restore = () => {
    const raw = localStorage.getItem("aero-data");
    if (raw) setData(JSON.parse(raw));
  };

  const clearAll = () => {
    setData([]);
    localStorage.removeItem("aero-data");
  };

  return (
    <div className="card toolbar" style={{ justifyContent: "space-between" }}>
      <div className="toolbar">
        <label className="button">
          Upload Excel
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={onUpload}
            style={{ display: "none" }}
          />
        </label>
        <button className="button" onClick={loadSample}>
          Load sample
        </button>
        <button className="button" onClick={restore}>
          Restore saved
        </button>
        <button className="button" onClick={clearAll}>
          Clear
        </button>
      </div>
      <div className="toolbar">
        <span className="muted">
          Rows: <strong>{data.length}</strong>
        </span>
      </div>
    </div>
  );
}
