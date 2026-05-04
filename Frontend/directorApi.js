import axios from "axios";
import APIEndPoint from "./unity.js";

export function apiUrl(path) {
  return `${APIEndPoint}${String(path).replace(/^\//, "")}`;
}

export async function directorGet(path, config = {}) {
  const res = await axios.get(apiUrl(path), config);
  return res.data;
}

export async function directorPost(path, body, config = {}) {
  const res = await axios.post(apiUrl(path), body, config);
  return res.data;
}

export function asArray(data) {
  return Array.isArray(data) ? data : [];
}

/* ——— Gender feedback: fetch + normalize API result ——— */

const coerceNumber = (v) => {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  const n = Number(String(v).replace(/%/g, "").replace(/,/g, "").trim());
  return Number.isNaN(n) ? null : n;
};

const firstDefinedNumber = (obj, keys) => {
  if (!obj || typeof obj !== "object") return null;
  for (const k of keys) {
    if (!Object.prototype.hasOwnProperty.call(obj, k)) continue;
    const n = coerceNumber(obj[k]);
    if (n !== null) return n;
  }
  const lowerMap = new Map(Object.keys(obj).map((key) => [key.toLowerCase(), key]));
  for (const k of keys) {
    const actual = lowerMap.get(k.toLowerCase());
    if (actual == null) continue;
    const n = coerceNumber(obj[actual]);
    if (n !== null) return n;
  }
  return null;
};

const unwrapPayload = (body) => {
  if (body == null) return null;
  if (typeof body !== "object") return null;
  if (Array.isArray(body)) return { __rows: body };
  const topList = body.Items ?? body.items ?? body.List ?? body.list;
  if (Array.isArray(topList)) return { __rows: topList };
  const inner = body.data ?? body.Data ?? body.result ?? body.Result ?? body.payload ?? body.Payload;
  if (Array.isArray(inner)) return { __rows: inner };
  if (inner && typeof inner === "object") return inner;
  return body;
};

const FEMALE_HINTS = [
  "Female", "female", "FemalePercent", "femalePercent", "FemalePercentage", "femalePercentage",
  "FemaleParticipation", "femaleParticipation", "FemaleSatisfaction", "femaleSatisfaction",
  "FemaleScore", "femaleScore", "FemaleRatio", "femaleRatio", "FemalePct", "femalePct",
  "FemaleFeedback", "femaleFeedback", "WomenPercent", "womenPercent", "PctFemale", "pctFemale",
];

const MALE_HINTS = [
  "Male", "male", "MalePercent", "malePercent", "MalePercentage", "malePercentage",
  "MaleParticipation", "maleParticipation", "MaleSatisfaction", "maleSatisfaction",
  "MaleScore", "maleScore", "MaleRatio", "maleRatio", "MalePct", "malePct",
  "MaleFeedback", "maleFeedback", "MenPercent", "menPercent", "PctMale", "pctMale",
];

const OVERALL_HINTS = [
  "Overall", "overall", "OverallScore", "overallScore", "OverallPercent", "overallPercent",
  "OverallSatisfaction", "overallSatisfaction", "OverallRating", "overallRating",
  "Average", "average", "AvgScore", "avgScore", "SatisfactionScore", "satisfactionScore",
  "TotalSatisfaction", "totalSatisfaction",
];

const ROW_VALUE_KEYS = [
  "Percent", "percent", "Percentage", "percentage", "Value", "value", "Score", "score",
  "Ratio", "ratio", "Satisfaction", "satisfaction", "Count", "count",
];

const statsFromRows = (rows) => {
  let female = null;
  let male = null;
  let overall = null;
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const g = String(row.Gender ?? row.gender ?? row.Sex ?? row.sex ?? row.Type ?? row.type ?? "").toUpperCase();
    const n = firstDefinedNumber(row, ROW_VALUE_KEYS);
    if (g === "F" || g === "FEMALE" || g === "W" || g === "WOMEN") female = n ?? female;
    if (g === "M" || g === "MALE" || g === "MEN") male = n ?? male;
    const o = firstDefinedNumber(row, OVERALL_HINTS);
    if (o != null) overall = o;
  }
  if (overall == null && rows[0]) overall = firstDefinedNumber(rows[0], OVERALL_HINTS);
  return { female, male, overall };
};

/**
 * Turn any common API JSON shape into three numeric fields for the UI.
 * @param {unknown} body raw response from GetGenderFeedbackStats
 * @returns {{ female: number|null, male: number|null, overall: number|null }}
 */
export function parseGenderFeedbackResult(body) {
  const raw = unwrapPayload(body);
  if (!raw) return { female: null, male: null, overall: null };
  if (raw.__rows) return statsFromRows(raw.__rows);

  let female = firstDefinedNumber(raw, FEMALE_HINTS);
  let male = firstDefinedNumber(raw, MALE_HINTS);
  let overall = firstDefinedNumber(raw, OVERALL_HINTS);

  const nested = raw.Stats ?? raw.stats ?? raw.Data ?? raw.data ?? raw.Result ?? raw.result;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    if (female == null) female = firstDefinedNumber(nested, FEMALE_HINTS);
    if (male == null) male = firstDefinedNumber(nested, MALE_HINTS);
    if (overall == null) overall = firstDefinedNumber(nested, OVERALL_HINTS);
  }

  if ((female == null || male == null) && Array.isArray(raw.Items ?? raw.items)) {
    const fromItems = statsFromRows(raw.Items ?? raw.items);
    if (female == null) female = fromItems.female;
    if (male == null) male = fromItems.male;
    if (overall == null) overall = fromItems.overall;
  }

  return { female, male, overall };
}

/**
 * Call Director/GetGenderFeedbackStats and return parsed { female, male, overall }.
 * @param {{ session: string, teacherId?: string|number, courseId?: string|number }} args
 */
export async function getGenderFeedbackResult(args) {
  const { session, teacherId, courseId } = args;
  const params = { session };
  if (teacherId != null) {
    params.teacherId = teacherId;
    params.TeacherId = teacherId;
  }
  if (courseId != null) {
    params.courseId = courseId;
    params.CourseId = courseId;
    params.CourseNo = courseId;
  }
  const raw = await directorGet("Director/GetGenderFeedbackStats", { params });
  return parseGenderFeedbackResult(raw);
}

export function formatGenderShare(n) {
  if (n == null) return "—";
  if (n >= 0 && n <= 1) return `${(n * 100).toFixed(1)}%`;
  if (n > 1 && n <= 100) return `${Number(n.toFixed(1))}%`;
  return `${Number(n.toFixed(1))}%`;
}

export function formatGenderOverall(n) {
  if (n == null) return "—";
  if (n === 0) return "0";
  if (n > 0 && n <= 1) return `${(n * 100).toFixed(1)}%`;
  if (n > 1 && n <= 5) return Number(n.toFixed(2)).toString();
  if (n > 5 && n <= 100) return `${Number(n.toFixed(1))}%`;
  return String(n);
}
