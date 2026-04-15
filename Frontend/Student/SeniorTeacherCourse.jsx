import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./SeniorTeacherCourse.css";
import biitLogo from "../Images/Biit_Logo.png";
import studentAvatar from "../Images/avatar.png";
import teacherAvatar from "../Images/avatar.png";
import ApiEndPoint from '../unity.js';

const SeniorTeacherCourse = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Dashboard se data lena
    const { courseNo, AridNo } = location.state || {};
    
    const [teacher, setTeacher] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!AridNo || !courseNo) {
            navigate("/StudentDashboard");
            return;
        }

        const fetchData = async () => {
            try {
                // Student Profile for Sidebar
                const profRes = await axios.get(`${ApiEndPoint}Student/GetStudentProfile?AridNo=${AridNo}`);
                setProfile(profRes.data);

                // Teacher Details for the Course
                const teachRes = await axios.get(`${ApiEndPoint}Student/getCourseTeacher`, {
                    params: { CourseNo: courseNo, AridNo: AridNo }
                });
                setTeacher(teachRes.data);
            } catch (err) {
                console.error("Fetch Error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [AridNo, courseNo, navigate]);

    if (loading) return <div className="loading-state">Loading Instructor Details...</div>;

    return (
        <div className="senior-teacher-container">
            <div className="main-web-card">
                
                {/* 1. Student Sidebar */}
                <aside className="sidebar-info">
                    <img src={biitLogo} alt="BIIT Logo" className="dashboard-logo" />
                    <img src={studentAvatar} alt="Student" className="avatar-large" />
                    
                    <div className="student-details">
                        <h2>{profile?.St_firstName} {profile?.St_lastname}</h2>
                        <p><strong>Arid No:</strong> {profile?.Reg_no}</p>
                        <p><strong>Section:</strong> {profile?.Section}</p>
                    </div>
                </aside>

                {/* 2. Main Content Area */}
                <main className="content-area">
                    <h1 className="content-header">{teacher?.CourseName}</h1>
                    <p className="course-subtitle">Course Teacher Evaluation</p>
                    
                    {/* 3. Teacher Div (Single Teacher Only) */}
                    <div className="teacher-profile-header">
                        <div className="teacher-info-box">
                            <img src={teacherAvatar} alt="Teacher" className="teacher-avatar-large" />
                            <div className="teacher-meta-data">
                                <h2>{teacher?.TeacherName}</h2>
                                <p>{teacher?.Designation}</p>
                                <span className="course-badge">{teacher?.CourseCode}</span>
                                  <span className="course-badge">{teacher?.CourseName}</span>
                            </div>
                        </div>
                    </div>

                    {/* 4. Action Buttons */}
                    <div className="footer-actions">
                        <button className="back-btn-web" onClick={() => navigate(-1)}>
                             Back
                        </button>
                        
                        {/* Ye button questions wali screen par le jaye ga */}
                        <button 
                            className="submit-btn-web" 
                            onClick={() => navigate("/StudentQuestionsDashboard", { 
        state: { 
            courseNo: teacher?.CourseCode, 
            AridNo: profile?.Reg_no,
            empNo: teacher?.EmployeeID// Teacher ki ID jo humne API se li thi
        } 
    })}
                        >
                            Start Evaluation →
                        </button>
                    </div>
                </main>

            </div>
        </div>
    );
};

export default SeniorTeacherCourse;