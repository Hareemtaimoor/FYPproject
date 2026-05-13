import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import APIEndPoint from "../../unity.js";
import "./RCEvaluation.css";
import logo from "../../Images/Biit_Logo.png";
import avatar from "../../Images/maleAvatar.png";

const api = (path) => `${APIEndPoint}${path.replace(/^\//, "")}`;

const rowId = (item) => item.TeacherID ?? item.CourseNo ?? item.courseNo ?? item.teacherId;

const RCEvaluation = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Teachers");
  const [evalType, setEvalType] = useState("Student");
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState("");
  const [dataList, setDataList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await axios.get(api("Director/GetAllSessions"));
        const list = Array.isArray(response.data) ? response.data : [];
        setSessions(list);
        if (list.length > 0) setSelectedSession(list[0]);
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
            ? api(`Director/GetAllocatedTeachers?session=${encodeURIComponent(selectedSession)}`)
            : api(`Director/GetAllocatedCourses?session=${encodeURIComponent(selectedSession)}`);

        const response = await axios.get(endpoint);
        let fetchedData = Array.isArray(response.data) ? response.data : [];

        if (activeTab === "Teachers") {
          try {
            const ratingEndpoint =
              evalType === "Student"
                ? api(`Director/GetTeacherAverageRatings?session=${encodeURIComponent(selectedSession)}`)
                : api(`Director/GetPeerAverageRatings?session=${encodeURIComponent(selectedSession)}`);

            const ratingRes = await axios.get(ratingEndpoint);
            const ratingsMap = Array.isArray(ratingRes.data) ? ratingRes.data : [];

            fetchedData = fetchedData.map((teacher) => {
              const ratingObj = ratingsMap.find(
                (r) =>
                  String(r.TeacherID ?? r.teacherID ?? "")
                    .trim()
                    .toUpperCase() ===
                  String(teacher.TeacherID ?? teacher.teacherID ?? "")
                    .trim()
                    .toUpperCase()
              );
              return {
                ...teacher,
                AverageRating:
                  ratingObj != null && ratingObj.AverageRating != null
                    ? Number(ratingObj.AverageRating).toFixed(1)
                    : "N/A",
              };
            });
          } catch {
            /* keep list without ratings */
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
  }, [activeTab, selectedSession, evalType]);

  const setTab = (tab) => {
    setActiveTab(tab);
    setSelectedItems([]);
  };

  const toggleSelection = (id) => {
    if (id == null) return;
    const sid = String(id);
    setSelectedItems((prev) => (prev.some((x) => String(x) === sid) ? prev.filter((v) => String(v) !== sid) : [...prev, id]));
  };

  const isSelected = (id) => selectedItems.some((x) => String(x) === String(id));

  const handleCompare = () => {
    if (selectedItems.length < 2) return;
    const items = dataList.filter((it) => isSelected(rowId(it)));
    navigate("/CompareResults", {
      state: {
        selectedIds: selectedItems,
        type: evalType,
        session: selectedSession,
        mode: activeTab === "Teachers" ? "teachers" : "courses",
        items,
      },
    });
  };

  const goCourseCompare = (item) => {
    const courseId = item.CourseNo ?? item.courseNo ?? item.CourseID ?? item.CourseId;
    const courseName = item.CourseName ?? item.courseName ?? "Course";
    if (!courseId) {
      window.alert("Missing course id for this row.");
      return;
    }
    navigate("/CompareScreenFrom_C_T", {
      state: {
        courseId,
        courseName,
        session: selectedSession,
      },
    });
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

        <h2 className="rc-dashboard-title">Analytics &amp; feedback</h2>

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
                  <option key={i} value={s}>
                    {s}
                  </option>
                ))
              )}
            </select>
          </div>

          {activeTab === "Teachers" && (
            <div className="rc-sub-tabs">
              <button
                type="button"
                className={`rc-sub-tab ${evalType === "Student" ? "active" : ""}`}
                onClick={() => setEvalType("Student")}
              >
                Student eval
              </button>
              <button
                type="button"
                className={`rc-sub-tab ${evalType === "Peer" ? "active" : ""}`}
                onClick={() => setEvalType("Peer")}
              >
                Peer eval
              </button>
            </div>
          )}

          <div className="rc-list-scroll">
            {loading ? (
              <div className="rc-status-msg">Loading records…</div>
            ) : dataList.length === 0 ? (
              <div className="rc-status-msg">No records found</div>
            ) : (
              <div className="rc-list">
                {dataList.map((item, idx) => {
                  const id = rowId(item);
                  const displayName = item.TeacherName || item.CourseName || "Untitled";
                  const isTeacherTab = activeTab === "Teachers";
                  const selected = isSelected(id);

                  return (
                    <div
                      key={String(id ?? idx)}
                      className={`rc-row ${idx !== dataList.length - 1 ? "rc-row-border" : ""} ${selected ? "selected" : ""}`}
                    >
                      <div className="rc-row-main">
                        <button
                          type="button"
                          className={`rc-check ${selected ? "checked" : ""}`}
                          onClick={() => toggleSelection(id)}
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
                            <p className="rc-sub">{item.CourseNo ?? item.courseNo ?? ""}</p>
                          )}
                        </div>
                      </div>

                      {isTeacherTab ? (
                        <div className="rc-rating-box">
                          <span className="rc-rating-label">{evalType.toUpperCase()}</span>
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
          <button
            type="button"
            className="rc-compare-btn"
            disabled={selectedItems.length < 2}
            onClick={handleCompare}
          >
            Compare selected ({selectedItems.length})
          </button>
          <button type="button" className="rc-dash-btn" onClick={() => navigate("/DirectorDashboard")}>
            Back to dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default RCEvaluation;
