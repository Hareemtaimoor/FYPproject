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
import "./CompareScreenFrom_C_T.css";
import logo from "../../Images/Biit_Logo.png";
import avatar from "../../Images/maleAvatar.png";

const api = (path) => `${APIEndPoint}${String(path).replace(/^\//, "")}`;

function normalizeCoursesFromState(state) {
  if (!state) return [];
  if (Array.isArray(state.courses) && state.courses.length > 0) {
    return state.courses
      .map((c) => ({
        courseId: String(
          c.courseId ??
            c.CourseNo ??
            c.courseNo ??
            c.CourseId ??
            c.CourseID ??
            c.Course_code ??
            c.course_code ??
            c.SubjectCode ??
            c.subjectCode ??
            ""
        ).trim(),
        courseName: String(c.courseName ?? c.CourseName ?? c.SubjectName ?? c.subjectName ?? "").trim(),
      }))
      .filter((c) => c.courseId);
  }
  const singleId =
    state.courseId ??
    state.CourseNo ??
    state.courseNo ??
    state.CourseId ??
    state.CourseID ??
    state.Course_code ??
    state.course_code ??
    state.SubjectCode ??
    state.subjectCode;
  if (singleId) {
    return [
      {
        courseId: String(singleId).trim(),
        courseName: String(state.courseName ?? state.CourseName ?? state.SubjectName ?? "").trim(),
      },
    ];
  }
  return [];
}

function unwrapListResponse(data) {
  if (Array.isArray(data)) return data;
  if (data == null) return [];
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.Data)) return data.Data;
  if (Array.isArray(data.d)) return data.d;
  if (Array.isArray(data.results)) return data.results;
  return [];
}

function normStr(v) {
  return String(v ?? "")
    .trim()
    .replace(/\s+/g, " ");
}

function eqId(a, b) {
  return normStr(a).toLowerCase() === normStr(b).toLowerCase();
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const rows = payload.filter((p) => p?.dataKey != null && p.value != null && p.name);
  if (!rows.length) return null;
  return (
    <div className="cct-chart-tooltip">
      <p className="cct-tt-badge">{label}</p>
      <div className="cct-tt-rows">
        {rows.map((p) => (
          <div key={String(p.dataKey)} className="cct-tt-row">
            <span className="cct-tt-dot" style={{ background: p.color }} aria-hidden />
            <span className="cct-tt-name">{p.name}</span>
            <span className="cct-tt-val" style={{ color: p.color }}>
              {p.value != null && Number.isFinite(Number(p.value)) ? Number(p.value).toFixed(2) : "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChartLegendChips({ payload }) {
  if (!payload?.length) return null;
  return (
    <div className="cct-legend-wrap">
      {payload.map((entry) => (
        <span key={String(entry.dataKey)} className="cct-legend-chip" title={String(entry.value)}>
          <span className="cct-legend-swatch" style={{ background: entry.color }} aria-hidden />
          <span className="cct-legend-chip-text">{entry.value}</span>
        </span>
      ))}
    </div>
  );
}

/** Teacher row id (aligned with RCEvaluation rowId for Teachers tab). */
function teacherRowId(t) {
  return String(t.TeacherID ?? t.teacherID ?? t.teacherId ?? t.EmpNo ?? t.empNo ?? "")
    .trim();
}

const ConfidentialCompareScreen = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const routeState = location.state || {};

  const compareMode = useMemo(() => {
    const minImplicitTeachers = routeState.confidentialEval ? 1 : 2;
    if (routeState.compareMode === "teachers") return "teachers";
    if (Array.isArray(routeState.teachers) && routeState.teachers.length >= minImplicitTeachers) {
      const hasCourses = Array.isArray(routeState.courses) && routeState.courses.length > 0;
      if (!hasCourses) return "teachers";
    }
    return "courses";
  }, [routeState.compareMode, routeState.teachers, routeState.courses, routeState.confidentialEval]);

  const initialTeachers = useMemo(
    () => (Array.isArray(routeState.teachers) ? routeState.teachers : []),
    [routeState.teachers]
  );

  const normalizedCourses = useMemo(() => normalizeCoursesFromState(routeState), [routeState]);

  const [teacherFlowCourse, setTeacherFlowCourse] = useState(null);
  const [allocatedCourses, setAllocatedCourses] = useState([]);

  const session = routeState.session ?? "";

  const courses = useMemo(() => {
    if (compareMode === "teachers") {
      if (!teacherFlowCourse?.courseId) return [];
      return [
        {
          courseId: teacherFlowCourse.courseId,
          courseName: teacherFlowCourse.courseName ?? "",
        },
      ];
    }
    return normalizedCourses;
  }, [compareMode, teacherFlowCourse, normalizedCourses]);

  const coursesKey = useMemo(() => {
    if (compareMode === "teachers") {
      const ids = initialTeachers.map((t) => teacherRowId(t)).join("|");
      return `T:${session}:${teacherFlowCourse?.courseId || "_"}:${ids}`;
    }
    return JSON.stringify(normalizedCourses);
  }, [compareMode, session, teacherFlowCourse?.courseId, initialTeachers, normalizedCourses]);

  const courseIdsKey = useMemo(() => courses.map((c) => c.courseId).join(","), [courses]);

  const [loading, setLoading] = useState(false);
  const [teacherCourseRows, setTeacherCourseRows] = useState([]);
  const [selectedSeries, setSelectedSeries] = useState([]);
  const [allQuestions, setAllQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [graphData, setGraphData] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);

  const loadTeachersForCourses = useCallback(async () => {
    if (!session) return;

    if (compareMode === "teachers") {
      if (!teacherFlowCourse?.courseId || !initialTeachers.length) {
        setTeacherCourseRows([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const cid = teacherFlowCourse.courseId;
        const r = await axios.get(
          api(`Director/GetConfidentialTeachersByCourse?courseId=${encodeURIComponent(cid)}&session=${encodeURIComponent(session)}`)
        );
        const list = unwrapListResponse(r.data);
        const listById = new Map(
          list.map((item) => {
            const id = String(item.TeacherID ?? item.teacherID ?? "").trim().toUpperCase();
            return [id, item];
          })
        );
        const rows = initialTeachers.map((t) => {
          const idRaw = teacherRowId(t);
          const idU = idRaw.toUpperCase();
          const fromApi = listById.get(idU);
          return {
            TeacherID: idRaw || String(fromApi?.TeacherID ?? "").trim(),
            TeacherName: fromApi?.TeacherName ?? t.TeacherName ?? t.teacherName ?? idRaw,
            Designation: fromApi?.Designation ?? t.Designation ?? t.designation ?? "",
            CourseNo: cid,
            CourseName: teacherFlowCourse.courseName ?? "",
          };
        });
        setTeacherCourseRows(rows);
      } catch {
        window.alert("Data Error: Failed to load teachers for this course.");
        setTeacherCourseRows([]);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!courses.length) {
      setTeacherCourseRows([]);
      return;
    }

    setLoading(true);
    try {
      const courseIds = courses.map((c) => c.courseId);
      let rows = [];

      if (courseIds.length > 1) {
        try {
          const r = await axios.post(api("Director/GetConfidentialTeachersForCourses"), {
            session,
            courseIds,
          });
          const batch = unwrapListResponse(r.data);
          if (batch.length > 0) {
            rows = batch.map((item) => {
              const cno = String(item.CourseNo ?? item.courseNo ?? "").trim();
              const meta = courses.find((c) => eqId(c.courseId, cno));
              return {
                TeacherID: item.TeacherID ?? item.teacherID,
                TeacherName: item.TeacherName ?? item.teacherName,
                Designation: item.Designation ?? item.designation,
                CourseNo: cno,
                CourseName: meta?.courseName ?? item.CourseName ?? item.courseName ?? "",
              };
            });
          }
        } catch {
          /* fall back to per-course GET */
        }
      }

      if (rows.length === 0) {
        if (courseIds.length === 1) {
          const r = await axios.get(
            api(`Director/GetConfidentialTeachersByCourse?courseId=${encodeURIComponent(courseIds[0])}&session=${encodeURIComponent(session)}`)
          );
          const list = unwrapListResponse(r.data);
          const meta = courses[0];
          rows = list.map((item) => ({
            TeacherID: item.TeacherID ?? item.teacherID,
            TeacherName: item.TeacherName ?? item.teacherName,
            Designation: item.Designation ?? item.designation,
            CourseNo: courseIds[0],
            CourseName: meta?.courseName ?? "",
          }));
        } else {
          const parts = await Promise.all(
            courseIds.map(async (courseId) => {
              const r = await axios.get(
                api(`Director/GetConfidentialTeachersByCourse?courseId=${encodeURIComponent(courseId)}&session=${encodeURIComponent(session)}`)
              );
              const list = unwrapListResponse(r.data);
              const meta = courses.find((c) => normStr(c.courseId).toLowerCase() === normStr(courseId).toLowerCase());
              return list.map((item) => ({
                TeacherID: item.TeacherID ?? item.teacherID,
                TeacherName: item.TeacherName ?? item.teacherName,
                Designation: item.Designation ?? item.designation,
                CourseNo: courseId,
                CourseName: meta?.courseName ?? "",
              }));
            })
          );
          const flat = parts.flat();
          const seen = new Set();
          rows = flat.filter((row) => {
            const k = `${String(row.TeacherID)}|${String(row.CourseNo)}`;
            if (seen.has(k)) return false;
            seen.add(k);
            return true;
          });
        }
      }

      setTeacherCourseRows(rows);
    } catch {
      window.alert("Data Error: Failed to load teachers for selected course(s).");
      setTeacherCourseRows([]);
    } finally {
      setLoading(false);
    }
  }, [session, compareMode, teacherFlowCourse, initialTeachers, courseIdsKey, courses]);

  useEffect(() => {
    if (!session) return;
    loadTeachersForCourses();
  }, [session, compareMode, coursesKey, loadTeachersForCourses]);

  useEffect(() => {
    setSelectedSeries([]);
    setGraphData([]);
  }, [courseIdsKey]);

  useEffect(() => {
    if (compareMode !== "teachers" || !session) {
      setAllocatedCourses([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const r = await axios.get(api(`Director/GetConfidentialAllocatedCourses?session=${encodeURIComponent(session)}`));
        const raw = unwrapListResponse(r.data);
        if (cancelled) return;
        const mapped = raw
          .map((it) => ({
            courseId: String(
              it.CourseNo ??
                it.courseNo ??
                it.courseId ??
                it.CourseId ??
                it.Course_code ??
                it.course_code ??
                it.SubjectCode ??
                ""
            ).trim(),
            courseName: String(it.CourseName ?? it.courseName ?? it.Course_desc ?? it.course_desc ?? "").trim(),
          }))
          .filter((c) => c.courseId);
        const seen = new Set();
        const opts = [];
        for (const c of mapped) {
          const k = c.courseId.toUpperCase();
          if (seen.has(k)) continue;
          seen.add(k);
          opts.push(c);
        }
        setAllocatedCourses(opts);
      } catch {
        if (!cancelled) setAllocatedCourses([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [compareMode, session]);

  useEffect(() => {
    setTeacherFlowCourse(null);
  }, [location.key]);

  useEffect(() => {
    if (!session) return;
    const loadQuestions = async () => {
      try {
        const resQ = await axios.get(api("Director/GetConfidentialQuestionsList"));
        const qList = unwrapListResponse(resQ.data);
        const uniqueQuestions = Array.from(
          new Map(
            qList
              .map((item) => {
                const qid =
                  item.Question_ID ??
                  item.questionID ??
                  item.question_ID ??
                  item.questionId ??
                  item.Id ??
                  item.id;
                if (qid === undefined || qid === null || String(qid).trim() === "") return null;
                const num = Number.parseInt(String(qid), 10);
                if (!Number.isFinite(num)) return null;
                const row = { ...item, Question_ID: num };
                return [String(num), row];
              })
              .filter(Boolean)
          ).values()
        );
        setAllQuestions(uniqueQuestions);
        setSelectedQuestions(uniqueQuestions.map((q) => q.Question_ID ?? q.questionID));
      } catch {
        setAllQuestions([]);
      }
    };
    loadQuestions();
  }, [session]);

  const filteredQuestions = useMemo(() => {
    return allQuestions.filter((q) => {
      const qidStr = String(q.Question_ID ?? q.questionID ?? "");
      const idOk = qidStr.includes(searchQuery);
      const textOk = String(q.Question ?? q.question ?? "").toLowerCase().includes(searchQuery.toLowerCase());
      return idOk || textOk;
    });
  }, [allQuestions, searchQuery]);

  const comparisonChartSize = useMemo(() => {
    const height = 380;
    const perCategory = 44 + Math.max(1, selectedSeries.length) * 26;
    const width = Math.max(480, graphData.length * perCategory + 72);
    return { width, height };
  }, [graphData.length, selectedSeries.length]);

  const getTeacherColor = (index) => {
    const palette = [
      "#0d9488",
      "#7c3aed",
      "#ea580c",
      "#db2777",
      "#2563eb",
      "#ca8a04",
      "#059669",
      "#dc2626",
      "#0891b2",
      "#4f46e5",
    ];
    return palette[index % palette.length];
  };

  const rowKey = (tid, cno) => `${String(tid)}|${String(cno)}`;

  const isSeriesSelected = (tid, cno) => selectedSeries.some((s) => rowKey(s.teacherId, s.courseNo) === rowKey(tid, cno));

  const toggleSeries = (row) => {
    const tid = row.TeacherID ?? row.teacherID;
    const cno = row.CourseNo ?? row.courseNo;
    const k = rowKey(tid, cno);
    setSelectedSeries((prev) => {
      if (prev.some((s) => rowKey(s.teacherId, s.courseNo) === k)) {
        return prev.filter((s) => rowKey(s.teacherId, s.courseNo) !== k).map((s, i) => ({ ...s, idx: i }));
      }
      return [
        ...prev,
        {
          teacherId: String(tid ?? "").trim(),
          courseNo: String(cno ?? "").trim(),
          teacherName: row.TeacherName ?? row.teacherName ?? "Teacher",
          courseName: row.CourseName ?? row.courseName ?? "",
        },
      ].map((s, i) => ({ ...s, idx: i }));
    });
  };

  useEffect(() => {
    if (compareMode !== "teachers" || !teacherFlowCourse?.courseId || teacherCourseRows.length === 0) return;
    setSelectedSeries(
      teacherCourseRows.map((row, i) => ({
        teacherId: String(row.TeacherID ?? "").trim(),
        courseNo: String(row.CourseNo ?? "").trim(),
        teacherName: row.TeacherName ?? row.teacherName ?? "",
        courseName: row.CourseName ?? row.courseName ?? "",
        idx: i,
      }))
    );
  }, [compareMode, teacherFlowCourse?.courseId, teacherCourseRows]);

  const toggleQuestion = (questionId) => {
    const key = String(questionId);
    setSelectedQuestions((prev) =>
      prev.some((x) => String(x) === key) ? prev.filter((x) => String(x) !== key) : [...prev, questionId]
    );
  };

  const handleShowEvaluation = async () => {
    if (selectedSeries.length === 0) {
      window.alert("Please select at least one teacher (per course) to compare.");
      return;
    }
    if (!selectedQuestions.length) {
      window.alert("Please select at least one question (use Edit questions).");
      return;
    }

    setLoading(true);
    try {
      const questionIds = selectedQuestions
        .map((x) => parseInt(String(x), 10))
        .filter((n) => Number.isFinite(n) && !Number.isNaN(n));

      const items = selectedSeries.map((s) => ({
        teacherId: String(s.teacherId),
        courseNo: String(s.courseNo),
      }));

      const payload = {
        session,
        questionIds,
        items,
      };

      const uniqCourses = [...new Set(selectedSeries.map((s) => String(s.courseNo)))];
      if (uniqCourses.length === 1) {
        const tids = [...new Set(selectedSeries.map((s) => String(s.teacherId)))];
        payload.courseId = uniqCourses[0];
        payload.teacherIds = tids;
        payload.CourseId = uniqCourses[0];
        payload.TeacherIds = tids;
        payload.QuestionIds = questionIds;
        payload.Session = session;
      }

      const response = await axios.post(api("Director/GetConfidentialComparisonData"), payload);
      const apiRows = unwrapListResponse(response.data);
      const seriesSnapshot = selectedSeries.map((s) => ({
        teacherId: normStr(s.teacherId),
        courseNo: normStr(s.courseNo),
        teacherName: s.teacherName,
        courseName: s.courseName,
      }));
      const questionsSnapshot = [...selectedQuestions];
      formatGraphData(apiRows, seriesSnapshot, questionsSnapshot);
    } catch (e) {
      const msg =
        e?.response?.data?.Message ||
        e?.response?.data?.ExceptionMessage ||
        (typeof e?.response?.data === "string" ? e.response.data : null) ||
        e?.message ||
        "Unknown error";
      window.alert(`Could not fetch comparison data: ${typeof msg === "string" ? msg : JSON.stringify(msg)}`);
    } finally {
      setLoading(false);
    }
  };

  const formatGraphData = (apiData, seriesList, questionList) => {
    if (!seriesList?.length) {
      setGraphData([]);
      return;
    }

    const numericQuestions = [...new Set(questionList.map((q) => Number.parseInt(String(q), 10)).filter((n) => Number.isFinite(n)))].sort(
      (a, b) => a - b
    );
    if (!numericQuestions.length) {
      setGraphData([]);
      return;
    }

    const rowTeacherId = (d) => normStr(d.TeacherID ?? d.teacherID ?? d.teacherId);
    const rowCourseNo = (d) => normStr(d.CourseNo ?? d.courseNo ?? d.courseID ?? d.courseId);
    const rowQuestionNo = (d) => {
      const v = d.QuestionNo ?? d.questionNo ?? d.Question_ID ?? d.question_ID ?? d.questionId ?? d.questionID;
      const n = parseInt(String(v), 10);
      return Number.isFinite(n) ? n : NaN;
    };
    const rowAverage = (d) => {
      const v = d.AverageRating ?? d.averageRating;
      if (v == null || v === "") return null;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };

    const distinctCourses = [...new Set(seriesList.map((s) => s.courseNo).filter(Boolean))];
    const singleCourseContext = distinctCourses.length === 1 ? distinctCourses[0] : null;

    const rowMatchesSeries = (d, s) => {
      if (!eqId(rowTeacherId(d), s.teacherId)) return false;
      const dc = rowCourseNo(d);
      const sc = s.courseNo;
      if (dc && sc) return eqId(dc, sc);
      if (dc && !sc) return false;
      if (!dc && sc && singleCourseContext) return eqId(sc, singleCourseContext);
      if (!dc && !sc && singleCourseContext) return true;
      return false;
    };

    const points = numericQuestions.map((qNum) => {
      const row = { label: `Q${qNum}` };
      seriesList.forEach((s, i) => {
        const dataKey = `s_${i}`;
        const match = apiData.find((d) => rowMatchesSeries(d, s) && rowQuestionNo(d) === qNum);
        const avg = match != null ? rowAverage(match) : null;
        row[dataKey] = avg != null ? avg : 0;
      });
      return row;
    });
    setGraphData(points);
  };

  const seriesLabel = (s) => {
    const t = String(s.teacherName || "Teacher").trim() || "Teacher";
    const c = String(s.courseNo || "").trim();
    return c ? `${t} (${c})` : t;
  };

  if (!session) {
    return (
      <div className="cct-main">
        <div className="cct-wrap">
          <div className="cct-missing">
            <h2>Missing session</h2>
            <p>Open this screen from Confidential analytics with a valid session.</p>
            <button type="button" className="cct-back-btn" onClick={() => navigate("/ConfidentialRCEvaluation")}>
              Back to confidential analytics
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (compareMode === "teachers" && initialTeachers.length < 1) {
    return (
      <div className="cct-main">
        <div className="cct-wrap">
          <div className="cct-missing">
            <h2>No teachers selected</h2>
            <p>Select at least one teacher on Confidential analytics, then open the comparison chart.</p>
            <button type="button" className="cct-back-btn" onClick={() => navigate("/ConfidentialRCEvaluation")}>
              Back to confidential analytics
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (compareMode === "courses" && normalizedCourses.length === 0) {
    return (
      <div className="cct-main">
        <div className="cct-wrap">
          <div className="cct-missing">
            <h2>Missing course or session</h2>
            <p>Select one or more courses in Confidential analytics, then open the comparison chart.</p>
            <button type="button" className="cct-back-btn" onClick={() => navigate("/ConfidentialRCEvaluation")}>
              Back to confidential analytics
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cct-main">
      <div className="cct-wrap">
        <div className="cct-top-wrapper">
          <div className="cct-logo-container">
            <img src={logo} className="cct-logo" alt="BIIT" />
          </div>

          <div className="cct-profile-card">
            <div className="cct-profile-info">
              <p className="cct-p-text">
                Name: <span className="cct-bold">DR. MOHAMMAD JAMIL SAWAR</span>
              </p>
              <p className="cct-p-text">
                Role: <span className="cct-bold">Director</span>
              </p>
              <p className="cct-p-sub">BIIT Administration</p>
            </div>
            <img src={avatar} alt="" className="cct-avatar" />
          </div>
        </div>

        <div className="cct-info-card">
          <div className="cct-info-row">
            <span className="cct-label-bold">SESSION: </span>
            <span className="cct-value-normal">{session}</span>
          </div>
          <div className="cct-divider" />
          <p className="cct-label-bold" style={{ margin: "0 0 8px" }}>
            {compareMode === "teachers" ? "MODE: TEACHER COMPARE" : `COURSE${courses.length > 1 ? "S" : ""} (${courses.length})`}
          </p>
          {compareMode === "teachers" ? (
            <div className="cct-teacher-flow-meta">
              <p className="cct-value-normal" style={{ margin: "0 0 10px" }}>
                Comparing <strong>{initialTeachers.length}</strong> teachers. Choose one course (same as React Native{" "}
                <code>GraphRequest.CourseId</code>), then select teacher–course lines for the chart.
              </p>
              <div className="cct-teacher-chip-row">
                {initialTeachers.map((t, i) => (
                  <span key={`${teacherRowId(t) || i}`} className="cct-course-chip" title={teacherRowId(t)}>
                    <strong>{(t.TeacherName || t.teacherName || teacherRowId(t) || "—").toString()}</strong>
                    {teacherRowId(t) ? <span className="cct-chip-sub"> — {teacherRowId(t)}</span> : null}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="cct-course-chips">
              {courses.map((c, chipIdx) => (
                <span key={`${c.courseId}-${chipIdx}`} className="cct-course-chip" title={c.courseName}>
                  <strong>{c.courseId}</strong>
                  {c.courseName ? <span className="cct-chip-sub"> — {c.courseName}</span> : null}
                </span>
              ))}
            </div>
          )}
        </div>

        {compareMode === "teachers" && (
          <div className="cct-pick-course-card">
            <label className="cct-pick-label" htmlFor="cct-course-pick">
              Course for comparison (required)
            </label>
            <select
              id="cct-course-pick"
              className="cct-pick-select"
              value={teacherFlowCourse?.courseId || ""}
              onChange={(e) => {
                const cid = e.target.value.trim();
                const meta = allocatedCourses.find((c) => eqId(c.courseId, cid));
                setTeacherFlowCourse(cid ? { courseId: meta?.courseId ?? cid, courseName: meta?.courseName ?? "" } : null);
              }}
            >
              <option value="">— Select course —</option>
              {allocatedCourses.map((c, optIdx) => (
                <option key={`cct-course-opt-${optIdx}-${c.courseId}`} value={c.courseId}>
                  {c.courseId}
                  {c.courseName ? ` — ${c.courseName}` : ""}
                </option>
              ))}
            </select>
            {allocatedCourses.length === 0 && !loading ? (
              <p className="cct-pick-hint">No courses returned for this session. Check Director/GetConfidentialAllocatedCourses.</p>
            ) : null}
          </div>
        )}

        <h3 className="cct-section-title">
          {compareMode === "teachers" ? "Teachers for selected course" : "Select teacher–course rows to compare"}
        </h3>
        <p className="cct-hint">
          {compareMode === "teachers"
            ? "Rows are your selected teachers on the chosen course. Tap “Show evaluation” for a multi-line chart (one line per teacher) vs questions."
            : "Same teacher on two courses appears as two rows. Pick any combination across multiple subjects and teachers."}
        </p>

        {compareMode === "teachers" && !teacherFlowCourse?.courseId ? (
          <div className="cct-empty-banner cct-empty-banner--soft">Select a course above to load teacher rows.</div>
        ) : null}

        {teacherCourseRows.length === 0 && !loading && compareMode === "courses" ? (
          <div className="cct-empty-banner">
            No teachers returned for these course(s). Check <code>DirectorController</code> allocation /{" "}
            <code>GetTeachersByCourse</code> and session/course codes.
          </div>
        ) : null}

        {teacherCourseRows.length === 0 && !loading && compareMode === "teachers" && teacherFlowCourse?.courseId ? (
          <div className="cct-empty-banner">No rows to show for this course and teacher list.</div>
        ) : null}

        <div className="cct-list-wrapper">
          {teacherCourseRows.map((t) => {
            const tid = t.TeacherID ?? t.teacherID;
            const cno = t.CourseNo ?? t.courseNo;
            const selected = isSeriesSelected(tid, cno);
            return (
              <button type="button" key={rowKey(tid, cno)} className="cct-list-item" onClick={() => toggleSeries(t)}>
                <div className={`cct-checkbox ${selected ? "checked" : ""}`}>{selected ? "✓" : ""}</div>
                <img src={avatar} alt="" className="cct-list-avatar" />
                <div className="cct-list-content">
                  <p className="cct-item-label">TEACHER · COURSE</p>
                  <p className="cct-item-title">{t.TeacherName ?? t.teacherName}</p>
                  <p className="cct-sub-text">
                    {t.Designation || "Lecturer"} · <strong>{cno}</strong>
                    {t.CourseName ? ` · ${t.CourseName}` : ""}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <button type="button" className="cct-eval-btn" onClick={handleShowEvaluation}>
          Show evaluation
        </button>

        {graphData.length > 0 && (
          <div className="cct-graph-card">
            <div className="cct-graph-card-accent" aria-hidden />
            <h4 className="cct-graph-header">Confidential performance comparison</h4>
            <p className="cct-graph-sub">Average rating per question (0–5), confidential evaluation source. Grouped bars per teacher/course; hover for detail.</p>
            <div className="cct-chart-scroll">
              <div
                className="cct-chart-inner"
                style={{
                  width: comparisonChartSize.width,
                  height: comparisonChartSize.height,
                  minWidth: comparisonChartSize.width,
                  minHeight: comparisonChartSize.height,
                }}
              >
                <ResponsiveContainer width={comparisonChartSize.width} height={comparisonChartSize.height} debounce={50}>
                  <BarChart
                    data={graphData}
                    margin={{
                      top: 28,
                      right: 32,
                      left: 6,
                      bottom: graphData.length > 10 ? 68 : 96,
                    }}
                    barCategoryGap="14%"
                    barGap={4}
                  >
                    <CartesianGrid strokeDasharray="3 6" stroke="#e2e8f0" vertical={false} strokeOpacity={0.95} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: "#475569", fontWeight: 600 }}
                      tickLine={{ stroke: "#cbd5e1" }}
                      axisLine={{ stroke: "#cbd5e1" }}
                      interval={0}
                      angle={graphData.length > 10 ? -38 : 0}
                      textAnchor={graphData.length > 10 ? "end" : "middle"}
                      height={graphData.length > 10 ? 58 : 30}
                    />
                    <YAxis
                      domain={[0, 5]}
                      ticks={[0, 1, 2, 3, 4, 5]}
                      width={48}
                      tick={{ fontSize: 11, fill: "#475569", fontWeight: 600 }}
                      tickLine={false}
                      axisLine={{ stroke: "#cbd5e1" }}
                      label={{
                        value: "Average",
                        angle: -90,
                        position: "insideLeft",
                        offset: 8,
                        fill: "#64748b",
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    />
                    <ReferenceLine
                      y={5}
                      stroke="#94a3b8"
                      strokeDasharray="6 6"
                      strokeWidth={1.5}
                      label={{
                        value: "Scale max (5)",
                        position: "right",
                        fill: "#64748b",
                        fontSize: 10,
                        fontWeight: 600,
                      }}
                    />
                    <Tooltip
                      content={<ChartTooltip />}
                      cursor={{ fill: "rgba(13, 148, 136, 0.08)" }}
                      wrapperStyle={{ outline: "none" }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      align="center"
                      content={(legendProps) => <ChartLegendChips {...legendProps} />}
                      wrapperStyle={{ paddingTop: 4 }}
                    />
                    {selectedSeries.map((s, index) => (
                      <Bar
                        key={`bar-${index}-${rowKey(s.teacherId, s.courseNo)}`}
                        dataKey={`s_${index}`}
                        name={seriesLabel(s)}
                        fill={getTeacherColor(index)}
                        radius={[4, 4, 0, 0]}
                        maxBarSize={graphData.length > 8 ? 22 : 36}
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

            {selectedSeries.length > 0 && (
              <div className="cct-graph-legend-footer" aria-label="Teachers selected for comparison">
                <p className="cct-graph-legend-title">Selected for comparison</p>
                <div className="cct-legend-wrap">
                  {selectedSeries.map((s, index) => (
                    <span
                      key={`legend-${index}-${rowKey(s.teacherId, s.courseNo)}`}
                      className="cct-legend-chip"
                      title={seriesLabel(s)}
                    >
                      <span
                        className="cct-legend-swatch"
                        style={{ background: getTeacherColor(index) }}
                        aria-hidden
                      />
                      <span className="cct-legend-chip-text">{seriesLabel(s)}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button type="button" className="cct-edit-btn" onClick={() => setShowEditModal(true)}>
              Edit questions
            </button>
          </div>
        )}

        {loading && <div className="cct-loading">Loading…</div>}

        <button type="button" className="cct-back-btn" onClick={() => navigate("/ConfidentialRCEvaluation")}>
          Back to confidential analytics
        </button>
      </div>

      {showEditModal && (
        <div className="cct-modal-overlay">
          <div className="cct-modal-body">
            <div className="cct-modal-header-row">
              <h3 className="cct-modal-header">Select questions</h3>
              <span className="cct-total-count">Total: {allQuestions.length}</span>
            </div>

            <div className="cct-search-container">
              <span className="cct-search-icon">🔍</span>
              <input
                className="cct-search-input"
                placeholder="Search question no. or text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="cct-control-row">
              <button type="button" className="cct-deselect-btn" onClick={() => setSelectedQuestions([])}>
                Deselect all
              </button>
              <button
                type="button"
                className="cct-select-btn"
                onClick={() => setSelectedQuestions(allQuestions.map((q) => q.Question_ID ?? q.questionID))}
              >
                Select all
              </button>
            </div>

            <div className="cct-modal-list">
              {filteredQuestions.map((item) => {
                const qid = item.Question_ID ?? item.questionID;
                const qSelected = selectedQuestions.some((x) => String(x) === String(qid));
                return (
                  <button
                    key={String(qid)}
                    type="button"
                    className="cct-modal-item"
                    onClick={() => toggleQuestion(qid)}
                  >
                    <div className={`cct-checkbox ${qSelected ? "checked" : ""}`}>{qSelected ? "✓" : ""}</div>
                    <p className="cct-modal-item-txt">
                      <strong>Q{qid}: </strong>
                      {item.Question ?? item.question}
                    </p>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              className="cct-apply-btn"
              onClick={() => {
                setShowEditModal(false);
                handleShowEvaluation();
              }}
            >
              Apply filter ({selectedQuestions.length})
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfidentialCompareScreen;
