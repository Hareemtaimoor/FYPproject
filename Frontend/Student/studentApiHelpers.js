/** Avoid sending empty query strings — many ASP.NET APIs return 400 for `semester=&discipline=`. */
export function safeTrim(v) {
  if (v == null) return "";
  return String(v).trim();
}

/**
 * Query params for `Student/GetStudentCourses`.
 * Maps common EF / API field names. Uses Session as semester fallback when Semester is blank.
 * Optional `hints` — e.g. from `localStorage.user` if your Login API returns course/semester.
 */
export function getStudentCoursesParams(profile, hints = {}) {
  if (!profile || typeof profile !== "object") return { AridNo: "" };

  const arid = safeTrim(profile.AridNo ?? profile.Reg_no ?? profile.reg_no);
  const semester = safeTrim(
    profile.Semester ?? profile.semester ?? hints.semester ?? hints.Semester
  );
  const session = safeTrim(profile.Session ?? profile.session ?? hints.session ?? hints.Session);
  const discipline = safeTrim(
    profile.Course ??
      profile.Discipline ??
      profile.discipline ??
      profile.Program ??
      profile.program ??
      hints.discipline ??
      hints.course ??
      hints.Course
  );

  const semesterParam = semester || session;

  const params = { AridNo: arid };
  if (semesterParam) params.semester = semesterParam;
  if (discipline) params.discipline = discipline;
  if (session && session !== semesterParam) params.session = session;

  return params;
}

/** Read optional course hints saved at login (only if your API adds these fields to `user`). */
export function readLoginCourseHints() {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return {};
    const u = JSON.parse(raw);
    return {
      semester: u?.semester ?? u?.Semester,
      discipline: u?.discipline ?? u?.Discipline ?? u?.course ?? u?.Course ?? u?.program ?? u?.Program,
      session: u?.session ?? u?.Session,
    };
  } catch {
    return {};
  }
}

function unwrapArray(data) {
  if (Array.isArray(data)) return data;
  if (data == null) return [];
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.Data)) return data.Data;
  if (Array.isArray(data.d)) return data.d;
  return [];
}

/** Axios: treat 404 as a normal response (no throw) — many APIs return 404 for "no rows". */
export const axiosOkOr404 = { validateStatus: (s) => s === 200 || s === 404 };

export function dedupeCourseParamAttempts(list) {
  const seen = new Set();
  const out = [];
  for (const p of list) {
    if (!p?.AridNo) continue;
    const k = JSON.stringify(p);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(p);
  }
  return out;
}

/**
 * Try several query shapes until one returns HTTP 200 (Postman may use a different combo).
 * @returns {{ ok: boolean, list: unknown[] }} ok=true only if any attempt returned status 200.
 */
export async function fetchStudentCoursesMulti(axiosInstance, apiPrefix, profileData) {
  const hints = readLoginCourseHints();
  const ar = safeTrim(profileData.AridNo ?? profileData.Reg_no);
  const sem =
    safeTrim(profileData.Semester ?? profileData.Session) || safeTrim(hints.semester);
  const disc =
    safeTrim(profileData.Discipline ?? profileData.Course) || safeTrim(hints.discipline);

  const attempts = dedupeCourseParamAttempts([
    getStudentCoursesParams(profileData, hints),
    ...(sem && disc ? [{ AridNo: ar, semester: sem, discipline: disc }] : []),
    { AridNo: ar },
  ]);

  for (const params of attempts) {
    const res = await axiosInstance.get(`${apiPrefix}Student/GetStudentCourses`, {
      params,
      ...axiosOkOr404,
    });
    if (res.status === 200) {
      return { ok: true, list: unwrapArray(res.data) };
    }
  }
  return { ok: false, list: [] };
}
