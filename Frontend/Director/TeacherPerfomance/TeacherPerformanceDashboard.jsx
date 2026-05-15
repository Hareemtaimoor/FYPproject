import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import APIEndPoint from "../../unity.js";
import "./TeacherPerformanceDashboard.css";
import logo from "../../Images/Biit_Logo.png";
import avatar from "../../Images/maleAvatar.png";

const api = (path) => `${APIEndPoint}${String(path).replace(/^\//, "")}`;

function unwrapList(data) {
  if (Array.isArray(data)) return data;
  if (data == null) return [];
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.Data)) return data.Data;
  return [];
}

function teacherApiId(t) {
  return String(t.TeacherID ?? t.teacherID ?? t.teacherId ?? t.EmpNo ?? "").trim();
}

function teacherName(t) {
  return String(t.TeacherName ?? t.teacherName ?? teacherApiId(t) ?? "Teacher");
}

function parseQLabel(lab) {
  const m = String(lab ?? "").match(/Q\s*(\d+)/i);
  return m ? parseInt(m[1], 10) : 0;
}

function TpdTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const rows = payload.filter((p) => p?.dataKey != null && p.value != null && p.name);
  if (!rows.length) return null;
  return (
    <div className="tpd-tooltip">
      <p className="tpd-tooltip-badge">{label}</p>
      {rows.map((p) => (
        <div key={String(p.dataKey)} className="tpd-tooltip-row">
          <span className="tpd-tooltip-dot" style={{ background: p.color }} />
          <span className="tpd-tooltip-name">{p.name}</span>
          <strong className="tpd-tooltip-val" style={{ color: p.color }}>
            {p.value != null && Number.isFinite(Number(p.value)) ? Number(p.value).toFixed(2) : "—"}
          </strong>
        </div>
      ))}
    </div>
  );
}

function TpdLegendChips({ payload }) {
  if (!payload?.length) return null;
  return (
    <div className="tpd-legend-wrap">
      {payload.map((entry) => (
        <span key={String(entry.dataKey)} className="tpd-legend-chip" title={String(entry.value)}>
          <span className="tpd-legend-swatch" style={{ background: entry.color }} />
          <span className="tpd-legend-text">{entry.value}</span>
        </span>
      ))}
    </div>
  );
}

const COLORS = ["#0d9488", "#7c3aed", "#ea580c", "#db2777", "#2563eb", "#ca8a04", "#059669", "#dc2626"];

const TeacherPerformanceDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state || {};

  const teachers = Array.isArray(state.teachers) ? state.teachers : [];
  const evalType = state.type === "Peer" ? "Peer" : "Student";
  const session = String(state.session ?? "").trim();
  const confidentialEval = Boolean(state.confidentialEval);

  const directorPath = (regular, confidential) => (confidentialEval ? confidential : regular);

  const [commonCourses, setCommonCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [graphRows, setGraphRows] = useState([]);
  const [seriesMeta, setSeriesMeta] = useState([]);

  const teacherIdsCsv = useMemo(
    () =>
      teachers
        .map(teacherApiId)
        .filter(Boolean)
        .join(","),
    [teachers]
  );

  const fetchCommonCourses = useCallback(async () => {
    if (!session || !teacherIdsCsv || evalType !== "Student") return;
    setLoading(true);
    setLoadError("");
    try {
      const path = directorPath(
        `Director/GetCommonCoursesBySession_Teachers?session=${encodeURIComponent(session)}&teacherIds=${encodeURIComponent(teacherIdsCsv)}`,
        `Director/GetConfidentialCommonCoursesBySession_Teachers?session=${encodeURIComponent(session)}&teacherIds=${encodeURIComponent(teacherIdsCsv)}`
      );
      const url = api(path);
      const res = await axios.get(url);
      const raw = unwrapList(res.data);
      const rows = raw.map((r) => ({
        courseNo: String(r.Course_no ?? r.courseNo ?? r.course_no ?? "").trim(),
        courseName: String(r.Course_desc ?? r.courseName ?? r.course_desc ?? "").trim(),
      })).filter((r) => r.courseNo);
      setCommonCourses(rows);
      setSelectedCourse((prev) => {
        if (prev && rows.some((r) => r.courseNo === prev)) return prev;
        return rows[0]?.courseNo ?? "";
      });
    } catch (e) {
      setCommonCourses([]);
      setLoadError(e?.response?.data?.Message || e?.message || "Could not load common courses.");
    } finally {
      setLoading(false);
    }
  }, [session, teacherIdsCsv, evalType, confidentialEval]);

  useEffect(() => {
    if (teachers.length === 0 || !session) return;
    if (evalType === "Student") fetchCommonCourses();
  }, [teachers.length, session, evalType, fetchCommonCourses]);

  const buildChartFromRows = useCallback((perTeacherRows) => {
    const labelSet = new Set();
    perTeacherRows.forEach(({ rows }) => {
      rows.forEach((r) => labelSet.add(String(r.label ?? r.Label ?? "")));
    });
    const labels = [...labelSet].filter(Boolean).sort((a, b) => parseQLabel(a) - parseQLabel(b));
    if (!labels.length) {
      setGraphRows([]);
      setSeriesMeta([]);
      return;
    }

    const meta = perTeacherRows.map((x, i) => ({
      key: `t_${i}`,
      name: x.name,
      color: COLORS[i % COLORS.length],
    }));
    setSeriesMeta(meta);

    const byTeacherLabel = perTeacherRows.map(({ rows }) => {
      const m = new Map();
      rows.forEach((r) => {
        const lab = String(r.label ?? r.Label ?? "");
        const sc = Number(r.score ?? r.Score ?? r.averageRating);
        if (lab) m.set(lab, Number.isFinite(sc) ? sc : null);
      });
      return m;
    });

    const merged = labels.map((lab) => {
      const row = { label: lab };
      byTeacherLabel.forEach((m, i) => {
        const v = m.get(lab);
        row[`t_${i}`] = v != null ? v : 0;
      });
      return row;
    });
    setGraphRows(merged);
  }, []);

  useEffect(() => {
    if (evalType !== "Peer" || teachers.length === 0 || !session) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError("");
      try {
        const perTeacher = await Promise.all(
          teachers.map(async (t) => {
            const id = teacherApiId(t);
            const url = api(
              directorPath(
                `Director/GetTeacherPeerEvalDetails?teacherId=${encodeURIComponent(id)}&session=${encodeURIComponent(session)}`,
                `Director/GetConfidentialTeacherPeerEvalDetails?teacherId=${encodeURIComponent(id)}&session=${encodeURIComponent(session)}`
              )
            );
            const res = await axios.get(url);
            const rows = unwrapList(res.data);
            return { name: teacherName(t), rows };
          })
        );
        if (!cancelled) buildChartFromRows(perTeacher);
      } catch (e) {
        if (!cancelled) {
          setGraphRows([]);
          setSeriesMeta([]);
          setLoadError(e?.response?.data?.Message || e?.message || "Could not load peer evaluation details.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [evalType, session, teacherIdsCsv, teachers, buildChartFromRows, confidentialEval]);

  useEffect(() => {
    if (evalType !== "Student" || teachers.length === 0 || !session || !selectedCourse) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError("");
      try {
        const perTeacher = await Promise.all(
          teachers.map(async (t) => {
            const id = teacherApiId(t);
            const url = api(
              directorPath(
                `Director/GetTeacherStudentEvalDetails?teacherId=${encodeURIComponent(id)}&session=${encodeURIComponent(
                  session
                )}&courseId=${encodeURIComponent(selectedCourse)}`,
                `Director/GetConfidentialTeacherStudentEvalDetails?teacherId=${encodeURIComponent(id)}&session=${encodeURIComponent(
                  session
                )}&courseId=${encodeURIComponent(selectedCourse)}`
              )
            );
            const res = await axios.get(url);
            const rows = unwrapList(res.data);
            return { name: teacherName(t), rows };
          })
        );
        if (!cancelled) buildChartFromRows(perTeacher);
      } catch (e) {
        if (!cancelled) {
          setGraphRows([]);
          setSeriesMeta([]);
          setLoadError(e?.response?.data?.Message || e?.message || "Could not load student evaluation details.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [evalType, session, selectedCourse, teacherIdsCsv, teachers, buildChartFromRows, confidentialEval]);

  const chartSize = useMemo(() => {
    const h = 380;
    const perCategory = 44 + Math.max(1, seriesMeta.length) * 26;
    const w = Math.max(480, graphRows.length * perCategory + 72);
    return { width: w, height: h };
  }, [graphRows.length, seriesMeta.length]);

  if (!session || teachers.length === 0) {
    return (
      <div className="tpd-page">
        <div className="tpd-card tpd-missing">
          <h2>Nothing to show</h2>
          <p>
            Select one or more teachers in {confidentialEval ? "Confidential analytics" : "RC Evaluation"}, then open the performance
            dashboard.
          </p>
          <button
            type="button"
            className="tpd-btn"
            onClick={() => navigate(confidentialEval ? "/ConfidentialRCEvaluation" : "/RCEvaluation")}
          >
            {confidentialEval ? "Back to confidential analytics" : "Back to RC evaluation"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="tpd-page">
      <div className="tpd-inner">
        <div className="tpd-logo-wrap">
          <img src={logo} alt="BIIT" className="tpd-logo" />
        </div>

        <div className="tpd-card tpd-profile">
          <div>
            <p className="tpd-muted">Director</p>
            <p className="tpd-title">{confidentialEval ? "Confidential teacher performance" : "Teacher performance"}</p>
            <p className="tpd-sub">
              Session <strong>{session}</strong> · {evalType === "Peer" ? "Peer" : "Student"} evaluation
              {confidentialEval ? " · confidential data source" : ""}
            </p>
          </div>
          <img src={avatar} alt="" className="tpd-avatar" />
        </div>

        <div className="tpd-card">
          <h3 className="tpd-section-title">Selected teachers ({teachers.length})</h3>
          <div className="tpd-chip-row">
            {teachers.map((t) => (
              <span key={teacherApiId(t)} className="tpd-chip">
                <strong>{teacherName(t)}</strong>
                <span className="tpd-chip-id">{teacherApiId(t)}</span>
              </span>
            ))}
          </div>

          {evalType === "Student" && (
            <>
              <label className="tpd-label" htmlFor="tpd-course">
                Common course (all selected teachers have evaluations in this course)
              </label>
              <select
                id="tpd-course"
                className="tpd-select"
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                disabled={commonCourses.length === 0}
              >
                {commonCourses.length === 0 ? (
                  <option value="">No common courses returned</option>
                ) : (
                  commonCourses.map((c, idx) => (
                    <option key={`${c.courseNo}-${idx}`} value={c.courseNo}>
                      {c.courseNo}
                      {c.courseName ? ` — ${c.courseName}` : ""}
                    </option>
                  ))
                )}
              </select>
              <p className="tpd-hint">
                Uses{" "}
                <code>
                  Director/
                  {confidentialEval ? "GetConfidentialCommonCoursesBySession_Teachers" : "GetCommonCoursesBySession_Teachers"}
                </code>{" "}
                then{" "}
                <code>
                  {confidentialEval ? "GetConfidentialTeacherStudentEvalDetails" : "GetTeacherStudentEvalDetails"}
                </code>{" "}
                per teacher (same flow as RC evaluation; confidential routes until the confidential DB is wired).
              </p>
            </>
          )}

          {evalType === "Peer" && (
            <p className="tpd-hint">
              Loaded with{" "}
              <code>
                Director/{confidentialEval ? "GetConfidentialTeacherPeerEvalDetails" : "GetTeacherPeerEvalDetails"}
              </code>{" "}
              per teacher (no course filter on API).
            </p>
          )}
        </div>

        {loadError ? (
          <div className="tpd-banner tpd-banner--err" role="alert">
            {loadError}
          </div>
        ) : null}

        {graphRows.length > 0 && seriesMeta.length > 0 ? (
          <div className="tpd-graph-card">
            <div className="tpd-graph-accent" aria-hidden />
            <h3 className="tpd-graph-title">Scores by question</h3>
            <p className="tpd-graph-sub">0–5 scale · grouped bars per teacher; hover for values</p>
            <div className="tpd-chart-scroll">
              <div
                className="tpd-chart-inner"
                style={{
                  width: chartSize.width,
                  height: chartSize.height,
                  minWidth: chartSize.width,
                  minHeight: chartSize.height,
                }}
              >
                <ResponsiveContainer width={chartSize.width} height={chartSize.height} debounce={50}>
                  <BarChart
                    data={graphRows}
                    margin={{ top: 28, right: 28, left: 8, bottom: graphRows.length > 10 ? 72 : 96 }}
                    barCategoryGap="14%"
                    barGap={4}
                  >
                    <CartesianGrid strokeDasharray="3 6" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: "#475569", fontWeight: 600 }}
                      interval={0}
                      angle={graphRows.length > 10 ? -36 : 0}
                      textAnchor={graphRows.length > 10 ? "end" : "middle"}
                      height={graphRows.length > 10 ? 56 : 30}
                    />
                    <YAxis
                      domain={[0, 5]}
                      ticks={[0, 1, 2, 3, 4, 5]}
                      width={48}
                      tick={{ fontSize: 11, fill: "#475569", fontWeight: 600 }}
                      axisLine={{ stroke: "#cbd5e1" }}
                    />
                    <ReferenceLine y={5} stroke="#94a3b8" strokeDasharray="5 5" />
                    <Tooltip content={<TpdTooltip />} cursor={{ fill: "rgba(13, 148, 136, 0.08)" }} />
                    <Legend content={(p) => <TpdLegendChips {...p} />} wrapperStyle={{ paddingTop: 4 }} />
                    {seriesMeta.map((s) => (
                      <Bar
                        key={`b-${s.key}`}
                        dataKey={s.key}
                        name={s.name}
                        fill={s.color}
                        radius={[4, 4, 0, 0]}
                        maxBarSize={graphRows.length > 8 ? 22 : 36}
                        isAnimationActive={
                          typeof window !== "undefined" &&
                          !window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches
                        }
                        animationDuration={500}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {seriesMeta.length > 0 && (
              <div className="tpd-graph-legend-footer" aria-label="Teachers selected for comparison">
                <p className="tpd-graph-legend-title">Selected for comparison</p>
                <div className="tpd-legend-wrap">
                  {seriesMeta.map((s) => (
                    <span key={s.key} className="tpd-legend-chip" title={s.name}>
                      <span className="tpd-legend-swatch" style={{ background: s.color }} aria-hidden />
                      <span className="tpd-legend-chip-text">{s.name}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          !loading && (
            <div className="tpd-banner">
              {evalType === "Student" && !selectedCourse
                ? "Pick a common course when the list loads."
                : "No chart points returned. Confirm API data for this session and selection."}
            </div>
          )
        )}

        {loading ? <div className="tpd-loading">Loading…</div> : null}

        <div className="tpd-actions">
          <button
            type="button"
            className="tpd-btn tpd-btn--ghost"
            onClick={() => navigate(confidentialEval ? "/ConfidentialRCEvaluation" : "/RCEvaluation")}
          >
            {confidentialEval ? "Back to confidential analytics" : "Back to RC evaluation"}
          </button>
          {teachers.length >= (confidentialEval ? 1 : 2) ? (
            <button
              type="button"
              className="tpd-btn tpd-btn--accent"
              onClick={() =>
                navigate(confidentialEval ? "/ConfidentialCompareScreen" : "/CompareScreenFrom_C_T", {
                  state: {
                    session,
                    compareMode: "teachers",
                    teachers,
                    evalType,
                    ...(confidentialEval ? { confidentialEval: true } : {}),
                  },
                })
              }
            >
              Advanced compare (course + all questions)
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default TeacherPerformanceDashboard;
