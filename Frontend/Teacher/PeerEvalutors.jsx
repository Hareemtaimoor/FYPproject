import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./PeerEvalutors.css"; 
import logo from "../Images/Biit_Logo.png";
import avatar from "../Images/avatar.png";
import ApiEndPoint from '../unity.js'; 

const PeerEvalutors = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ Name: "Loading...", Designation: "..." });
  const userData = JSON.parse(localStorage.getItem("user")) || {};

  useEffect(() => {
    if (!userData.userid) {
      navigate("/", { replace: true });
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await axios.get(
          `${ApiEndPoint}Teacher/GetTeacherProfile?TeacherID=${userData.userid}`
        );
        if (response.status === 200) {
          setProfile(response.data);
        }
      } catch (error) {
        console.error("Error:", error);
        setProfile({ 
          Name: userData.userName || "Ms Nadia Arif", 
          Designation: userData.designation || "Assistant Director" 
        });
      }
    };
    fetchProfile();
  }, [userData.userid, navigate]);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.clear();
      navigate("/", { replace: true });
    }
  };

  return (
    <div className="pe-mobile-bg">
      <div className="pe-container">
        
        {/* Top Centered Logo */}
        <div className="pe-logo-wrapper">
          <img src={logo} alt="BIIT Logo" className="pe-main-logo" />
        </div>

        {/* Teacher Information Card */}
        <div className="pe-info-card">
          <h3 className="pe-card-label">Teacher Information</h3>
          <div className="pe-info-content">
            <div className="pe-text-details">
              <p>Name: <strong>{profile.Name}</strong></p>
              <p>Designation: {profile.Designation}</p>
            </div>
            <img src={avatar} alt="Avatar" className="pe-avatar-img" />
          </div>
        </div>

        {/* Dashboard Title Label */}
        <div className="pe-dashboard-label">
          <span>Faculty Dashboard</span>
        </div>

        {/* Main Actions Card */}
        <div className="pe-actions-card">
          <button className="pe-action-btn" onClick={() => navigate("/CHR")}>View CHR</button>
          <button className="pe-action-btn" onClick={() => navigate("/Attendance")}>View Attendance</button>
          <button className="pe-action-btn" onClick={() => navigate("/EvaluationRate")}>View Evaluation</button>
          <button className="pe-action-btn" onClick={() => navigate("/EvaluateTeachers", { state: { TeacherID: userEmpNo } })}>Peer Evaluation</button>
        </div>

        {/* Logout Button */}
        <div className="pe-footer">
          <button className="pe-logout-btn" onClick={handleLogout}>
            <div className="pe-logout-icon-box">↗</div> Logout
          </button>
        </div>

      </div>
    </div>
  );
};

export default PeerEvalutors;