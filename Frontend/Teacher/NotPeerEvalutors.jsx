import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./NotPeerEvalutors.css"; 
import logo from "../Images/Biit_Logo.png";
import avatar from "../Images/avatar.png";
import ApiEndPoint from '../unity.js';
import { extractTeacherDisplay, getStoredTeacherId, readUserFromStorage, unwrapProfilePayload } from "./teacherProfileDisplay.js";

const NotPeerEvalutors = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const teacherId = getStoredTeacherId();

  useEffect(() => {
    if (!teacherId) {
      navigate("/", { replace: true });
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await axios.get(
          `${ApiEndPoint}Teacher/GetTeacherProfile?TeacherID=${encodeURIComponent(teacherId)}`
        );
        if (response.status === 200) {
          const raw = response.data;
          const normalized = unwrapProfilePayload(raw) ?? raw;
          setProfile(normalized && typeof normalized === "object" ? normalized : null);
        }
      } catch (error) {
        console.error("Fetch Error:", error);
        setProfile(null);
      }
    };

    fetchProfile();
  }, [teacherId, navigate]);

  const display = extractTeacherDisplay(profile, readUserFromStorage());

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.clear();
      sessionStorage.clear();
      navigate("/", { replace: true });
    }
  };

  return (
    <div className="pe-mobile-bg">
      <div className="pe-container">
        
        {/* Top Logo */}
        <div className="pe-logo-wrapper">
          <img src={logo} alt="BIIT Logo" className="pe-main-logo" />
        </div>

        {/* Teacher Info Card */}
        <div className="pe-info-card">
          <h3 className="pe-card-label">Teacher Information</h3>
          <div className="pe-info-content">
            <div className="pe-text-details">
              <p>Name: <strong>{display.name}</strong></p>
              <p>Designation: {display.designation}</p>
            </div>
            <img src={avatar} alt="Avatar" className="pe-avatar-img" />
          </div>
        </div>

        {/* Faculty Dashboard Label */}
        <div className="pe-dashboard-label">
          <span>Faculty Dashboard</span>
        </div>

        {/* Buttons with Navigation Functionality */}
        <div className="pe-actions-card">
          <button className="pe-action-btn" onClick={() => navigate("/CHR")}>
            View CHR
          </button>
          <button className="pe-action-btn" onClick={() => navigate("/Attendance")}>
            View Attendance
          </button>
          <button className="pe-action-btn" onClick={() => navigate("/EvaluationRate")}>
            View Evaluation
          </button>
        </div>

        {/* Logout Section */}
        <div className="pe-footer">
          <button className="pe-logout-btn" onClick={handleLogout}>
            <div className="pe-logout-icon-box">↗</div> Logout
          </button>
        </div>

      </div>
    </div>
  );
};

export default NotPeerEvalutors;