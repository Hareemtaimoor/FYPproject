import React from "react";
import { useNavigate } from "react-router-dom";
import "./DirectorDashboard.css";

// Assets
import logo from "../Images/Biit_Logo.png";
import avatar from "../Images/maleAvatar.png";

const DirectorDashboard = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        if (window.confirm("Are you sure you want to logout?")) {
            navigate("/");
        }
    };

    return (
        <div className="app-viewport">
            <div className="app-container">
                
                {/* Compact Header */}
                <header className="app-header">
                    <img src={logo} alt="BIIT Logo" className="header-logo" />
                </header>

                {/* Director Profile Card */}
                <section className="profile-section">
                    <div className="profile-card">
                        <div className="profile-details">
                            <h2 className="profile-name">Dr. Jamil Sawar</h2>
                            <p className="profile-role">Director</p>
                        </div>
                        <div className="profile-avatar-wrap">
                            <img src={avatar} alt="Director Avatar" className="profile-img" />
                        </div>
                    </div>
                </section>

                {/* Action List Section */}
                <main className="dashboard-actions">
                    <h3 className="section-title">Director Dashboard</h3>
                    
                    <div className="action-list">
                        <div className="action-item" onClick={() => navigate("/RCEvaluation")}>
                            <div className="action-info">
                                <span className="action-label">Teacher Performance</span>
                                <span className="action-subtext">Analytics & Feedback</span>
                            </div>
                            <span className="action-arrow">➔</span>
                        </div>

                        <div className="action-item" onClick={() => navigate("/ManageQuestions")}>
                            <div className="action-info">
                                <span className="action-label">Manage Questions</span>
                                <span className="action-subtext">Evaluation Setup</span>
                            </div>
                            <span className="action-arrow">➔</span>
                        </div>

                        <div className="action-item" onClick={() => navigate("/GenderAnalytics")}>
                            <div className="action-info">
                                <span className="action-label">Gender Analytics</span>
                                <span className="action-subtext">Participation Ratio</span>
                            </div>
                            <span className="action-arrow">➔</span>
                        </div>
                    </div>
                </main>

                {/* Compact Footer */}
                <footer className="app-footer">
                    <button className="pill-logout-btn" onClick={handleLogout}>
                        Logout
                    </button>
                </footer>

            </div>
        </div>
    );
};

export default DirectorDashboard;