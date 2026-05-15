/**
 * API root (must end with /). Used by axios as `${APIEndPoint}Director/...`.
 *
 * 404 on POST …/Director/GetGradeDistribution: the IIS app at this URL is still
 * running an old build without that action. Publish Backend/FinalBackend here,
 * or paste Snippets/GetGradeDistribution_PASTE_INTO_FYP2_DirectorController.txt
 * into your legacy FYP2 DirectorController and redeploy.
 *
 * Override without editing this file: create `.env.development.local` (or `.env`)
 * in the project root (next to package.json) with e.g.
 *   VITE_API_BASE=http://localhost:44313/api/
 * (use the base URL of the site where the NEW FinalBackend is deployed.)
 */
const raw = import.meta.env?.VITE_API_BASE;
const fallback = "http://127.0.0.1/FYP2/api/";
const ApiEndPoint = (typeof raw === "string" && raw.trim() !== "" ? raw.trim() : fallback).replace(/\/?$/, "/");
export default ApiEndPoint;
