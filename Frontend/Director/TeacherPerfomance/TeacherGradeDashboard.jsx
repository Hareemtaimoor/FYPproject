import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import APIEndPoint from "../../unity.js";
import "./TeacherGradeDashboard.css";
import logo from "../../Images/Biit_Logo.png";
import avatar from "../../Images/maleAvatar.png";

const api = (path) => `${APIEndPoint}${String(path).replace(/^\//, "")}`;

const GRADES = ["A", "B", "C", "D"];
const COLOR_PALETTE = ["#FFD700", "#FF8C00", "#AF52DE", "#FF2D55", "#5856D6", "#34C759"];

function unwrapList(data) {
  if (Array.isArray(data)) return data;
  if (data == null) return [];
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.Data)) return data.Data;
  if (Array.isArray(data.d)) return data.d;
  if (Array.isArray(data.results)) return data.results;
  return [];
}

function normalizeSessionValue(entry) {
  if (entry == null) return "";
  if (typeof entry === "string" || typeof entry === "number") return String(entry).trim();
  if (typeof entry === "object") {
    return String(
      entry.Session ??
        entry.session ??
        entry.SessionName ??
        entry.sessionName ??
        entry.Name ??
        entry.name ??
        entry.label ??
        ""
    ).trim();
  }
  return String(entry).trim();
}

function teacherId(t) {
  return String(t.TeacherID ?? t.teacherID ?? t.teacherId ?? t.EmpNo ?? t.empNo ?? "").trim();
}

function teacherName(t) {
  return String(t.TeacherName ?? t.teacherName ?? teacherId(t) ?? "Teacher").trim();
}

function normalizeGradeKey(k) {
  return String(k ?? "")
    .replace(/[_\s-]/g, "")
    .toLowerCase();
}

/**
 * Read A/B/C/D counts from API row regardless of JSON casing (GradeA, gradeA, grade_a, etc.).
 */
function gradeCount(row, letter) {
  if (!row || typeof row !== "object") return 0;
  const L = String(letter).toUpperCase();
  if (!["A", "B", "C", "D"].includes(L)) return 0;
  const want = `grade${L.toLowerCase()}`;
  for (const [k, v] of Object.entries(row)) {
    if (normalizeGradeKey(k) === want) {
      const n = Number(v);
      if (Number.isFinite(n)) return Math.max(0, n);
    }
  }
  return 0;
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const rows = payload.filter((p) => p && p.dataKey != null && p.name != null);
  if (!rows.length) return null;
  return (
    <div className="tgd-chart-tooltip">
      <p className="tgd-chart-tooltip-title">Grade {label}</p>
      {rows.map((p) => (
        <div key={String(p.dataKey)} className="tgd-chart-tooltip-row">
          <span className="tgd-chart-tooltip-dot" style={{ background: p.color }} />
          <span>{p.name}</span>
          <strong>{p.value != null && Number.isFinite(Number(p.value)) ? Number(p.value) : "—"}</strong>
        </div>
      ))}
    </div>
  );
}

const TeacherGradeDashboard = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState("");
  const [teachers, setTeachers] = useState([]);
  const [selectedTeachers, setSelectedTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [gradeData, setGradeData] = useState(null);
  /** Separate flags so session/teachers, common-courses, and grade POST do not clear each other's loading state. */
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingGrade, setLoadingGrade] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const loadingAny = loadingTeachers || loadingCourses || loadingGrade;

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(api("Director/GetAllSessions"));
        const raw = unwrapList(res.data);
        const list = [...new Set(raw.map(normalizeSessionValue).filter(Boolean))];
        setSessions(list);
        if (list.length > 0) {
          setSelectedSession((prev) => (prev && list.includes(prev) ? prev : list[0]));
        }
      } catch {
        window.alert("Could not load sessions.");
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedSession) {
      setTeachers([]);
      setSelectedTeachers([]);
      setCourses([]);
      setSelectedCourses([]);
      setShowResults(false);
      setGradeData(null);
      return;
    }
    /* Clear selection immediately so the common-courses effect never runs with the previous session's teachers. */
    setSelectedTeachers([]);
    setCourses([]);
    setSelectedCourses([]);
    setShowResults(false);
    setGradeData(null);

    let cancelled = false;
    (async () => {
      setLoadingTeachers(true);
      try {
        const res = await axios.get(api(`Director/GetAllocatedTeachers?session=${encodeURIComponent(selectedSession)}`));
        let list = unwrapList(res.data);
        try {
          const ratingRes = await axios.get(
            api(`Director/GetTeacherAverageRatings?session=${encodeURIComponent(selectedSession)}`)
          );
          const ratingsMap = unwrapList(ratingRes.data);
          list = list.map((teacher) => {
            const tid = teacherId(teacher).toUpperCase();
            const ratingObj = ratingsMap.find((r) => {
              const rid = String(r.TeacherID ?? r.teacherID ?? r.teacherId ?? r.EmpNo ?? r.empNo ?? "")
                .trim()
                .toUpperCase();
              return rid !== "" && rid === tid;
            });
            const rawRating = ratingObj?.AverageRating ?? ratingObj?.averageRating;
            return {
              ...teacher,
              AverageRating:
                ratingObj != null && rawRating != null && rawRating !== ""
                  ? Number(rawRating).toFixed(1)
                  : "N/A",
            };
          });
        } catch {
          /* optional */
        }
        if (!cancelled) {
          setTeachers(list);
        }
      } catch {
        if (!cancelled) {
          setTeachers([]);
          window.alert("Could not load teachers.");
        }
      } finally {
        if (!cancelled) setLoadingTeachers(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedSession]);

  const teacherIdsCsv = useMemo(
    () => selectedTeachers.map((t) => teacherId(t)).filter(Boolean).join(","),
    [selectedTeachers]
  );

  useEffect(() => {
    if (selectedTeachers.length === 0 || !selectedSession || !teacherIdsCsv.trim()) {
      setCourses([]);
      setSelectedCourses([]);
      setShowResults(false);
      setGradeData(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingCourses(true);
      try {
        const res = await axios.get(
          api(
            `Director/GetCommonCoursesBySession_Teachers?session=${encodeURIComponent(
              selectedSession
            )}&teacherIds=${encodeURIComponent(teacherIdsCsv)}`
          )
        );
        const raw = unwrapList(res.data);
        const mapped = raw.map((c) => ({
          CourseID: String(c.Course_no ?? c.courseNo ?? c.CourseNo ?? c.CourseID ?? "").trim(),
          CourseName: String(c.Course_desc ?? c.courseName ?? c.CourseName ?? "").trim(),
        })).filter((c) => c.CourseID);
        if (!cancelled) {
          setCourses(mapped);
          setSelectedCourses((prev) => prev.filter((id) => mapped.some((m) => m.CourseID === id)));
          setShowResults(false);
          setGradeData(null);
        }
      } catch {
        if (!cancelled) {
          setCourses([]);
          setSelectedCourses([]);
          setShowResults(false);
          setGradeData(null);
          window.alert("Could not load common courses.");
        }
      } finally {
        if (!cancelled) setLoadingCourses(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedSession, teacherIdsCsv]);

  const toggleTeacher = useCallback((teacher) => {
    const id = teacherId(teacher);
    setSelectedTeachers((prev) => {
      const exists = prev.some((t) => teacherId(t) === id);
      if (exists) return prev.filter((t) => teacherId(t) !== id);
      return [...prev, teacher];
    });
    setShowResults(false);
    setGradeData(null);
  }, []);

  const toggleCourse = useCallback((courseID) => {
    setSelectedCourses((prev) => {
      if (prev.includes(courseID)) return prev.filter((id) => id !== courseID);
      return [...prev, courseID];
    });
    setShowResults(false);
    setGradeData(null);
  }, []);

  const fetchGradeData = async () => {
    if (selectedTeachers.length === 0 || !selectedSession) {
      window.alert("Please select a session and at least one teacher.");
      return;
    }
    if (selectedCourses.length === 0) {
      window.alert("Please select at least one common course.");
      return;
    }
    const teacherIds = [...new Set(selectedTeachers.map((t) => teacherId(t)).filter(Boolean))];
    const courseIds = [...new Set(selectedCourses.map((id) => String(id).trim()).filter(Boolean))];
    if (teacherIds.length === 0) {
      window.alert("Selected teachers are missing valid IDs.");
      return;
    }
    if (courseIds.length === 0) {
      window.alert("Please select at least one common course.");
      return;
    }
    setLoadingGrade(true);
    try {
      const payload = {
        TeacherIds: teacherIds,
        CourseIds: courseIds,
        Session: selectedSession,
        teacherIds,
        courseIds,
        session: selectedSession,
      };
      const res = await axios.post(api("Director/GetGradeDistribution"), payload);
      const rows = unwrapList(res.data);
      if (rows.length > 0) {
        const nameById = new Map(selectedTeachers.map((t) => [teacherId(t), teacherName(t)]).filter(([id]) => id));
        const merged = rows.map((row) => {
          const id = String(row.TeacherID ?? row.teacherID ?? row.teacherId ?? "").trim();
          const fromApi = String(row.TeacherName ?? row.teacherName ?? "").trim();
          const fromPick = nameById.get(id);
          const base =
            fromPick && (!fromApi || fromApi.startsWith("Teacher "))
              ? { ...row, TeacherName: fromPick }
              : { ...row };
          /* Canonical counts so chart + tooltips never miss a field after casing changes. */
          return {
            ...base,
            gradeA: gradeCount(base, "A"),
            gradeB: gradeCount(base, "B"),
            gradeC: gradeCount(base, "C"),
            gradeD: gradeCount(base, "D"),
          };
        });
        setGradeData(merged);
        setShowResults(true);
      } else {
        window.alert("No data returned for the selected criteria.");
        setShowResults(false);
        setGradeData(null);
      }
    } catch (err) {
      const msg =
        err?.response?.data?.Message ||
        err?.response?.data?.ExceptionMessage ||
        (typeof err?.response?.data === "string" ? err.response.data : null) ||
        err?.message ||
        "Unknown error";
      window.alert(`Could not fetch grade distribution: ${typeof msg === "string" ? msg : JSON.stringify(msg)}`);
      setShowResults(false);
      setGradeData(null);
    } finally {
      setLoadingGrade(false);
    }
  };

  const chartRows = useMemo(() => {
    if (!gradeData?.length) return [];
    return GRADES.map((g) => {
      const row = { grade: g };
      gradeData.forEach((t, i) => {
        row[`s${i}`] = gradeCount(t, g);
      });
      return row;
    });
  }, [gradeData]);

  const selectedCourseLabels = useMemo(
    () =>
      courses
        .filter((c) => selectedCourses.includes(c.CourseID))
        .map((c) => c.CourseName || c.CourseID)
        .join(", "),
    [courses, selectedCourses]
  );

  const barSeries = useMemo(() => {
    if (!gradeData?.length) return [];
    return gradeData.map((t, i) => ({
      key: `s${i}`,
      name: String(t.TeacherName ?? t.teacherName ?? teacherName(t) ?? `Teacher ${i + 1}`),
      fill: COLOR_PALETTE[i % COLOR_PALETTE.length],
    }));
  }, [gradeData]);

  const yAxisMax = useMemo(() => {
    if (!chartRows.length || !gradeData?.length) return 8;
    let m = 0;
    for (const r of chartRows) {
      for (let i = 0; i < gradeData.length; i++) {
        const v = Number(r[`s${i}`]);
        if (Number.isFinite(v)) m = Math.max(m, v);
      }
    }
    return Math.max(4, m + Math.max(1, Math.ceil(m * 0.15)));
  }, [chartRows, gradeData]);

  return (
    <div className="tgd-page">
      <div className="tgd-shell">
        <header className="tgd-header">
          <div className="tgd-logo-wrap">
            <img src={logo} alt="BIIT" className="tgd-logo" />
          </div>
          <div className="tgd-profile-card">
            <div className="tgd-profile-text">
              <p>
                Name: <strong>Dr. Jamil Sawar</strong>
              </p>
              <p>
                Role: <strong>Director</strong>
              </p>
              <p className="tgd-profile-sub">BIIT administration</p>
            </div>
            <img src={avatar} alt="" className="tgd-avatar" />
          </div>
        </header>

        <h2 className="tgd-page-title">Grade distribution</h2>

        <section className="tgd-section" aria-labelledby="tgd-session-label">
          <h3 id="tgd-session-label" className="tgd-section-title">
            Academic session
          </h3>
          <div className="tgd-select-wrap">
            <select
              className="tgd-select"
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
            >
              <option value="">Select session…</option>
              {sessions.map((s, i) => (
                <option key={`${s}-${i}`} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </section>

        {selectedSession !== "" && (
          <section className="tgd-section" aria-labelledby="tgd-teachers-label">
            <h3 id="tgd-teachers-label" className="tgd-section-title">
              Teachers for comparison
            </h3>
            <div className="tgd-scroll-panel">
              {teachers.length === 0 ? (
                <p className="tgd-empty">No teachers listed for this session.</p>
              ) : (
                <ul className="tgd-teacher-list">
                  {teachers.map((t, index) => {
                    const id = teacherId(t);
                    const selected = selectedTeachers.some((x) => teacherId(x) === id);
                    return (
                      <li key={id || `t-${index}`}>
                        <button
                          type="button"
                          className={`tgd-teacher-card ${selected ? "tgd-teacher-card--active" : ""}`}
                          onClick={() => toggleTeacher(t)}
                        >
                          <span
                            className="tgd-color-bar"
                            style={{ background: COLOR_PALETTE[index % COLOR_PALETTE.length] }}
                            aria-hidden
                          />
                          <img src={avatar} alt="" className="tgd-teacher-avatar" />
                          <div className="tgd-teacher-meta">
                            <span className="tgd-teacher-name">{teacherName(t).toUpperCase()}</span>
                            <span className="tgd-teacher-role">{t.Designation || t.designation || "Faculty member"}</span>
                          </div>
                          <div className="tgd-teacher-right">
                            <span className={`tgd-check ${selected ? "tgd-check--on" : ""}`} aria-hidden>
                              {selected ? "✓" : ""}
                            </span>
                            <span className="tgd-avg">
                              Avg: {t.AverageRating != null ? t.AverageRating : "N/A"}
                            </span>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>
        )}

        {selectedTeachers.length > 0 && (
          <section className="tgd-section" aria-labelledby="tgd-courses-label">
            <h3 id="tgd-courses-label" className="tgd-section-title">
              Common courses
            </h3>
            <div className="tgd-scroll-panel">
              {courses.length === 0 ? (
                <p className="tgd-empty">No common courses for the selected teachers.</p>
              ) : (
                <ul className="tgd-course-list">
                  {courses.map((c) => {
                    const sel = selectedCourses.includes(c.CourseID);
                    return (
                      <li key={c.CourseID}>
                        <button
                          type="button"
                          className={`tgd-course-row ${sel ? "tgd-course-row--active" : ""}`}
                          onClick={() => toggleCourse(c.CourseID)}
                        >
                          <span className={`tgd-check ${sel ? "tgd-check--on" : ""}`} aria-hidden>
                            {sel ? "✓" : ""}
                          </span>
                          <div className="tgd-course-text">
                            <span className="tgd-course-code">{c.CourseID}</span>
                            <span className="tgd-course-name">{c.CourseName || "—"}</span>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>
        )}

        {selectedCourses.length > 0 && (
          <button
            type="button"
            className="tgd-primary-btn"
            onClick={fetchGradeData}
            disabled={loadingCourses || loadingGrade}
          >
            {loadingGrade ? "Loading analysis…" : "Show grade analysis"}
          </button>
        )}

        {loadingAny && (
          <div className="tgd-loading" aria-live="polite">
            {loadingTeachers && "Loading teachers…"}
            {!loadingTeachers && loadingCourses && "Loading common courses…"}
            {!loadingTeachers && !loadingCourses && loadingGrade && "Loading grade data…"}
          </div>
        )}

        {showResults && gradeData && chartRows.length > 0 && (
          <section className="tgd-graph-card" aria-label="Grade distribution chart">
            <h3 className="tgd-graph-title">Grade distribution comparison</h3>
            <p className="tgd-graph-sub">{selectedCourseLabels || "Selected courses"}</p>
            <div className="tgd-chart-outer">
              <div className="tgd-chart-inner">
                <ResponsiveContainer width="100%" height={280} minHeight={260}>
                  <BarChart data={chartRows} margin={{ top: 16, right: 8, left: 0, bottom: 8 }} barCategoryGap="18%">
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="grade"
                      type="category"
                      tick={{ fill: "#334155", fontWeight: 600 }}
                      interval={0}
                      ticks={GRADES}
                    />
                    <YAxis allowDecimals={false} domain={[0, yAxisMax]} tick={{ fill: "#64748b" }} width={40} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(13, 46, 39, 0.06)" }} />
                    <Legend wrapperStyle={{ paddingTop: 8 }} />
                    {barSeries.map((s) => (
                      <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.fill} radius={[4, 4, 0, 0]} maxBarSize={48} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="tgd-legend-chips">
              {gradeData.map((t, i) => (
                <span key={teacherId(t) || `g-${i}`} className="tgd-legend-chip">
                  <span className="tgd-legend-dot" style={{ background: COLOR_PALETTE[i % COLOR_PALETTE.length] }} />
                  {(t.TeacherName ?? teacherName(t)).split(/\s+/)[0]}
                </span>
              ))}
            </div>
          </section>
        )}

        <button type="button" className="tgd-back-btn" onClick={() => navigate("/DirectorDashboard")}>
          Back to dashboard
        </button>
      </div>
    </div>
  );
};

export default TeacherGradeDashboard;
