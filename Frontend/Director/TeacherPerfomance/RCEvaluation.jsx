import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import APIEndPoint from "../../unity.js";
import "./RCEvaluation.css";
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
        const list = unwrapList(response.data);
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
        let endpoint = "";
        if (activeTab === "Teachers") {
          endpoint = api(
            `Director/GetAllocatedTeachers?session=${encodeURIComponent(selectedSession)}`
          );
        } else if (activeTab === "Courses") {
          endpoint = api(
            `Director/GetAllocatedCourses?session=${encodeURIComponent(selectedSession)}`
          );
        }

        const response = await axios.get(endpoint);
        let fetchedData = unwrapList(response.data);

        if (activeTab === "Teachers") {
          try {
            let ratingsMap = [];
            const sessionQ = encodeURIComponent(selectedSession);

            if (evalType === "Student") {
              const ratingRes = await axios.get(
                api(`Director/GetTeacherAverageRatings?session=${sessionQ}`)
              );
              ratingsMap = unwrapList(ratingRes.data);
            } else if (evalType === "Peer") {
              const ratingRes = await axios.get(
                api(`Director/GetPeerAverageRatings?session=${sessionQ}`)
              );
              ratingsMap = unwrapList(ratingRes.data);
            } else if (evalType === "Confidential") {
              const ratingRes = await axios.get(
                api(`Director/GetConfidentialTeacherAverageRatings?semester=${sessionQ}`)
              );
              ratingsMap = unwrapList(ratingRes.data);
            }

            fetchedData = fetchedData.map((teacher) => {
              const ratingObj = ratingsMap.find(
                (r) =>
                  String(r.TeacherID).trim().toUpperCase() ===
                  String(teacher.TeacherID).trim().toUpperCase()
              );
              return {
                ...teacher,
                AverageRating: ratingObj
                  ? Number(ratingObj.AverageRating).toFixed(1)
                  : "N/A",
              };
            });
          } catch (e) {
            console.log(`${evalType} Ratings fetch failed.`, e?.message ?? e);
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

  const toggleSelection = (id) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter((item) => item !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  const handleCompare = () => {
    if (selectedItems.length === 0) return;

    const selectedTeachersList = dataList.filter((item) =>
      selectedItems.includes(item.TeacherID || item.CourseNo)
    );

    if (selectedTeachersList.length > 0) {
      navigate("/TeacherPerformanceDashboard", {
        state: {
          teachers: selectedTeachersList,
          type: evalType,
          session: selectedSession,
        },
      });
    }
  };

  const goCourseCompare = (item) => {
    const id = item.TeacherID || item.CourseNo;
    const displayName = item.TeacherName || item.CourseName;
    navigate("/CompareScreenFrom_C_T", {
      state: {
        courseId: id,
        courseName: displayName,
        session: selectedSession,
      },
    });
  };

  return (
    <div className="rc-page rc-page--rn">
      <div className="rc-container rc-container--rn">
        <div className="rc-top-wrapper">
          <div className="rc-logo-container">
            <img src={logo} alt="BIIT Logo" className="rc-logo-rn" />
          </div>
          <div className="rc-profile-card-rn">
            <div className="rc-profile-info-rn">
              <p className="rc-p-text-rn">
                Name: <span className="rc-bold-rn">DR. JAMIL SAWAR</span>
              </p>
              <p className="rc-p-text-rn">
                Role: <span className="rc-bold-rn">Director</span>
              </p>
              <p className="rc-p-sub-rn">BIIT Administration</p>
            </div>
            <img src={avatar} alt="Director" className="rc-avatar-rn" />
          </div>
        </div>

        <h2 className="rc-dashboard-title-rn">ANALYTICS &amp; FEEDBACK</h2>

        <div className="rc-tabs-rn">
          {["Teachers", "Courses"].map((tab) => (
            <button
              key={tab}
              type="button"
              className={`rc-tab-btn-rn ${activeTab === tab ? "rc-tab-btn-rn--active" : ""}`}
              onClick={() => {
                setActiveTab(tab);
                setSelectedItems([]);
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="rc-picker-container">
          <select
            className="rc-picker-select"
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
          >
            {sessions.map((s, i) => (
              <option key={i} label={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {activeTab === "Teachers" && (
          <div className="rc-sub-tab-container">
            <button
              type="button"
              className={`rc-sub-tab-btn ${evalType === "Student" ? "rc-sub-tab-btn--active" : ""}`}
              onClick={() => setEvalType("Student")}
            >
              Student Eval
            </button>
            <button
              type="button"
              className={`rc-sub-tab-btn ${evalType === "Peer" ? "rc-sub-tab-btn--active" : ""}`}
              onClick={() => setEvalType("Peer")}
            >
              Peer Eval
            </button>
            <button
              type="button"
              className={`rc-sub-tab-btn ${evalType === "Confidential" ? "rc-sub-tab-btn--active" : ""}`}
              onClick={() => setEvalType("Confidential")}
            >
              Confidential
            </button>
          </div>
        )}

        {loading ? (
          <p className="rc-loading-rn">Loading…</p>
        ) : (
          <div className="rc-list-wrapper">
            {dataList.length === 0 ? (
              <p className="rc-empty-rn">No records found</p>
            ) : (
              dataList.map((item, index) => {
                const id = item.TeacherID || item.CourseNo;
                const displayName = item.TeacherName || item.CourseName;
                const isSelected = selectedItems.includes(id);
                const isTeacherTab = activeTab === "Teachers";

                return (
                  <div
                    key={`${id}-${index}`}
                    className={`rc-list-item ${index !== dataList.length - 1 ? "rc-list-item-border" : ""}`}
                  >
                    <div className="rc-item-left">
                      <button
                        type="button"
                        className={`rc-checkbox-rn ${isSelected ? "rc-checkbox-rn--checked" : ""}`}
                        onClick={() => toggleSelection(id)}
                      >
                        {isSelected ? "✓" : ""}
                      </button>
                      <div className="rc-item-text-wrap">
                        <p className="rc-item-title">{displayName}</p>
                        {item.Designation && (
                          <p className="rc-sub-text-green">{item.Designation}</p>
                        )}
                      </div>
                    </div>

                    {isTeacherTab ? (
                      <div className="rc-rating-box-rn">
                        <span className="rc-rating-label-rn">{evalType.toUpperCase()}</span>
                        <span className="rc-rating-value-rn">
                          {item.AverageRating === "N/A" ? "--" : item.AverageRating}
                        </span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="rc-action-btn-small"
                        onClick={() => goCourseCompare(item)}
                      >
                        ➔
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        <footer className="rc-footer-rn">
          <button
            type="button"
            className="rc-compare-btn-rn"
            disabled={selectedItems.length === 0}
            style={selectedItems.length === 0 ? { opacity: 0.5 } : undefined}
            onClick={handleCompare}
          >
            Compare selected ({selectedItems.length})
          </button>
          <button type="button" className="rc-home-btn-rn" onClick={() => navigate("/DirectorDashboard")}>
            🏠 Back to Dashboard
          </button>
        </footer>
      </div>
    </div>
  );
};

export default RCEvaluation;
