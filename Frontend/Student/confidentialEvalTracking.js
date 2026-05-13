/** Client-side tracking when CheckIfAlreadyEvaluated API is not used. */

const storageKey = (aridNo) => `BEAD_confidentialEval_done_${String(aridNo ?? "").trim()}`;

export function getConfidentialCompletedCourseNos(aridNo) {
  if (!aridNo) return new Set();
  try {
    const raw = localStorage.getItem(storageKey(aridNo));
    const arr = JSON.parse(raw || "[]");
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.map((c) => String(c).trim()).filter(Boolean));
  } catch {
    return new Set();
  }
}

export function markConfidentialCourseCompleted(aridNo, courseNo) {
  if (!aridNo || !courseNo) return;
  const set = getConfidentialCompletedCourseNos(aridNo);
  set.add(String(courseNo).trim());
  localStorage.setItem(storageKey(aridNo), JSON.stringify([...set]));
}
