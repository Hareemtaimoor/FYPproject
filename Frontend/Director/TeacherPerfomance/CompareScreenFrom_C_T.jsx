import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import APIEndPoint from "../../unity.js";
import "./CompareScreenFrom_C_T.css";
import logo from "../../Images/Biit_Logo.png";
import avatar from "../../Images/maleAvatar.png";

const api = (path) => `${APIEndPoint}${String(path).replace(/^\//, "")}`;

const CompareScreenFrom_C_T = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = location.state || {};

  const courseId = params.courseId;
  const courseName = params.courseName;
  const session = params.session;

  const [loading, setLoading] = useState(false);
  const [teacherList, setTeacherList] = useState([]);
  const [selectedTeachers, setSelectedTeachers] = useState([]);
  const [allQuestions, setAllQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [graphData, setGraphData] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    if (!courseId || !session) return;
    loadInitialData();
  }, [courseId, session]);

  const filteredQuestions = useMemo(() => {
    return allQuestions.filter((q) => {
      const idOk = String(q.Question_ID || "").includes(searchQuery);
      const textOk = String(q.Question || "").toLowerCase().includes(searchQuery.toLowerCase());
      return idOk || textOk;
    });
  }, [allQuestions, searchQuery]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const resT = await axios.get(
        api(`Director/GetTeachersByCourse?courseId=${encodeURIComponent(courseId)}&session=${encodeURIComponent(session)}`)
      );
      const tList = Array.isArray(resT.data) ? resT.data : [];
      const uniqueTeachers = Array.from(new Map(tList.map((item) => [String(item.TeacherID), item])).values());
      setTeacherList(uniqueTeachers);

      const resQ = await axios.get(api("Director/GetQuestionsList"));
      const qList = Array.isArray(resQ.data) ? resQ.data : [];
      const uniqueQuestions = Array.from(new Map(qList.map((item) => [String(item.Question_ID), item])).values());
      setAllQuestions(uniqueQuestions);
      setSelectedQuestions(uniqueQuestions.map((q) => q.Question_ID));
    } catch (e) {
      window.alert("Data Error: Failed to load teachers or questions.");
    } finally {
      setLoading(false);
    }
  };

  const getTeacherColor = (index) => {
    const palette = ["#FFD700", "#FF8C00", "#AF52DE", "#FF2D55", "#5856D6", "#34C759"];
    return palette[index % palette.length];
  };

  const teacherKey = (t) => String(t.TeacherID ?? t.teacherID ?? "");

  const toggleTeacher = (teacherId) => {
    const key = String(teacherId);
    setSelectedTeachers((prev) =>
      prev.some((x) => String(x) === key) ? prev.filter((x) => String(x) !== key) : [...prev, teacherId]
    );
  };

  const isTeacherSelected = (t) => selectedTeachers.some((x) => String(x) === teacherKey(t));

  const toggleQuestion = (questionId) => {
    const key = String(questionId);
    setSelectedQuestions((prev) =>
      prev.some((x) => String(x) === key) ? prev.filter((x) => String(x) !== key) : [...prev, questionId]
    );
  };

  const handleShowEvaluation = async () => {
    if (selectedTeachers.length === 0) {
      window.alert("Selection Missing: Please select at least one teacher.");
      return;
    }
    if (!selectedQuestions.length) {
      window.alert("Please select at least one question (use Edit questions).");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(api("Director/GetComparisonData"), {
        TeacherIds: selectedTeachers,
        QuestionIds: selectedQuestions,
        CourseId: courseId,
        Session: session,
      });
      formatGraphData(Array.isArray(response.data) ? response.data : []);
    } catch (e) {
      window.alert("Error: Could not fetch evaluation data.");
    } finally {
      setLoading(false);
    }
  };

  const formatGraphData = (apiData) => {
    if (!selectedQuestions.length) {
      setGraphData([]);
      return;
    }
    const sortedQIds = [...selectedQuestions].sort((a, b) => Number(a) - Number(b));
    const points = sortedQIds.map((qId) => {
      const row = { label: `Q${qId}` };
      selectedTeachers.forEach((tId, idx) => {
        const key = `t_${tId}`;
        const match = apiData.find(
          (d) => String(d.TeacherID) === String(tId) && parseInt(d.QuestionNo, 10) === parseInt(qId, 10)
        );
        row[key] = match ? Number(match.AverageRating) : 0;
        row[`c_${tId}`] = getTeacherColor(idx);
      });
      return row;
    });
    setGraphData(points);
  };

  if (!courseId || !session) {
    return (
      <div className="cct-main">
        <div className="cct-wrap">
          <div className="cct-missing">
            <h2>Missing course/session</h2>
            <p>Please open this screen from course selection in RC Evaluation.</p>
            <button type="button" className="cct-back-btn" onClick={() => navigate("/RCEvaluation")}>
              Back
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
            <span className="cct-label-bold">COURSE: </span>
            <span className="cct-value-normal">{courseName || "N/A"}</span>
          </div>
          <div className="cct-divider" />
          <div className="cct-info-row">
            <span className="cct-label-bold">SESSION: </span>
            <span className="cct-value-normal">{session}</span>
          </div>
        </div>

        <h3 className="cct-section-title">Select Teachers to Compare:</h3>

        <div className="cct-list-wrapper">
          {teacherList.map((t) => {
            const tid = t.TeacherID ?? t.teacherID;
            const isSelected = isTeacherSelected(t);
            return (
              <button
                type="button"
                key={`t-${tid}`}
                className="cct-list-item"
                onClick={() => toggleTeacher(tid)}
              >
                <div className={`cct-checkbox ${isSelected ? "checked" : ""}`}>{isSelected ? "✓" : ""}</div>
                <img src={avatar} alt="" className="cct-list-avatar" />
                <div className="cct-list-content">
                  <p className="cct-item-label">TEACHER</p>
                  <p className="cct-item-title">{t.TeacherName}</p>
                  <p className="cct-sub-text">{t.Designation || "Lecturer"}</p>
                </div>
              </button>
            );
          })}
        </div>

        <button type="button" className="cct-eval-btn" onClick={handleShowEvaluation}>
          Show Evaluation
        </button>

        {graphData.length > 0 && (
          <div className="cct-graph-card">
            <h4 className="cct-graph-header">Performance Comparison</h4>
            <div className="cct-chart-scroll">
              <div style={{ width: Math.max(380, graphData.length * 60), height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={graphData}>
                    <CartesianGrid stroke="#e3e3e3" strokeDasharray="" />
                    <XAxis dataKey="label" />
                    <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} />
                    <Tooltip />
                    {selectedTeachers.map((tId, index) => {
                      const teacher = teacherList.find((tt) => String(tt.TeacherID) === String(tId));
                      return (
                        <Line
                          key={String(tId)}
                          type="monotone"
                          dataKey={`t_${tId}`}
                          name={(teacher?.TeacherName || "TEACHER").toUpperCase()}
                          stroke={getTeacherColor(index)}
                          strokeWidth={3}
                          dot={{ r: 4 }}
                        />
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="cct-legend-container">
              {selectedTeachers.map((tId, index) => {
                const teacher = teacherList.find((t) => String(t.TeacherID) === String(tId));
                return (
                  <div key={String(tId)} className="cct-legend-item">
                    <span className="cct-legend-dot" style={{ backgroundColor: getTeacherColor(index) }} />
                    <span className="cct-legend-text">{(teacher?.TeacherName || "TEACHER").toUpperCase()}</span>
                  </div>
                );
              })}
            </div>

            <button type="button" className="cct-edit-btn" onClick={() => setShowEditModal(true)}>
              Edit Questions
            </button>
          </div>
        )}

        {loading && <div className="cct-loading">Loading...</div>}

        <button type="button" className="cct-back-btn" onClick={() => navigate(-1)}>
          Back to Dashboard
        </button>
      </div>

      {showEditModal && (
        <div className="cct-modal-overlay">
          <div className="cct-modal-body">
            <div className="cct-modal-header-row">
              <h3 className="cct-modal-header">Select Questions</h3>
              <span className="cct-total-count">Total: {allQuestions.length}</span>
            </div>

            <div className="cct-search-container">
              <span className="cct-search-icon">🔍</span>
              <input
                className="cct-search-input"
                placeholder="Search Question No. or Text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="cct-control-row">
              <button type="button" className="cct-deselect-btn" onClick={() => setSelectedQuestions([])}>
                Deselect All
              </button>
              <button
                type="button"
                className="cct-select-btn"
                onClick={() => setSelectedQuestions(allQuestions.map((q) => q.Question_ID))}
              >
                Select All
              </button>
            </div>

            <div className="cct-modal-list">
              {filteredQuestions.map((item) => {
                const qid = item.Question_ID;
                const isSelected = selectedQuestions.some((x) => String(x) === String(qid));
                return (
                  <button
                    key={String(item.Question_ID)}
                    type="button"
                    className="cct-modal-item"
                    onClick={() => toggleQuestion(item.Question_ID)}
                  >
                    <div className={`cct-checkbox ${isSelected ? "checked" : ""}`}>{isSelected ? "✓" : ""}</div>
                    <p className="cct-modal-item-txt">
                      <strong>Q{item.Question_ID}: </strong>
                      {item.Question}
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
              Apply Filter ({selectedQuestions.length})
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompareScreenFrom_C_T;