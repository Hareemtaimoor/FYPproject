import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  directorGet,
  asArray,
  getGenderFeedbackResult,
  formatGenderShare,
  formatGenderOverall,
} from "../../directorApi.js";
import "./GenderAnalytics.css";
import logo from "../../Images/Biit_Logo.png";
import avatar from "../../Images/maleAvatar.png";

const GenderAnalytics = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Teachers");
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);

  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState("placeholder");
  const [dataList, setDataList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [stats, setStats] = useState(null);
  const [selectedItemName, setSelectedItemName] = useState("Overall");
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const data = await directorGet("Director/GetAllSessions");
        setSessions(asArray(data));
      } catch (e) {
        console.error("Error loading sessions:", e?.message);
      }
    };
    fetchSessions();
  }, []);

  useEffect(() => {
    const fetchTabData = async () => {
      if (!selectedSession || selectedSession === "placeholder") {
        setDataList([]);
        return;
      }
      setLoading(true);
      setSearchQuery("");
      setStats(null);
      setSelectedId(null);
      try {
        const q = encodeURIComponent(selectedSession);
        const path =
          activeTab === "Teachers"
            ? `Director/GetAllocatedTeachers?session=${q}`
            : `Director/GetAllocatedCourses?session=${q}`;
        const data = await directorGet(path);
        setDataList(asArray(data));
      } catch {
        setDataList([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTabData();
  }, [activeTab, selectedSession]);

  const filteredData = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return dataList;
    return dataList.filter((item) => {
      const name = (item.TeacherName || item.CourseName || "").toLowerCase();
      const id = String(item.TeacherID ?? item.CourseNo ?? "").toLowerCase();
      return name.includes(q) || id.includes(q);
    });
  }, [dataList, searchQuery]);

  const fetchGenderStats = async (id, name) => {
    if (!selectedSession || selectedSession === "placeholder") return;
    setStatsLoading(true);
    setStats(null);
    setSelectedItemName(name);
    setSelectedId(id);
    try {
      const result = await getGenderFeedbackResult(
        activeTab === "Teachers"
          ? { session: selectedSession, teacherId: id }
          : { session: selectedSession, courseId: id }
      );
      setStats(result);
    } catch (e) {
      console.error("Stats error:", e?.message);
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  };

  const femaleDisplay = stats ? formatGenderShare(stats.female) : "—";
  const maleDisplay = stats ? formatGenderShare(stats.male) : "—";
  const overallDisplay = stats ? formatGenderOverall(stats.overall) : "—";

  return (
    <div className="ga-page">
      <div className="ga-scroll">
        <div className="ga-inner">
          <div className="ga-logo-wrap">
            <img src={logo} alt="BIIT" className="ga-logo" />
          </div>

          <div className="ga-profile-card">
            <div className="ga-profile-info">
              <p className="ga-p-text">
                Name: <span className="ga-bold">DR. MOHAMMAD JAMIL SAWAR</span>
              </p>
              <p className="ga-p-text">
                Role: <span className="ga-bold">Director</span>
              </p>
              <p className="ga-p-sub">BIIT Administration</p>
            </div>
            <img src={avatar} alt="" className="ga-avatar" />
          </div>

          <h1 className="ga-section-title">GENDER ANALYSIS</h1>

          <div className="ga-white-box">
            <p className="ga-box-label">SELECT ACADEMIC SESSION</p>
            <div className="ga-select-wrap">
              <select
                className="ga-select"
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value)}
                aria-label="Academic session"
              >
                <option value="placeholder">— Choose Session —</option>
                {sessions.map((s, i) => (
                  <option key={`${s}-${i}`} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="ga-unified">
            <div className="ga-tabs" role="tablist" aria-label="Data type">
              {["Teachers", "Courses"].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab}
                  className={`ga-tab ${activeTab === tab ? "ga-tab--active" : ""}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="ga-search-wrap">
              <input
                type="search"
                className="ga-search"
                placeholder={`Search ${activeTab}…`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoComplete="off"
              />
            </div>
          </div>

          <div className="ga-list-panel">
            {loading ? (
              <div className="ga-list-loading">Loading…</div>
            ) : filteredData.length === 0 ? (
              <div className="ga-list-empty">No data available.</div>
            ) : (
              <ul className="ga-list">
                {filteredData.map((item, index) => {
                  const id = item.TeacherID ?? item.CourseNo;
                  const name = item.TeacherName || item.CourseName || "—";
                  const designation = item.Designation;
                  const isSelected = selectedId != null && String(selectedId) === String(id);

                  return (
                    <li key={`${String(id)}-${index}`} className="ga-card">
                      <div className="ga-card-head">
                        <span className="ga-qid">ID: {id}</span>
                        <span className="ga-type-tag">{activeTab === "Teachers" ? "Teacher" : "Course"}</span>
                      </div>
                      <p className="ga-card-title">{name}</p>
                      {activeTab === "Teachers" && designation ? (
                        <p className="ga-designation">{designation}</p>
                      ) : null}
                      <div className="ga-card-actions">
                        <button
                          type="button"
                          className={`ga-analyze-btn ${isSelected ? "ga-analyze-btn--selected" : ""}`}
                          onClick={() => fetchGenderStats(id, name)}
                          disabled={statsLoading}
                        >
                          {isSelected ? "Selected ✓" : "Analyze Feedback"}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {statsLoading && (
            <p className="ga-stats-hint" role="status">
              Loading stats…
            </p>
          )}

          {stats && !statsLoading && (
            <div className="ga-stats">
              <p className="ga-analysis-for">
                RESULTS FOR: <span className="ga-analysis-name">{selectedItemName}</span>
              </p>
              <div className="ga-stat-row">
                <div className="ga-stat-card ga-stat-card--female">
                  <span className="ga-emoji" aria-hidden>
                    👩
                  </span>
                  <span className="ga-stat-value">{femaleDisplay}</span>
                  <span className="ga-stat-label">Female (share)</span>
                </div>
                <div className="ga-stat-card ga-stat-card--male">
                  <span className="ga-emoji" aria-hidden>
                    👨
                  </span>
                  <span className="ga-stat-value">{maleDisplay}</span>
                  <span className="ga-stat-label">Male (share)</span>
                </div>
              </div>
              <div className="ga-overall-card">
                <span className="ga-overall-value">{overallDisplay}</span>
                <span className="ga-overall-label">Overall satisfaction</span>
              </div>
            </div>
          )}

          <button type="button" className="ga-back" onClick={() => navigate("/DirectorDashboard")}>
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default GenderAnalytics;
