import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Junior_SeniorCourseTeacherDashboard.css";
import biitLogo from "../Images/Biit_Logo.png";
import studentAvatar from "../Images/avatar.png";
import teacherAvatar from "../Images/avatar.png";
import teachermAvatar from "../Images/maleAvatar.png";
import ApiEndPoint from '../unity.js';

const CourseTeacherDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Dashboard se AridNo aur Course Details lena
  const { AridNo, courseNo } = location.state || {};

  // States
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Hardcoded teachers (Inhe aap next step mein dynamic kar sakte hain)
  const teachers = [
    { name: "Mr Muhammad Nouman", role: "Senior Lecturer", empNo: "E001" },
    { name: "Mr Talha", role: "Junior Lecturer", empNo: "E002" },
  ];

  // 1. Fetch Student Profile Logic
  useEffect(() => {
    const fetchStudentProfile = async () => {
      if (!AridNo) {
        alert("Session Expired!");
        navigate("/");
        return;
      }

      try {
        const response = await axios.get(`${ApiEndPoint}Student/GetStudentProfile`, {
          params: { AridNo: AridNo.trim() }
        });

        if (response.status === 200) {
          setProfile(response.data);
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentProfile();
  }, [AridNo, navigate]);

  if (loading) return <div className="loading-state">Loading Profile...</div>;

  return (
    <div className="dashboard-container">
      <div className="main-web-card">
        
        {/* LEFT SIDE: Dynamic Student Sidebar */}
        <aside className="sidebar-info">
          <img src={biitLogo} alt="BIIT Logo" className="dashboard-logo" />
          <img src={teachermAvatar} alt="Student" className="avatar-large" style={{width: '110px', height: '110px', borderRadius: '50%', marginBottom: '20px'}} />
          
          <div className="student-details" style={{textAlign: 'center'}}>
            {/* Dynamic Name Fix */}
            <h2 style={{color: '#2D463E', margin: '0 0 10px 0'}}>
              {profile?.St_firstName} {profile?.St_lastname || profile?.St_lastName}
            </h2>
            <p><strong>Arid No:</strong> {profile?.Reg_no || AridNo}</p>
            <p><strong>Semester:</strong> {profile?.Semester}-{profile?.Section} </p>
            <p><strong>Section:</strong> {profile?.Discipline}</p>
          </div>
        </aside>

        {/* RIGHT SIDE: Teacher Evaluation */}
        <main className="content-area">
          <h1 className="content-header">{courseNo || "Course Evaluation"}</h1>
          <p className="course-subtitle">Course Teacher Evaluation</p>
          
          <div className="teacher-list">
            {teachers.map((teacher, index) => (
              <div key={index} className="teacher-card">
                <div className="teacher-info-box">
                  <img src={teachermAvatar} alt="Teacher" className="teacher-avatar-small" />
                  <div className="teacher-meta">
                    <h4>{teacher.name}</h4>
                    <span>{teacher.role}</span>
                  </div>
                </div>
                
                <button 
                  className="btn-evaluate"
                  onClick={() => navigate("/StudentQuestionsDashboard", { 
                    state: { 
                      AridNo: AridNo, 
                      courseNo: courseNo, 
                      empNo: teacher.empNo, // Pass teacher ID
                      teacherName: teacher.name,
                      designation: teacher.role
                    } 
                  })}
                >
                  Evaluate
                </button>
              </div>
            ))}
          </div>
          

          {/* Footer with Home Button */}
          <div className="footer-actions">
            <button className="home-btn-web" onClick={() => navigate(-1)}>
              🏠 Back
            </button>
          </div>
        </main>

      </div>
    </div>
  );
};

export default CourseTeacherDashboard;