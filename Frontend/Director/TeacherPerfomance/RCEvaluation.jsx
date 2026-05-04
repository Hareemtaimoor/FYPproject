import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import APIEndPoint from "../../unity.js";
import "./RCEvaluation.css";
import logo from "../../Images/Biit_Logo.png";
import avatar from "../../Images/maleAvatar.png";

const api = (path) => `${APIEndPoint}${path.replace(/^\//, "")}`;

const RCEvaluation = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Teachers");
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState("");
  const [dataList, setDataList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await axios.get(api("Director/GetAllSessions"));
        const list = Array.isArray(response.data) ? response.data : [];
        setSessions(list);
        if (list.length > 0) setSelectedSession(list[0]);
      } catch (error) {
        console.error("Session Load Error", error);
        setMessage("Could not load sessions.");
      }
    };
    fetchSessions();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedSession) return;
      setLoading(true);
      setSelectedItems([]);
      setMessage("");

      if (activeTab === "Confidential") {
        setDataList([]);
        setLoading(false);
        setMessage("Confidential list will appear here after API integration.");
        return;
      }

      try {
        const endpoint =
          activeTab === "Teachers"
            ? api(`Director/GetAllocatedTeachers?session=${encodeURIComponent(selectedSession)}`)
            : api(`Director/GetAllocatedCourses?session=${encodeURIComponent(selectedSession)}`);

        const response = await axios.get(endpoint);
        let fetchedData = Array.isArray(response.data) ? response.data : [];

        if (activeTab === "Teachers") {
          try {
            const ratingRes = await axios.get(
              api(`Director/GetTeacherAverageRatings?session=${encodeURIComponent(selectedSession)}`)
            );
            const ratingList = Array.isArray(ratingRes.data) ? ratingRes.data : [];
            fetchedData = fetchedData.map((teacher) => {
              const match = ratingList.find(
                (r) =>
                  String(r.TeacherID).trim().toUpperCase() ===
                  String(teacher.TeacherID).trim().toUpperCase()
              );
              return {
                ...teacher,
                AverageRating:
                  match && match.AverageRating != null ? Number(match.AverageRating).toFixed(1) : "N/A",
              };
            });
          } catch {
            // keep teacher list without ratings
          }
        }

        setDataList(fetchedData);
        if (fetchedData.length === 0) setMessage("No records found for selected session.");
      } catch (error) {
        console.error("Data Load Error", error);
        setDataList([]);
        setMessage("Could not load records. Please check API connection.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab, selectedSession]);

  const toggleSelection = (id) => {
    if (id == null) return;
    setSelectedItems((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  };

  const handleCompare = () => {
    if (selectedItems.length < 2) return;
    alert("Compare flow is ready. You can now wire this button to your compare screen.");
  };

  return (
    <div className="rc-page">
      <div className="rc-container">
        <div className="rc-logo-wrap">
          <img src={logo} alt="BIIT Logo" className="rc-logo" />
        </div>

        <div className="rc-card rc-profile-card">
          <div className="rc-card-title">Director Information</div>
          <div className="rc-profile-body">
            <div className="rc-profile-text">
              <p>
                Name: <strong>Dr. Jamil Sawar</strong>
              </p>
              <p>Designation: Director</p>
            </div>
            <img src={avatar} alt="Director" className="rc-avatar" />
          </div>
        </div>

        <div className="rc-tabs">
          {["Teachers", "Courses", "Confidential"].map((tab) => (
            <button
              key={tab}
              type="button"
              className={`rc-tab-btn ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
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

          <div className="rc-list-scroll">
            {loading ? (
              <div className="rc-status-msg">Loading records...</div>
            ) : dataList.length === 0 ? (
              <div className="rc-status-msg">{message || "No data found."}</div>
            ) : (
              <div className="rc-list">
                {dataList.map((item, idx) => {
                  const id = item.TeacherID ?? item.CourseNo ?? idx;
                  const isSelected = selectedItems.includes(id);
                  return (
                    <button
                      type="button"
                      key={String(id)}
                      onClick={() => toggleSelection(id)}
                      className={`rc-row ${isSelected ? "selected" : ""}`}
                    >
                      <div className="rc-row-main">
                        <div className={`rc-check ${isSelected ? "checked" : ""}`}>{isSelected ? "✓" : ""}</div>
                        <div className="rc-row-text">
                          <p className="rc-name">{item.TeacherName || item.CourseName || "Untitled"}</p>
                          <p className="rc-sub">{item.Designation || item.CourseNo || "General"}</p>
                        </div>
                      </div>

                      {activeTab === "Teachers" ? (
                        <div className="rc-badge">
                          <small>AVG</small>
                          <strong>{item.AverageRating === "N/A" ? "--" : item.AverageRating}</strong>
                        </div>
                      ) : (
                        <span className="rc-arrow">➔</span>
                      )}
                    </button>
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
            disabled={selectedItems.length < 2 || activeTab !== "Teachers"}
            onClick={handleCompare}
          >
            Compare Selected ({selectedItems.length})
          </button>
          <button type="button" className="rc-dash-btn" onClick={() => navigate("/DirectorDashboard")}>
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default RCEvaluation;