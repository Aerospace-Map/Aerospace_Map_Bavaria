export function toId(input) {
  return String(input || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function normalizeRow(row, idx) {
  const name = String(row["Company_Name"] ?? "").trim() || `Company ${idx + 1}`;

  const toNum = (v) => {
    if (v === null || v === undefined || v === "") return undefined;
    if (typeof v === "number") return Number.isNaN(v) ? undefined : v;
    const n = Number(String(v).replace(",", "."));
    return Number.isNaN(n) ? undefined : n;
  };

  const splitMulti = (val) => {
    if (val === null || val === undefined) return [];
    const s = String(val).trim();
    if (!s) return [];
    return s
      .split(/[\n,;/]| \| /) // newline, comma, semicolon, slash, or " | "
      .map((x) => x.trim())
      .filter(Boolean);
  };

  const tagCols = [
    "Domain",
    "Type_of_Stakeholder",
    "Federal States",
    "Hardware/Software",
    "Aerospace Support & Enabling Services",
    "Aerospace Applications & End-Users",
    "Research & Education",
    "Government, Clusters & Associations",
    "Manufacturers & Developers",
  ];
  const tagSet = new Set();
  for (const col of tagCols) splitMulti(row[col]).forEach((t) => tagSet.add(t));

  const ma = row["Munich Aerospace"];
  if (ma !== null && ma !== undefined && String(ma).trim() !== "") {
    tagSet.add(`Munich Aerospace: ${String(ma).trim()}`);
  }

  const tags = Array.from(tagSet).sort((a, b) => a.localeCompare(b));

  // NEW: stakeholders array (keeps legacy string too)
  const stakeholderStr = row["Stakeholder"]
    ? String(row["Stakeholder"]).trim()
    : undefined;
  const stakeholders = splitMulti(stakeholderStr);

  return {
    id: toId(name) || `id-${idx}`,
    name,
    address: row["Company_Address"]
      ? String(row["Company_Address"]).trim()
      : undefined,
    description: row["Description"]
      ? String(row["Description"]).trim()
      : undefined,
    website: row["Company_Website"]
      ? String(row["Company_Website"]).trim()
      : undefined,
    lat: toNum(row["Latitude"]),
    lng: toNum(row["Longitude"]),
    tags,

    // Stakeholder: keep old string + new array
    stakeholder: stakeholderStr, // legacy string for any old code
    stakeholders, // preferred array for UI

    typeOfStakeholder: row["Type_of_Stakeholder"]
      ? String(row["Type_of_Stakeholder"]).trim()
      : undefined,
    federalState: row["Federal States"]
      ? String(row["Federal States"]).trim()
      : undefined,
    domain: row["Domain"] ? String(row["Domain"]).trim() : undefined,
    comments: row["Comments"] ? String(row["Comments"]).trim() : undefined,
  };
}
