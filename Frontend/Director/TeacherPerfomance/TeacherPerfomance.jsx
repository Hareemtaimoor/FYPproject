import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./TeacherPerfomance.css"; // Is file ko niche di gayi CSS se update karein
import logo from "../../Images/Biit_Logo.png";
import avatar from "../../Images/avatar.png";

const TeacherPerfomance = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const teachers = [
    { name: "Dr Irum : HOD", status: "View Performance" },
    { name: "Mr Aftab : Assistant Professor", status: "View Performance" },
    { name: "Mr Azeem : Assistant Professor", status: "View Performance" },
    { name: "Mr Daniyal : Lecturer", status: "View Performance" },
    { name: "Sample Teacher 5 : Lecturer", status: "View Performance" }, // Scrolling check karne ke liye
    { name: "Sample Teacher 6 : Assistant Professor", status: "View Performance" },
  ];

  const filteredTeachers = teachers.filter((teacher) =>
    teacher.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="mobile-container">
      <div className="inner-content">
        {/* Top Logo */}
        <div className="logo-section">
          <img src={logo} alt="BIIT Logo" className="header-logo" />
        </div>

        {/* Director Info Card */}
        <div className="white-card">
          <div className="card-header">Director Information</div>
          <div className="card-body">
            <div className="text-info">
              <p>Name: <strong>Dr. Jamil Sawar</strong></p>
              <p>Designation: Administrative Head</p>
            </div>
            <img src={avatar} alt="Avatar" className="profile-img" />
          </div>
        </div>

        {/* Teacher Performance Section */}
        <div className="white-card flex-grow">
          <div className="card-header">Teacher Performance</div>
          
          {/* Search Row (Screenshot ke mutabiq) */}
          <div className="search-row">
            <input
              type="text"
              placeholder="Search Name..."
              className="search-bar"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="search-icon-btn">🔍 Search</button>
          </div>

          {/* Teacher List with Scrolling */}
          <div className="teacher-list-scroll">
            {filteredTeachers.map((teacher, index) => (
              <div key={index} className="teacher-row">
                <div className="teacher-info">
                  <span className="teacher-name">{teacher.name}</span>
                </div>
                <button className="view-btn">View Performance</button>
              </div>
            ))}
          </div>

          {/* Performance Mapping Link */}
          <div className="mapping-section">
            <button className="mapping-btn">Performance Mapping</button>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="footer-nav">
          <button className="dashboard-pill-btn" onClick={() => navigate("/")}>
            🏠 Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeacherPerfomance;