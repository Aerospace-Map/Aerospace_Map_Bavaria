// src/store.js
import { create } from "zustand"
import * as XLSX from "xlsx"

// File must live in /public; override with VITE_DATA_FILE if you rename it
const FILE_PATH = import.meta.env.VITE_DATA_FILE || "/companies1.xlsx"

/* helpers */
const toId = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/(^-|-$)/g, "") || null

const toNum = (v) => {
  if (v === null || v === undefined || v === "") return undefined
  const n = parseFloat(String(v).replace(",", "."))
  return Number.isFinite(n) ? n : undefined
}

const splitList = (s) =>
  String(s || "")
    .split(/[,;]\s*/)
    .map((t) => t.trim())
    .filter(Boolean)

export const useStore = create((set, get) => ({
  data: [],
  status: "idle",
  error: null,
  lastSheet: null,

  load: async () => {
    if (get().status === "loading") return
    set({ status: "loading", error: null })
    try {
      const res = await fetch(`${FILE_PATH}?t=${Date.now()}`) // cache-bust
      if (!res.ok) throw new Error(`Failed to fetch ${FILE_PATH} (${res.status})`)

      const buf = await res.arrayBuffer()
      const wb = XLSX.read(buf, { type: "array" })
      if (!wb?.SheetNames?.length) throw new Error("No sheets in workbook")

      // pick first non-empty sheet, else first
      const sheetName =
        wb.SheetNames.find((n) => {
          const ws = wb.Sheets[n]
          const ref = ws && ws["!ref"]
          if (!ref) return false
          const r = XLSX.utils.decode_range(ref)
          return r.e.r > 0 || r.e.c > 0
        }) || wb.SheetNames[0]

      const ws = wb.Sheets[sheetName]
      const rows = XLSX.utils.sheet_to_json(ws, { defval: "" })

      const mapped = rows
        .map((row, idx) => {
          const name = row["Company_Name"] || row["Stakeholder"] || ""
          if (!String(name).trim()) return null

          const c = {
            id: String(row["ID"] || row["Id"] || row["id"] || toId(name) || `id-${idx}`),
            name,
            typeOfStakeholder: row["Type_of_Stakeholder"] || "",
            address: row["Company_Address"] || "",
            website: row["Company_Website"] || "",
            domain: row["Domain"] || "",
            federalState: row["Federal States"] || "",
            description: row["Description"] || "",
            lat: toNum(row["Latitude"]),
            lng: toNum(row["Longitude"]),

            // Structured category arrays (split on comma/semicolon)
            cat_support: splitList(row["Aerospace Support & Enabling Services"]),
            cat_applications: splitList(row["Aerospace Applications & End-Users"]),
            cat_manufacturers: splitList(
              row["Manufacturers & Developers"] || row["Manufacturers/Developers"]
            ),
            cat_research: splitList(row["Research & Education"]),
            cat_government: splitList(row["Government, Clusters & Associations"]),
            cat_hw_sw: splitList(row["Hardware/Software"]), // ["Hardware"] or ["Software"]
          }

          return c
        })
        .filter(Boolean)

      console.log(`✅ Loaded ${mapped.length} rows from "${sheetName}"`)
      set({ data: mapped, status: "ready", lastSheet: sheetName })
    } catch (e) {
      console.error(e)
      set({ status: "error", error: String(e?.message || e), data: [] })
    }
  },

  reload: () => get().load(),
}))

// auto-load once
useStore.getState().load()
