import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import APIEndPoint from "../../unity.js";
import "./RCEvaluation.css";
import logo from "../../Images/Biit_Logo.png";
import avatar from "../../Images/maleAvatar.png";

const api = (path) => `${APIEndPoint}${String(path).replace(/^\//, "")}`;

/** API may return a bare array or wrapped JSON (same patterns as React Native / ASP.NET). */
function unwrapList(data) {
  if (Array.isArray(data)) return data;
  if (data == null) return [];
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.Data)) return data.Data;
  if (Array.isArray(data.d)) return data.d;
  if (Array.isArray(data.results)) return data.results;
  return [];
}

/** Sessions may be strings or objects `{ Session, session, ... }` (Picker / select need strings). */
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

/** Row id: teachers by id; courses by course code (aligned with RN: TeacherID / CourseNo + web fallbacks). */
const rowId = (item, tab) =>
  tab === "Teachers"
    ? String(item.TeacherID ?? item.teacherID ?? item.teacherId ?? item.EmpNo ?? item.empNo ?? "").trim()
    : String(
        item.CourseNo ??
          item.courseNo ??
          item.courseId ??
          item.CourseId ??
          item.CourseID ??
          item.Course_code ??
          item.course_code ??
          item.SubjectCode ??
          item.subjectCode ??
          ""
      ).trim();

const listItemKey = (item, tab, idx) => {
  const id = rowId(item, tab);
  return id ? `${tab}-${id}-${idx}` : `${tab}-row-${idx}`;
};

const rowSelectionKey = (item, tab, idx) => {
  const id = rowId(item, tab);
  return id || `${tab}:__row__${idx}`;
};

const ConfidentialRCEvaluation = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Teachers");
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState("");
  const [dataList, setDataList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await axios.get(api("Director/GetAllSessions"));
        const raw = unwrapList(response.data);
        const list = [...new Set(raw.map(normalizeSessionValue).filter(Boolean))];
        setSessions(list);
        if (list.length > 0) {
          setSelectedSession((prev) => (prev && list.includes(prev) ? prev : list[0]));
        }
      } catch {
        window.alert("Could not load sessions.");
      }
    };
    fetchSessions();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedSession) return;
      setLoading(true);

      try {
        const endpoint =
          activeTab === "Teachers"
            ? api(`Director/GetConfidentialAllocatedTeachers?session=${encodeURIComponent(selectedSession)}`)
            : api(`Director/GetConfidentialAllocatedCourses?session=${encodeURIComponent(selectedSession)}`);

        const response = await axios.get(endpoint);
        let fetchedData = unwrapList(response.data);

        if (activeTab === "Teachers") {
          try {
            const ratingRes = await axios.get(
              api(`Director/GetConfidentialTeacherAverageRatings?session=${encodeURIComponent(selectedSession)}`)
            );
            const ratingsMap = unwrapList(ratingRes.data);

            fetchedData = fetchedData.map((teacher) => {
              const ratingObj = ratingsMap.find((r) => {
                const rid = String(r.TeacherID ?? r.teacherID ?? r.teacherId ?? r.EmpNo ?? r.empNo ?? "")
                  .trim()
                  .toUpperCase();
                const tid = String(teacher.TeacherID ?? teacher.teacherID ?? teacher.teacherId ?? teacher.EmpNo ?? teacher.empNo ?? "")
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
            /* same as RN: keep list without ratings */
          }
        }

        setDataList(fetchedData);
      } catch {
        setDataList([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab, selectedSession]);

  const setTab = (tab) => {
    setActiveTab(tab);
    setSelectedItems([]);
  };

  const toggleSelection = (selectKey) => {
    if (selectKey == null || String(selectKey).trim() === "") return;
    const sid = String(selectKey);
    setSelectedItems((prev) => (prev.some((x) => String(x) === sid) ? prev.filter((v) => String(v) !== sid) : [...prev, sid]));
  };

  const isSelected = (id) => selectedItems.some((x) => String(x) === String(id));

  /** Matches React Native: one or more teachers → performance dashboard (per-question averages; student flow uses common course API). */
  const handleCompare = () => {
    if (activeTab !== "Teachers" || selectedItems.length === 0) return;
    const items = dataList.filter((it, idx) => isSelected(rowSelectionKey(it, "Teachers", idx)));
    if (items.length === 0) return;
    navigate("/TeacherPerformanceDashboard", {
      state: {
        teachers: items,
        type: "Student",
        session: selectedSession,
        confidentialEval: true,
      },
    });
  };

  const buildCoursesPayload = (rows) =>
    rows
      .map((it) => ({
        courseId: String(
          it.CourseNo ??
            it.courseNo ??
            it.courseId ??
            it.CourseId ??
            it.CourseID ??
            it.Course_code ??
            it.course_code ??
            it.SubjectCode ??
            it.subjectCode ??
            ""
        ).trim(),
        courseName: String(it.CourseName ?? it.courseName ?? it.SubjectName ?? it.subjectName ?? "").trim(),
      }))
      .filter((c) => c.courseId);

  const openCourseTeacherCompare = (courseRows) => {
    const courses = buildCoursesPayload(courseRows);
    if (courses.length === 0) {
      window.alert("Select at least one course with a valid course code.");
      return;
    }
    navigate("/ConfidentialCompareScreen", {
      state: {
        confidentialEval: true,
        session: selectedSession,
        courses,
      },
    });
  };

  const goCourseCompare = (item) => {
    openCourseTeacherCompare([item]);
  };

  const handleOpenCourseChartCompare = () => {
    if (activeTab !== "Courses" || selectedItems.length === 0) return;
    const rows = dataList.filter((it, idx) =>
      selectedItems.some((sid) => String(sid) === String(rowSelectionKey(it, "Courses", idx)))
    );
    openCourseTeacherCompare(rows);
  };

  return (
    <div className="rc-page">
      <div className="rc-container">
        <div className="rc-logo-wrap">
          <img src={logo} alt="BIIT Logo" className="rc-logo" />
        </div>

        <div className="rc-card rc-profile-card">
          <div className="rc-card-title">Director information</div>
          <div className="rc-profile-body">
            <div className="rc-profile-text">
              <p>
                Name: <strong>Dr. Jamil Sawar</strong>
              </p>
              <p>Role: Director</p>
              <p className="rc-p-sub">BIIT administration</p>
            </div>
            <img src={avatar} alt="Director" className="rc-avatar" />
          </div>
        </div>

        <h2 className="rc-dashboard-title">Confidential analytics &amp; feedback</h2>

        <div className="rc-tabs rc-tabs--two">
          {["Teachers", "Courses"].map((tab) => (
            <button
              key={tab}
              type="button"
              className={`rc-tab-btn ${activeTab === tab ? "active" : ""}`}
              onClick={() => setTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="rc-card rc-list-card">
          <div className="rc-session-row">
            <label htmlFor="rc-session">Session</label>
            <select
              id="rc-session"
              className="rc-session-select"
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
            >
              {sessions.length === 0 ? (
                <option value="">No sessions</option>
              ) : (
                sessions.map((s, i) => (
                  <option key={`${String(s)}-${i}`} value={s}>
                    {s}
                  </option>
                ))
              )}
            </select>
          </div>

          {activeTab === "Courses" && (
            <p className="rc-courses-hint">
              Select one or more courses (checkbox), or tap the arrow to open the comparison chart for one course. Compare teachers across
              multiple subjects on the next screen.
            </p>
          )}

          <div className="rc-list-scroll">
            {loading ? (
              <div className="rc-status-msg">Loading records…</div>
            ) : dataList.length === 0 ? (
              <div className="rc-status-msg">No records found</div>
            ) : (
              <div className="rc-list">
                {dataList.map((item, idx) => {
                  const selKey = rowSelectionKey(item, activeTab, idx);
                  const displayName = item.TeacherName || item.CourseName || "Untitled";
                  const isTeacherTab = activeTab === "Teachers";
                  const selected = isSelected(selKey);

                  return (
                    <div
                      key={listItemKey(item, activeTab, idx)}
                      className={`rc-row ${idx !== dataList.length - 1 ? "rc-row-border" : ""} ${selected ? "selected" : ""}`}
                    >
                      <div className="rc-row-main">
                        <button
                          type="button"
                          className={`rc-check ${selected ? "checked" : ""}`}
                          onClick={() => toggleSelection(selKey)}
                          aria-pressed={selected}
                          aria-label={selected ? "Deselect" : "Select"}
                        >
                          {selected ? "✓" : ""}
                        </button>
                        <div className="rc-row-text">
                          <p className="rc-name">{displayName}</p>
                          {isTeacherTab && item.Designation && (
                            <p className="rc-sub rc-sub-green">{item.Designation}</p>
                          )}
                          {!isTeacherTab && (
                            <p className="rc-sub">
                              {rowId(item, "Courses") ||
                                item.Course_code ||
                                item.course_code ||
                                item.SubjectCode ||
                                "—"}
                            </p>
                          )}
                        </div>
                      </div>

                      {isTeacherTab ? (
                        <div className="rc-rating-box">
                          <span className="rc-rating-label">STUDENT</span>
                          <span className="rc-rating-value">
                            {item.AverageRating === "N/A" ? "--" : item.AverageRating}
                          </span>
                        </div>
                      ) : (
                        <button type="button" className="rc-arrow-btn" onClick={() => goCourseCompare(item)} aria-label="Open course comparison">
                          ➔
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="rc-footer">
          {activeTab === "Courses" ? (
            <button
              type="button"
              className="rc-chart-btn"
              disabled={selectedItems.length === 0}
              onClick={handleOpenCourseChartCompare}
            >
              Course comparison chart ({selectedItems.length} course{selectedItems.length !== 1 ? "s" : ""})
            </button>
          ) : null}
          {activeTab === "Teachers" && (
            <p className="rc-teachers-hint">
              Select one or more teachers for the <strong>performance dashboard</strong> (per-question chart). With two or more teachers, you
              can open <strong>Advanced compare</strong> there for the full question picker and confidential comparison chart.
            </p>
          )}
          <button
            type="button"
            className="rc-compare-btn"
            disabled={activeTab === "Teachers" ? selectedItems.length === 0 : true}
            onClick={handleCompare}
          >
            Compare selected teachers ({selectedItems.length})
          </button>
          <button type="button" className="rc-dash-btn" onClick={() => navigate("/DirectorDashboard")}>
            Back to director dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfidentialRCEvaluation;
