import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./CompareResults.css";
import logo from "../../Images/Biit_Logo.png";

/**
 * Legacy route: teacher comparison now opens CompareScreenFrom_C_T (same graph + GraphRequest as React Native).
 * Deep links and bookmarks redirect when valid state is present.
 */
const CompareResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedIds = [], type = "Student", session = "", mode = "teachers", items = [] } = location.state || {};

  useEffect(() => {
    if (session && mode === "teachers" && Array.isArray(items) && items.length >= 1) {
      navigate("/TeacherPerformanceDashboard", {
        replace: true,
        state: {
          teachers: items,
          type,
          session,
        },
      });
    }
  }, [session, mode, items, type, navigate]);

  if (!session || selectedIds.length === 0) {
    return (
      <div className="cr-page">
        <div className="cr-card">
          <h1 className="cr-title">Nothing to compare</h1>
          <p className="cr-muted">Open this screen from RC Evaluation after selecting at least one teacher row.</p>
          <button type="button" className="cr-btn" onClick={() => navigate("/RCEvaluation")}>
            Back to RC evaluation
          </button>
        </div>
      </div>
    );
  }

  if (mode === "teachers" && items.length >= 1) {
    return (
      <div className="cr-page">
        <div className="cr-inner">
          <img src={logo} alt="" className="cr-logo" />
          <div className="cr-card">
            <h1 className="cr-title">Opening performance dashboard…</h1>
            <p className="cr-muted">Redirecting.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cr-page">
      <div className="cr-inner">
        <img src={logo} alt="" className="cr-logo" />
        <div className="cr-card">
          <h1 className="cr-title">Compare results</h1>
          <p className="cr-line">
            <strong>Session:</strong> {session}
          </p>
          <p className="cr-line">
            <strong>Evaluation type:</strong> {type}
          </p>
          <p className="cr-line">
            <strong>Mode:</strong> {mode}
          </p>
          <p className="cr-line">
            <strong>Selected ({selectedIds.length}):</strong>
          </p>
          <ul className="cr-list">
            {items.length > 0
              ? items.map((it, i) => (
                  <li key={i}>
                    {it.TeacherName || it.CourseName || String(it.TeacherID ?? it.CourseNo ?? i)}
                  </li>
                ))
              : selectedIds.map((id, i) => (
                  <li key={i}>{String(id)}</li>
                ))}
          </ul>
          <p className="cr-note">
            For question-level line charts across teachers and courses, use RC Evaluation →{" "}
            <strong>Compare selected teachers</strong> or <strong>Course comparison chart</strong>.
          </p>
          <button type="button" className="cr-btn" onClick={() => navigate("/RCEvaluation")}>
            Back to RC evaluation
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompareResults;
