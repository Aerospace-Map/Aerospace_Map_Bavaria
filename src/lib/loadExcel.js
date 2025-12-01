// src/lib/loadexcel.js (or wherever this file lives)
import * as XLSX from "xlsx";
import { normalizeRow } from "../utils";

// -------- helpers --------
const norm = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[\s_]+/g, " ")
    .trim();

const CANON = {
  company_name: ["company name", "company_name", "name"],
  company_address: ["company address", "company_address", "address"],
  company_web: ["company website", "company_website", "website", "web"],
  description: ["description", "desc"],
  latitude: ["latitude", "lat"],
  longitude: ["longitude", "lng", "lon"],
  domain: ["domain"],
  type_of_stakeholder: ["type of stakeholder", "type_of_stakeholder"],
  stakeholder: ["Stakeholder"], // ← your field
  federal_states: ["federal states", "federal state", "state", "bundesland"],
  munich_aerospace: ["munich aerospace", "munich_aerospace"],
  comments: ["comments", "comment", "notes", "note"],
  hardware_software: [
    "hardware/software",
    "hardware / software",
    "hardwaresoftware",
  ],
  support_services: [
    "aerospace support & enabling services",
    "support & enabling services",
    "support services",
  ],
  applications_end_users: [
    "aerospace applications & end-users",
    "applications & end-users",
    "applications",
  ],
  research_education: ["research & education", "research", "education"],
  gov_clusters_assoc: [
    "government, clusters & associations",
    "clusters & associations",
    "associations",
  ],
  manufacturers_developers: [
    "manufacturers & developers",
    "manufacturers",
    "developers",
  ],
};

// Map from our CANON keys to the object keys that the "array path" produces.
// We reuse these so normalizeRow sees a consistent shape regardless of path.
const OUTPUT_KEYS = {
  company_name: "Company_Name",
  company_address: "Company_Address",
  company_web: "Company_Website",
  description: "Description",
  latitude: "Latitude",
  longitude: "Longitude",
  domain: "Domain",
  type_of_stakeholder: "Type_of_Stakeholder",
  stakeholder: "Stakeholder, stakeholder", // ← ensure this is always present
  federal_states: "Federal States",
  munich_aerospace: "Munich Aerospace",
  comments: "Comments",
  hardware_software: "Hardware/Software",
  support_services: "Aerospace Support & Enabling Services",
  applications_end_users: "Aerospace Applications & End-Users",
  research_education: "Research & Education",
  gov_clusters_assoc: "Government, Clusters & Associations",
  manufacturers_developers: "Manufacturers & Developers",
};

// Given an object row (fast path), canonicalize its keys to OUTPUT_KEYS
function canonicalizeObjectRow(obj) {
  const out = {};
  // Build a lookup from normalized original key -> original key
  const byNorm = {};
  for (const k of Object.keys(obj)) {
    byNorm[norm(k)] = k;
  }
  // For every canonical key, if any of its variants exist in the row,
  // copy over to the standardized OUTPUT_KEYS name.
  for (const [canonKey, variants] of Object.entries(CANON)) {
    for (const v of variants) {
      if (byNorm[v] !== undefined) {
        const originalKey = byNorm[v];
        out[OUTPUT_KEYS[canonKey]] = obj[originalKey];
        break;
      }
    }
  }
  // Also copy any already-standard keys if they exist with exact names
  for (const [canonKey, outKey] of Object.entries(OUTPUT_KEYS)) {
    const nk = norm(outKey);
    if (byNorm[nk] !== undefined && out[outKey] === undefined) {
      out[outKey] = obj[byNorm[nk]];
    }
  }
  return out;
}

function findHeaderMap(rows) {
  const maxScan = Math.min(rows.length, 30);
  for (let i = 0; i < maxScan; i++) {
    const row = rows[i];
    if (!row || !row.length) continue;
    const colMap = {};
    for (let c = 0; c < row.length; c++) {
      const label = norm(row[c]);
      if (!label) continue;
      for (const [key, variants] of Object.entries(CANON)) {
        if (variants.includes(label)) colMap[key] = c;
      }
      // also match exact originals
      if (label === "company_name") colMap.company_name = c;
      if (label === "company_address") colMap.company_address = c;
      if (label === "company_website") colMap.company_web = c;
      if (label === "federal states") colMap.federal_states = c;
      if (label === "type_of_stakeholder") colMap.type_of_stakeholder = c;
      if (label === "munich aerospace") colMap.munich_aerospace = c;
      if (label === "hardware/software") colMap.hardware_software = c;
      if (label === "aerospace support & enabling services")
        colMap.support_services = c;
      if (label === "aerospace applications & end-users")
        colMap.applications_end_users = c;
      if (label === "research & education") colMap.research_education = c;
      if (label === "government, clusters & associations")
        colMap.gov_clusters_assoc = c;
      if (label === "manufacturers & developers")
        colMap.manufacturers_developers = c;
      if (label === "Stakeholder") colMap.stakeholder = c; // explicit
    }
    const core = ["company_name", "latitude", "longitude"];
    if (core.every((k) => colMap[k] !== undefined)) {
      return { headerRowIndex: i, colMap };
    }
  }
  return null;
}

async function fetchBuffer(url) {
  const sep = url.includes("?") ? "&" : "?";
  const busted = `${url}${sep}v=${Date.now()}`;
  const res = await fetch(busted, { cache: "no-store" });
  if (!res.ok) throw new Error(`Fetch failed: ${url} (${res.status})`);
  return res.arrayBuffer();
}

function parseBuffer(buf) {
  const wb = XLSX.read(buf);

  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    if (!sheet) continue;

    // ---------- A) FAST PATH: headers already present as object keys ----------
    const objRows = XLSX.utils.sheet_to_json(sheet);
    if (objRows && objRows.length) {
      // Canonicalize each object row to the same output shape as the array path
      const canonRows = objRows.map(canonicalizeObjectRow);

      // Filter empty and normalize
      const nonEmpty = canonRows.filter((o) =>
        Object.values(o).some(
          (v) => v !== undefined && v !== null && String(v).trim?.() !== ""
        )
      );
      const companies = nonEmpty.map((r, i) => normalizeRow(r, i));
      if (companies.length) return companies;
    }

    // ---------- B) ARRAY PATH: detect a header row and manual mapping ----------
    const rows = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      blankrows: false,
    });
    if (!rows || !rows.length) continue;
    const headerInfo = findHeaderMap(rows);
    if (!headerInfo) continue;

    const { headerRowIndex, colMap } = headerInfo;
    const dataRows = rows.slice(headerRowIndex + 1);
    if (!dataRows.length) continue;

    const objects = dataRows.map((arr) => {
      const get = (k) => (colMap[k] === undefined ? undefined : arr[colMap[k]]);
      return {
        [OUTPUT_KEYS.company_name]: get("company_name"),
        [OUTPUT_KEYS.company_address]: get("company_address"),
        [OUTPUT_KEYS.company_web]: get("company_web"),
        [OUTPUT_KEYS.description]: get("description"),
        [OUTPUT_KEYS.latitude]: get("latitude"),
        [OUTPUT_KEYS.longitude]: get("longitude"),
        [OUTPUT_KEYS.domain]: get("domain"),
        [OUTPUT_KEYS.type_of_stakeholder]: get("type_of_stakeholder"),
        [OUTPUT_KEYS.stakeholder]: get("Stakeholder"), // ← keeps Stakeholder
        [OUTPUT_KEYS.federal_states]: get("federal_states"),
        [OUTPUT_KEYS.munich_aerospace]: get("munich_aerospace"),
        [OUTPUT_KEYS.comments]: get("comments"),
        [OUTPUT_KEYS.hardware_software]: get("hardware_software"),
        [OUTPUT_KEYS.support_services]: get("support_services"),
        [OUTPUT_KEYS.applications_end_users]: get("applications_end_users"),
        [OUTPUT_KEYS.research_education]: get("research_education"),
        [OUTPUT_KEYS.gov_clusters_assoc]: get("gov_clusters_assoc"),
        [OUTPUT_KEYS.manufacturers_developers]: get("manufacturers_developers"),
      };
    });

    const nonEmpty = objects.filter((o) =>
      Object.values(o).some(
        (v) => v !== undefined && v !== null && String(v).trim?.() !== ""
      )
    );
    const companies = nonEmpty.map((r, i) => normalizeRow(r, i));
    if (companies.length) return companies;
  }

  throw new Error("Could not find a sheet with recognizable headers.");
}

// -------- main entry --------
export async function loadExcelFromPublic() {
  const tried = [];
  try {
    tried.push("/companies2.xlsx");
    const buf = await fetchBuffer("/companies2.xlsx");
    return parseBuffer(buf);
  } catch {}

  try {
    tried.push("/companies.xlsx");
    const buf = await fetchBuffer("/companies.xlsx");
    return parseBuffer(buf);
  } catch {}

  try {
    const assetUrl = new URL(
      "../assets/companies2.xlsx",
      import.meta.url
    ).toString();
    tried.push(assetUrl);
    const buf = await fetchBuffer(assetUrl);
    return parseBuffer(buf);
  } catch (e) {
    throw new Error(`Unable to load Excel. Tried: ${tried.join(" , ")}`);
  }
}
