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
        <div className="questions-container">
            <div className="questions-scroll-area">
                
                {/* Logo Section */}
                <div className="top-logo-wrap">
                    <img src={logo} alt="BIIT Logo" className="header-logo-img" />
                </div>

                {/* Profile Pill Card */}
                <div className="white-pill-card">
                    <div className="student-info-flex">
                        <div className="info-text-box">
                            <p>Name: <strong>Dr. Jamil Sawar</strong></p>
                            <p>Role: <strong>Director</strong></p>
                            <p style={{marginTop: '5px', color: '#4CAF50', fontWeight: 'bold', fontSize: '0.75rem'}}>
                                BIIT Administration
                            </p>
                        </div>
                        <img src={avatar} alt="Director Avatar" className="student-avatar-img" />
                    </div>
                </div>

                <div className="section-divider">Director Dashboard</div>

                {/* Action Items - Using the same card styling as courses */}
                <div className="white-pill-card action-hover-effect" onClick={() => navigate("/RCEvaluation")}>
                    <div className="student-info-flex">
                        <div className="info-text-box">
                            <p className="small-label">Analytics & Feedback</p>
                            <p style={{fontSize: '0.95rem', fontWeight: 'bold', color: '#1a2e28'}}>Teacher Performance</p>
                        </div>
                        <button className="evaluate-btn-solid">View</button>
                    </div>
                </div>

                <div className="white-pill-card action-hover-effect" onClick={() => navigate("/ManageQuestions")}>
                    <div className="student-info-flex">
                        <div className="info-text-box">
                            <p className="small-label">Evaluation Setup</p>
                            <p style={{fontSize: '0.95rem', fontWeight: 'bold', color: '#1a2e28'}}>Manage Questions</p>
                        </div>
                        <button className="evaluate-btn-solid">Manage</button>
                    </div>
                </div>

                <div className="white-pill-card action-hover-effect" onClick={() => navigate("/GenderAnalytics")}>
                    <div className="student-info-flex">
                        <div className="info-text-box">
                            <p className="small-label">Participation Ratio</p>
                            <p style={{fontSize: '0.95rem', fontWeight: 'bold', color: '#1a2e28'}}>Gender Analytics</p>
                        </div>
                        <button className="evaluate-btn-solid">Analytics</button>
                    </div>
                </div>

                <div className="white-pill-card action-hover-effect" onClick={() => navigate("/ConfidentialDecryptor")}>
                    <div className="student-info-flex">
                        <div className="info-text-box">
                            <p className="small-label">Encrypted Results</p>
                            <p style={{fontSize: "0.95rem", fontWeight: "bold", color: "#1a2e28"}}>
                                Confidential File Decryptor
                            </p>
                        </div>
                        <button className="evaluate-btn-solid">Open</button>
                    </div>
                </div>

            </div>

            {/* Footer Navigation */}
            <div className="questions-footer-nav">
                <button className="logout-btn-white" onClick={handleLogout}>
                    Logout
                </button>
            </div>
        </div>
    );
};

export default DirectorDashboard;