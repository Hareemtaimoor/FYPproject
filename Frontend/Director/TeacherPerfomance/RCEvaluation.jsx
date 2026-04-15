import React, { useState, useEffect } from "react";
import axios from "axios";
import "./RCEvaluation.css";
import ApiEndPoint from '../../unity.js'; 

const RCEvaluation = () => {
  const [activeTab, setActiveTab] = useState("Teachers");
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState("");
  const [dataList, setDataList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);

  useEffect(() => { fetchSessions(); }, []);
  useEffect(() => { if (selectedSession) fetchData(); }, [activeTab, selectedSession]);

  const fetchSessions = async () => {
    try {
      const response = await axios.get(`${APIEndPoint}/Director/GetAllSessions`);
      setSessions(response.data);
      if (response.data.length > 0) setSelectedSession(response.data[0]);
    } catch (error) { console.error("Error:", error); }
  };

  const fetchData = async () => {
    if (!selectedSession) return;
    setLoading(true);
    try {
      const type = activeTab === "Teachers" ? "Teachers" : "Courses";
      const response = await axios.get(`${APIEndPoint}/Director/GetAllocated${type}?session=${encodeURIComponent(selectedSession)}`);
      setDataList(response.data);
    } catch (error) { setDataList([]); }
    finally { setLoading(false); }
  };

  const toggleSelection = (id) => {
    setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  return (
    <div className="app-container">
      {/* Top Header Card */}
      <header className="header-card">
        <div className="info">
          <h2 className="title">Director Information</h2>
          <p className="detail">Dr. Jamil Sawar</p>
          <p className="detail sub">Admin Head</p>
        </div>
        <div className="avatar-circle">JS</div>
      </header>

      <main className="main-content">
        {/* Navigation Tabs - Vertical on Web, Horizontal on Mobile */}
        <nav className="tab-sidebar">
          {["Teachers", "Courses", "Confidential"].map((tab) => (
            <button
              key={tab}
              className={`tab-btn ${activeTab === tab ? "active" : ""}`}
              onClick={() => { setActiveTab(tab); setSelectedItems([]); }}
            >
              {tab}
            </button>
          ))}
        </nav>

        {/* List Area */}
        <section className="list-panel">
          <div className="session-selector">
            <select value={selectedSession} onChange={(e) => setSelectedSession(e.target.value)}>
              {sessions.map((s, i) => <option key={i} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="scroll-list">
            {loading ? <div className="loader">Loading...</div> : 
              dataList.map((item, idx) => {
                const id = item.TeacherID || item.CourseNo;
                const isSelected = selectedItems.includes(id);
                return (
                  <div key={idx} className="card-item">
                    <div className="card-left">
                      <div className={`custom-check ${isSelected ? 'checked' : ''}`} onClick={() => toggleSelection(id)}>
                        {isSelected && "✓"}
                      </div>
                      <div className="card-info">
                        <span className="name">{item.TeacherName || item.CourseName}</span>
                        <span className="desc">{item.Designation || item.CourseNo}</span>
                      </div>
                    </div>
                    {activeTab === "Teachers" ? (
                      <div className="badge">
                        <small>Rating</small>
                        <strong>{item.AverageRating || "0.0"}</strong>
                      </div>
                    ) : <span className="arrow-icon">➔</span>}
                  </div>
                );
              })
            }
          </div>

          <button className="btn-compare" disabled={selectedItems.length < 2}>
            Compare ({selectedItems.length})
          </button>
        </section>
      </main>

      <footer className="footer">
        <button className="btn-dash">🏠 Dashboard</button>
      </footer>
    </div>
  );
};

export default RCEvaluation;