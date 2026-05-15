import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./StudentDashboard.css";
import logo from "../Images/Biit_Logo.png";
import avatar from "../Images/avatar.png";
import ApiEndPoint from '../unity.js';
import { getConfidentialCompletedCourseNos } from "./confidentialEvalTracking.js";
import { safeTrim, fetchStudentCoursesMulti } from "./studentApiHelpers.js";

const ConfidentalStudentEvaluationForm = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const AridNo = location.state?.AridNo;
    const backTo = location.state?.backTo || "/StudentDashboard";

    const [profile, setProfile] = useState(null);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!AridNo) { navigate("/"); return; }
            try {
                setLoading(true);
                const profileRes = await axios.get(`${ApiEndPoint}Student/GetStudentProfile`, { params: { AridNo } });
                
                if (profileRes.status === 200) {
                    const raw = profileRes.data;
                    const normalized =
                        raw && typeof raw === "object"
                            ? {
                                  ...raw,
                                  AridNo: safeTrim(raw.AridNo ?? raw.Reg_no ?? raw.reg_no ?? AridNo),
                                  Course: raw.Course ?? raw.Discipline ?? raw.discipline ?? "",
                              }
                            : null;
                    if (!normalized?.AridNo) {
                        navigate("/");
                        return;
                    }
                    setProfile(normalized);

                    const { ok, list } = await fetchStudentCoursesMulti(axios, ApiEndPoint, normalized);
                    if (ok) {
                        const arid = normalized.AridNo;
                        const completed = getConfidentialCompletedCourseNos(arid);
                        const coursesWithStatus = list.map((course) => ({
                            ...course,
                            isDone: completed.has(String(course.CourseNo ?? course.courseNo ?? "").trim()),
                        }));
                        const sorted = coursesWithStatus.sort((a, b) =>
                            a.isDone === b.isDone ? 0 : a.isDone ? 1 : -1
                        );
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
            <button
                type="button"
                className="dashboard-back-link"
                onClick={() => navigate(backTo, { state: { AridNo } })}
            >
                ← Back
            </button>
            <div className="questions-scroll-area">
                <div className="top-logo-wrap">
                    <img src={logo} alt="BIIT Logo" className="header-logo-img" />
                </div>

                {/* --- SIRF HEADING SECTION KI INLINE STYLING --- */}
                <div style={{ textAlign: 'center', marginBottom: '25px', marginTop: '10px' }}>
                    <h1 style={{
                        fontSize: '1.5rem',
                        color: '#e9f1efff',
                        margin: 0,
                        fontWeight: '800',
                        textTransform: 'uppercase',
                        letterSpacing: '1.2px',
                        fontFamily: 'sans-serif'
                    }}>
                        Confidential Evaluation
                    </h1>
                    {/* <p style={{
                        fontSize: '0.8rem',
                        color: '#666',
                        marginTop: '5px',
                        fontWeight: '500',
                        letterSpacing: '0.5px',
                        fontFamily: 'sans-serif'
                    }}>
                        Quality Enhancement Cell (QEC)
                    </p> */}
                </div>
                {/* ----------------------------------------------- */}

                <div className="white-pill-card">
                    <div className="student-info-flex">
                        <div className="info-text-box">
                            <p>Name: <strong>{profile?.FullName || [profile?.St_firstName, profile?.St_middlename, profile?.St_lastname].filter(Boolean).join(" ") || "Student"}</strong></p>
                            <p>Arid#: {profile?.AridNo ?? profile?.Reg_no}</p>
                            <p style={{marginTop: '5px', color: '#4CAF50', fontWeight: 'bold', fontSize: '0.75rem'}}>
                                {profile?.Course} - Sem {profile?.Semester} ({profile?.Section})
                            </p>
                        </div>
                        <img src={avatar} alt="User Avatar" className="student-avatar-img" />
                    </div>
                </div>

                <div className="section-divider">Pending Evaluations</div>
                <p style={{ fontSize: "0.72rem", color: "#b8d4c8", textAlign: "center", margin: "-8px 24px 14px", lineHeight: 1.35 }}>
                    After you submit an evaluation, this course is marked complete on this browser only (no server check).
                </p>

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
                                onClick={() => navigate("/ConfidentialQuestionsDashboard", { 
                                    state: { 
                                        courseNo: course.CourseNo, 
                                        courseName: course.CourseName, 
                                        teacherName: course.TeacherName, 
                                        teacherID: course.EmpNo,
                                        AridNo: profile?.AridNo,
                                        returnTo: "/ConfidentalStudentEvaluationForm",
                                        returnState: { AridNo: profile?.AridNo, backTo },
                                    } 
                                })}
                            >
                                {course.isDone ? "✓ Done" : "Evaluate"}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="questions-footer-nav">
                <button className="logout-btn-white" onClick={() => navigate("/")}>
                    Logout
                </button>
            </div>
        </div>
    );
};

export default ConfidentalStudentEvaluationForm;