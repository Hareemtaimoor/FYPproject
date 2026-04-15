import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./TeacherDashboard_HOD.css";
import logo from "../Images/Biit_Logo.png";
import avatar from "../Images/maleAvatar.png"; // Aap image ke mutabiq female avatar use kar sakti hain
import ApiEndPoint from '../unity.js'; 

const TeacherDashboard_HOD = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ Name: "...", Designation: "..." });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem("user"));
        const teacherID = userData?.userid;
        if (teacherID) {
          const response = await axios.get(`${ApiEndPoint}Teacher/GetTeacherProfile?TeacherID=${teacherID}`);
          if (response.status === 200) setProfile(response.data);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.clear();
      navigate("/", { replace: true });
    }
  };

  return (
    <div className="hod-dashboard-wrapper">
      <div className="hod-mobile-container">
        
        {/* Top Logo */}
        <div className="hod-logo-header">
          <img src={logo} alt="BIIT Logo" className="hod-main-logo" />
        </div>

        {/* Teacher Information Section */}
        <div className="hod-section-card">
          <div className="hod-section-header">Teacher Information</div>
          <div className="hod-info-body">
            <div className="hod-text-info">
              <p>Name: <strong>{profile.Name}</strong></p>
              <p>Designation: {profile.Designation}</p>
            </div>
            <img src={avatar} alt="Profile" className="hod-profile-img" />
          </div>
        </div>

        {/* Faculty Dashboard Section */}
        <div className="hod-section-card">
          <div className="hod-section-header">Faculty Dashboard</div>
          <div className="hod-buttons-list">
            <button className="hod-action-btn" onClick={() => navigate("/CHR")}>View CHR</button>
            <button className="hod-action-btn" onClick={() => navigate("/Attendance")}>View Attendance</button>
            <button className="hod-action-btn">View Evaluation</button>
            <button className="hod-action-btn">Peer Evaluation</button>
            <button className="hod-action-btn"onClick={() => navigate("/PeerAssignment")}>Assign Peer</button>
          </div>
        </div>

        {/* Logout Button */}
        <div className="hod-footer">
          <button className="hod-logout-pill" onClick={handleLogout}>
            <span className="logout-icon">↗</span> Logout
          </button>
        </div>

      </div>
    </div>
  );
};

export default TeacherDashboard_HOD;