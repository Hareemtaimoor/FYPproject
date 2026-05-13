import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./CompareResults.css";
import logo from "../../Images/Biit_Logo.png";

/**
 * Receives navigation state from RC Evaluation "Compare" (RN: CompareResults).
 * state: { selectedIds, type: "Student"|"Peer", session, mode: "teachers"|"courses", items?: [] }
 */
const CompareResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedIds = [], type = "Student", session = "", mode = "teachers", items = [] } = location.state || {};

  if (!session || selectedIds.length === 0) {
    return (
      <div className="cr-page">
        <div className="cr-card">
          <h1 className="cr-title">Nothing to compare</h1>
          <p className="cr-muted">Open this screen from RC Evaluation after selecting at least two rows.</p>
          <button type="button" className="cr-btn" onClick={() => navigate("/RCEvaluation")}>
            Back to RC evaluation
          </button>
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
            Chart or detailed comparison can be wired here when the backend exposes an endpoint for these selections.
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
