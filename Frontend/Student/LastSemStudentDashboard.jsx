import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./LastSemStudentDashboard.css";
import logo from "../Images/Biit_Logo.png";
import avatar from "../Images/avatar.png";
import ApiEndPoint from '../unity.js';

const LastSemStudentDashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const AridNo = location.state?.AridNo;

    const [profile, setProfile] = useState(null);
    const [courses, setCourses] = useState([]);
    const [supervisor, setSupervisor] = useState({ name: "Loading...", isDone: false });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!AridNo) { navigate("/"); return; }
            try {
                setLoading(true);
                const profileRes = await axios.get(`${ApiEndPoint}Student/GetStudentProfile`, { params: { AridNo } });
                
                if (profileRes.status === 200) {
                    const studentData = profileRes.data;
                    setProfile(studentData);
                    
                    const courseRes = await axios.get(`${ApiEndPoint}Student/GetStudentCourses`, {
                        params: { 
                            AridNo: studentData.AridNo.trim(), 
                            semester: studentData.Semester, 
                            discipline: studentData.Course.trim() 
                        }
                    });

                    if (courseRes.status === 200) {
                        const coursesWithStatus = await Promise.all(
                            courseRes.data.map(async (course) => {
                                try {
                                    const check = await axios.get(`${ApiEndPoint}Student/CheckIfAlreadyEvaluated`, {
                                        params: { AridNo: studentData.AridNo.trim(), CourseCode: course.CourseNo }
                                    });
                                    return { ...course, isDone: check.data === true };
                                } catch (e) { return { ...course, isDone: false }; }
                            })
                        );
                        coursesWithStatus.sort((a, b) => (a.isDone === b.isDone ? 0 : a.isDone ? 1 : -1));
                        setCourses(coursesWithStatus);
                    }

                    const supervisorRes = await axios.get(`${ApiEndPoint}Student/GetSupervisorName`, {
                        params: { AridNo: studentData.AridNo.trim() }
                    });
                    
                    const fypCheck = await axios.get(`${ApiEndPoint}Student/CheckIfAlreadyEvaluated`, {
                        params: { AridNo: studentData.AridNo.trim(), CourseCode: "FYP-EVAL" }
                    });

                    setSupervisor({
                        name: supervisorRes.status === 200 ? supervisorRes.data : "Not Assigned",
                        isDone: fypCheck.data === true
                    });
                }
            } catch (err) { 
                console.error("Fetch Error:", err); 
            } finally { 
                setLoading(false); 
            }
        };
        fetchDashboardData();
    }, [AridNo, navigate]);

    const handleLogout = () => {
        if (window.confirm("Are you sure you want to logout?")) {
            navigate("/");
        }
    };

    if (loading) return <div className="loading">Loading...</div>;

    return (
        <div className="ls-dashboard-wrapper">
            <div className="ls-main-container">
                
                {/* 1. Header Logo */}
                <div className="ls-logo-section">
                    <img src={logo} alt="BIIT" className="ls-header-logo" />
                </div>

                {/* 2. Student Info Card (Fixed) */}
                <div className="ls-info-card">
                    <h3 className="ls-card-title">Student Information</h3>
                    <div className="ls-info-content">
                        <div className="ls-info-text">
                            <p>Name: <strong>{profile?.FullName}</strong></p>
                            <p>Arid#: {profile?.AridNo}</p>
                            <p>Section: {profile?.Course}-{profile?.Semester}{profile?.Section}</p>
                        </div>
                        <img src={avatar} alt="Student" className="ls-student-avatar" />
                    </div>
                </div>

                {/* 3. Scrollable Area for Courses & FYP */}
                <div className="ls-courses-container">
                    <h3 className="ls-card-title">Enrolled Courses</h3>
                    <div className="ls-scroll-box">
                        {courses.map((course, index) => (
                            <div key={index} className={`ls-item-row ${course.isDone ? "ls-done-bg" : ""}`}>
                                <div className="ls-item-details">
                                    <span className={`ls-item-name ${course.isDone ? "ls-text-muted" : ""}`}>
                                        {course.CourseName}
                                    </span>
                                    <span className="ls-item-subtext">{course.TeacherName}</span>
                                </div>
                                <button 
                                    className={`ls-eval-btn ${course.isDone ? "ls-btn-disabled" : ""}`}
                                    disabled={course.isDone}
                                    onClick={() => navigate("/StudentQuestionsDashboard", { 
                                        state: { courseNo: course.CourseNo, AridNo: profile?.AridNo, teacherName: course.TeacherName,teacherID: course.EmpNo  } 
                                    })}
                                >
                                    {course.isDone ? "Done" : "Evaluate"}
                                </button>
                            </div>
                        ))}

                        <div className="ls-fyp-divider">Final Year Project</div>
                        
                        <div className={`ls-item-row ${supervisor.isDone ? "ls-done-bg" : ""}`}>
                            <div className="ls-item-details">
                                <span className={`ls-item-name ${supervisor.isDone ? "ls-text-muted" : ""}`}>
                                    Supervisor Evaluation
                                </span>
                                <span className="ls-item-subtext">{supervisor.name}</span>
                            </div>
                            <button 
                                className={`ls-eval-btn ${supervisor.isDone ? "ls-btn-disabled" : ""}`}
                                disabled={supervisor.isDone}
                                onClick={() => navigate("/StudentQuestionsDashboard", { 
                                    state: { courseNo: "FYP-EVAL", AridNo: profile.AridNo.trim(), teacherName: supervisor.name } 
                                })}
                            >
                                {supervisor.isDone ? "Done" : "Evaluate"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* 4. Bottom Logout Section (Fixed) */}
                <div className="ls-footer-section">
                    <button className="ls-logout-btn" onClick={handleLogout}>
                        Logout
                    </button>
                </div>

            </div>
        </div>
    );
};

export default LastSemStudentDashboard;