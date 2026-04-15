import React from "react";
import "./EvaluationRate.css";
import logo from "../Images/Biit_Logo.png";
import avatar from "../Images/avatar.png";

const EvaluationRate = () => {
  const stats = [
    { label: "By Students", percent: "85%", rating: "Excellent" },
    { label: "By Admin", percent: "96%", rating: "Excellent" },
    { label: "By Peers", percent: "94%", rating: "Excellent" },
  ];

  return (
    <div className="web-main-container">
      <div className="eval-rate-card">
        
        {/* Sidebar */}
        <div className="eval-sidebar">
          <img src={logo} alt="BIIT Logo" className="card-logo" />
          <div className="avatar-wrapper">
            <img src={avatar} alt="User Avatar" className="avatar-img" />
          </div>
          <div className="profile-info">
            <h3 className="user-name">Ms. Nadia Arif</h3>
            <p className="user-role">Assistant Director</p>
          </div>
          <button className="home-action-btn">🏠 Home</button>
        </div>

        {/* Content Section */}
        <div className="eval-rate-content">
          <h2 className="content-title">Performance Evaluation</h2>
          
          <div className="stats-grid">
            {stats.map((item, index) => (
              <div key={index} className="stat-box">
                <span className="stat-label">{item.label}</span>
                <div className="progress-circle">
                  <span className="percent-text">{item.percent}</span>
                </div>
                <span className="rating-text">{item.rating}</span>
              </div>
            ))}
          </div>

          <div className="summary-footer">
            <p>Overall performance is based on the feedback from students, administration, and peers.</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default EvaluationRate;