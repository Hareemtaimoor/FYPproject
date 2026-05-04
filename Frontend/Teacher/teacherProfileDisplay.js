/**
 * Normalizes logged-in teacher id and API profile shapes (PascalCase / camelCase / nested).
 */

export const readUserFromStorage = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};

export const getStoredTeacherId = () => {
  const u = readUserFromStorage();
  if (u?.userid != null && String(u.userid).trim() !== "") return String(u.userid).trim();
  if (u?.userId != null && String(u.userId).trim() !== "") return String(u.userId).trim();
  if (u?.TeacherID != null && String(u.TeacherID).trim() !== "") return String(u.TeacherID).trim();
  if (u?.Emp_no != null && String(u.Emp_no).trim() !== "") return String(u.Emp_no).trim();
  if (u?.emp_no != null && String(u.emp_no).trim() !== "") return String(u.emp_no).trim();
  return "";
};

const fallbacksFromUser = (u) => ({
  name: u?.userName ?? u?.UserName ?? u?.name ?? u?.Name ?? "",
  designation: u?.designation ?? u?.Designation ?? u?.role ?? u?.Role ?? "",
});

const hasNameLike = (obj) =>
  obj &&
  typeof obj === "object" &&
  !Array.isArray(obj) &&
  (obj.Name != null ||
    obj.name != null ||
    obj.FullName != null ||
    obj.fullName != null ||
    obj.TeacherName != null ||
    obj.teacherName != null);

/** If API wraps profile in a property, peel one level. */
export const unwrapProfilePayload = (raw) => {
  if (raw == null || typeof raw !== "object") return null;
  const candidates = [
    raw.Profile,
    raw.profile,
    raw.TeacherProfile,
    raw.teacherProfile,
    raw.Data,
    raw.data,
    raw.Result,
    raw.result,
  ];
  for (const inner of candidates) {
    if (hasNameLike(inner)) return inner;
  }
  return raw;
};

/**
 * @param {object|null|undefined} apiProfile - body from GetTeacherProfile (or merged object)
 * @param {object} [user] - optional user object; defaults to localStorage `user`
 * @returns {{ name: string, designation: string }}
 */
export const extractTeacherDisplay = (apiProfile, user) => {
  const u = user ?? readUserFromStorage();
  const fb = fallbacksFromUser(u);
  const p = unwrapProfilePayload(apiProfile) || apiProfile;

  if (!p || typeof p !== "object") {
    return {
      name: fb.name.trim() || "—",
      designation: fb.designation.trim() || "—",
    };
  }

  const name =
    p.Name ??
    p.name ??
    p.FullName ??
    p.fullName ??
    p.TeacherName ??
    p.teacherName ??
    p.UserName ??
    p.userName ??
    p.EmployeeName ??
    p.employeeName ??
    fb.name;

  const designation =
    p.Designation ??
    p.designation ??
    p.DesignationName ??
    p.designationName ??
    p.Title ??
    p.title ??
    fb.designation;

  return {
    name: name != null && String(name).trim() !== "" ? String(name).trim() : fb.name.trim() || "—",
    designation:
      designation != null && String(designation).trim() !== ""
        ? String(designation).trim()
        : fb.designation.trim() || "—",
  };
};
