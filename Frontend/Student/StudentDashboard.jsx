import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./StudentDashboard.css";
import logo from "../Images/Biit_Logo.png";
import avatar from "../Images/avatar.png";
import ApiEndPoint from '../unity.js';

const StudentDashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const AridNo = location.state?.AridNo;

    const [profile, setProfile] = useState(null);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // New states for Confidential Evaluation
    const [isTopper, setIsTopper] = useState(false);
    const [isConfDone, setIsConfDone] = useState(false);

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!AridNo) { navigate("/"); return; }
            try {
                setLoading(true);
                const profileRes = await axios.get(`${ApiEndPoint}Student/GetStudentProfile`, { params: { AridNo } });
                
                if (profileRes.status === 200) {
                    const profileData = profileRes.data;
                    setProfile(profileData);

                    // --- START: Confidential Logic Integration ---
                    try {
                        const confResp = await axios.get(`${ApiEndPoint}Student/getConfidentialStudent`, { params: { AridNo } });
                        if (confResp.status === 200) {
                            const confData = confResp.data;
                            if (confData.CGPA >= 3.7) {
                                setIsTopper(true);
                                const checkConf = await axios.get(`${ApiEndPoint}Student/CheckIfAlreadyEvaluatedCon`, { params: { AridNo } });
                                setIsConfDone(checkConf.data === true);
                            }
                        }
                    } catch (e) { console.log("Confidential check failed", e); }
                    // --- END: Confidential Logic Integration ---

                    const courseRes = await axios.get(`${ApiEndPoint}Student/GetStudentCourses`, {
                        params: { 
                            AridNo: profileData.AridNo.trim(), 
                            semester: profileData.Semester, 
                            discipline: profileData.Course.trim() 
                        }
                    });

                    if (courseRes.status === 200) {
                        const coursesWithStatus = await Promise.all(
                            courseRes.data.map(async (course) => {
                                try {
                                    const check = await axios.get(`${ApiEndPoint}Student/CheckIfAlreadyEvaluated`, {
                                        params: { AridNo: profileData.AridNo.trim(), CourseCode: course.CourseNo }
                                    });
                                    return { ...course, isDone: check.data === true };
                                } catch (e) { return { ...course, isDone: false }; }
                            })
                        );
                        const sorted = coursesWithStatus.sort((a, b) => (a.isDone === b.isDone ? 0 : a.isDone ? 1 : -1));
                        setCourses(sorted);
                    }
                }
            } catch (err) { 
                console.error("Error fetching dashboard data:", err); 
            } finally { 
                setLoading(false); 
            }
        };
        fetchDashboardData();
    }, [AridNo, navigate]);

    if (loading) return <div className="questions-container"><div className="loading-text">Loading Dashboard...</div></div>;

    return (
        <div className="questions-container">
            <div className="questions-scroll-area">
                <div className="top-logo-wrap">
                    <img src={logo} alt="BIIT Logo" className="header-logo-img" />
                </div>

                <div className="white-pill-card">
                    <div className="student-info-flex">
                        <div className="info-text-box">
                            <p>Name: <strong>{profile?.FullName || "Student"}</strong></p>
                            <p>Arid#: {profile?.AridNo}</p>
                            <p style={{marginTop: '5px', color: '#4CAF50', fontWeight: 'bold', fontSize: '0.75rem'}}>
                                {profile?.Course} - Sem {profile?.Semester} ({profile?.Section})
                            </p>
                        </div>
                        <img src={avatar} alt="User Avatar" className="student-avatar-img" />
                    </div>
                </div>

                <div className="section-divider">Pending Evaluations</div>

                {courses.map((course, index) => (
                    <div key={index} className={`white-pill-card ${course.isDone ? "completed-card" : ""}`}>
                        <div className="student-info-flex">
                            <div className="info-text-box">
                                <p className="small-label">Course Code: {course.CourseNo}</p>
                                <p style={{fontSize: '0.95rem', fontWeight: 'bold', color: '#1a2e28'}}>{course.CourseName}</p>
                                <p style={{fontSize: '0.8rem', color: '#d32f2f'}}>Teacher: {course.TeacherName}</p>
                            </div>
                            
                            <button 
                                className={course.isDone ? "done-badge" : "evaluate-btn-solid"}
                                disabled={course.isDone}
                                onClick={() => navigate("/StudentQuestionsDashboard", { 
                                    state: { 
                                        courseNo: course.CourseNo, 
                                        courseName: course.CourseName, 
                                        teacherName: course.TeacherName, 
                                        teacherID: course.EmpNo,
                                        AridNo: profile.AridNo,
                                        returnTo: "/StudentDashboard",
                                        returnState: { AridNo: profile.AridNo },
                                    } 
                                })}
                            >
                                {course.isDone ? "✓ Done" : "Evaluate"}
                            </button>
                        </div>
                    </div>
                ))}

                {/* --- Confidential Evaluation Section --- */}
                {isTopper && (
                    <div className="white-pill-card" style={{ border: '2px solid #b40f0f' }}>
                         <div className="student-info-flex" style={{ justifyContent: 'center', padding: '10px' }}>
                            <button 
                                className={isConfDone ? "done-badge" : "evaluate-btn-solid"} 
                                style={{ backgroundColor: isConfDone ? "" : "#b40f0f", width: '100%', cursor: isConfDone ? 'default' : 'pointer' }}
                                disabled={isConfDone}
                                onClick={() => navigate("/ConfidentalStudentEvaluationForm", { state: { AridNo, backTo: "/StudentDashboard" } })}
                            >
                                {isConfDone ? "✅ Confidential Done" : "🌟 Perform Confidential Evaluation"}
                            </button>
                        </div>
                    </div>
                )}
                {/* --- End Confidential Section --- */}

            </div>

            <div className="questions-footer-nav">
                <button className="logout-btn-white" onClick={() => navigate("/")}>
                    Logout
                </button>
            </div>
        </div>
    );
};

export default StudentDashboard;