import React, { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./StudentDashboard.css";
import logo from "../Images/Biit_Logo.png";
import avatar from "../Images/avatar.png";
import ApiEndPoint from "../unity.js";
import { fetchStudentCoursesMulti, axiosOkOr404 } from "./studentApiHelpers.js";

function safeTrim(v) {
    if (v == null) return "";
    return String(v).trim();
}

function unwrapArray(data) {
    if (Array.isArray(data)) return data;
    if (data == null) return [];
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.Data)) return data.Data;
    if (Array.isArray(data.d)) return data.d;
    return [];
}

function resolveStudentArid(routeState) {
    const fromState = safeTrim(routeState?.AridNo ?? routeState?.aridNo);
    if (fromState) return fromState;
    try {
        const raw = localStorage.getItem("user");
        if (!raw) return "";
        const u = JSON.parse(raw);
        const ut = String(u?.userType ?? u?.User_type ?? "").toLowerCase();
        if (ut && !ut.includes("student")) return "";
        return safeTrim(u?.userid ?? u?.userId ?? u?.User_id ?? u?.user_id ?? u?.UserId);
    } catch {
        return "";
    }
}

function buildStudentDisplayName(p) {
    if (!p) return "Student";
    if (safeTrim(p.FullName)) return safeTrim(p.FullName);
    const parts = [p.St_firstName, p.St_middlename, p.St_lastname]
        .map((x) => safeTrim(x))
        .filter(Boolean);
    if (parts.length) return parts.join(" ");
    return "Student";
}

const StudentDashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const aridForFetch = useMemo(() => resolveStudentArid(location.state), [location.state]);

    const [profile, setProfile] = useState(null);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [coursesNotice, setCoursesNotice] = useState("");
    const [isTopper, setIsTopper] = useState(false);
    const [isConfDone, setIsConfDone] = useState(false);

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!aridForFetch) {
                navigate("/", { replace: true });
                return;
            }
            setLoadError("");
            setCoursesNotice("");
            setLoading(true);
            try {
                const profileRes = await axios.get(`${ApiEndPoint}Student/GetStudentProfile`, {
                    params: { AridNo: aridForFetch },
                });

                if (profileRes.status !== 200) {
                    setProfile(null);
                    setLoadError("Could not load student profile.");
                    return;
                }

                const raw = profileRes.data;
                const profileData =
                    raw && typeof raw === "object"
                        ? {
                              ...raw,
                              AridNo: safeTrim(raw.AridNo ?? raw.Reg_no ?? raw.reg_no ?? aridForFetch),
                              Course: raw.Course ?? raw.Discipline ?? raw.discipline ?? "",
                          }
                        : null;

                if (!profileData?.AridNo) {
                    setProfile(null);
                    setLoadError("Profile did not include ARID / Reg_no.");
                    return;
                }

                setProfile(profileData);

                try {
                    const confResp = await axios.get(`${ApiEndPoint}Student/getConfidentialStudent`, {
                        params: { AridNo: profileData.AridNo },
                    });
                    if (confResp.status === 200) {
                        const confData = confResp.data;
                        const cgpa = confData != null ? Number(confData.CGPA ?? confData.cgpa) : NaN;
                        if (Number.isFinite(cgpa) && cgpa >= 3.7) {
                            setIsTopper(true);
                            // Optional API `Student/CheckIfAlreadyEvaluatedCon` is often not deployed (404 + noisy console).
                            // Confidential completion is tracked per-course in ConfidentialQuestionsDashboard / localStorage.
                            setIsConfDone(false);
                        } else {
                            setIsTopper(false);
                            setIsConfDone(false);
                        }
                    }
                } catch {
                    setIsTopper(false);
                    setIsConfDone(false);
                }

                try {
                    const { ok, list } = await fetchStudentCoursesMulti(axios, ApiEndPoint, profileData);

                    if (!ok) {
                        setCourses([]);
                        setCoursesNotice(
                            "Course list API returned 404 for all parameter combinations. In Postman, copy the exact query string (especially `discipline`) and ensure the Student row has Discipline/Course set, or extend Login to return course/semester into localStorage."
                        );
                    } else if (list.length === 0) {
                        setCourses([]);
                        setCoursesNotice(
                            "Server returned an empty course list. Check semester/discipline match your enrollment data."
                        );
                    } else {
                        const coursesWithStatus = await Promise.all(
                            list.map(async (course) => {
                                const code = course.CourseNo ?? course.courseNo ?? course.Course_code ?? "";
                                try {
                                    const check = await axios.get(
                                        `${ApiEndPoint}Student/CheckIfAlreadyEvaluated`,
                                        {
                                            params: {
                                                AridNo: profileData.AridNo,
                                                CourseCode: code,
                                            },
                                            ...axiosOkOr404,
                                        }
                                    );
                                    const done =
                                        check.status === 200 && check.data === true;
                                    return { ...course, isDone: done };
                                } catch {
                                    return { ...course, isDone: false };
                                }
                            })
                        );
                        coursesWithStatus.sort((a, b) =>
                            a.isDone === b.isDone ? 0 : a.isDone ? 1 : -1
                        );
                        setCourses(coursesWithStatus);
                    }
                } catch (e) {
                    console.error("GetStudentCourses failed:", e);
                    setCourses([]);
                    setCoursesNotice("Could not load courses (network or server error).");
                }
            } catch (err) {
                console.error("Error fetching dashboard data:", err);
                setProfile(null);
                setCourses([]);
                const msg =
                    err.response?.status === 404
                        ? "Student not found. Login id must match Reg_no in the Student table."
                        : "Could not load dashboard. Check network / API base (unity.js, Vite proxy, VITE_API_BASE_URL).";
                setLoadError(msg);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, [aridForFetch, navigate]);

    if (loading) {
        return (
            <div className="questions-container">
                <div className="loading-text">Loading Dashboard...</div>
            </div>
        );
    }

    if (loadError || !profile) {
        return (
            <div className="questions-container">
                <div className="questions-scroll-area">
                    <div className="loading-text" style={{ padding: "20px", textAlign: "center" }}>
                        {loadError || "Unable to show dashboard."}
                    </div>
                    <div className="questions-footer-nav">
                        <button
                            type="button"
                            className="logout-btn-white"
                            onClick={() => navigate("/", { replace: true })}
                        >
                            Back to login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const displayName = buildStudentDisplayName(profile);
    const arid = profile.AridNo;

    return (
        <div className="questions-container">
            <div className="questions-scroll-area">
                <div className="top-logo-wrap">
                    <img src={logo} alt="BIIT Logo" className="header-logo-img" />
                </div>

                <div className="white-pill-card">
                    <div className="student-info-flex">
                        <div className="info-text-box">
                            <p>
                                Name: <strong>{displayName}</strong>
                            </p>
                            <p>Arid#: {arid}</p>
                            <p style={{ marginTop: "5px", color: "#4CAF50", fontWeight: "bold", fontSize: "0.75rem" }}>
                                {safeTrim(profile.Course) || "—"} - Sem {safeTrim(profile.Semester) || "—"} (
                                {safeTrim(profile.Section) || "—"})
                            </p>
                        </div>
                        <img src={avatar} alt="User Avatar" className="student-avatar-img" />
                    </div>
                </div>

                <div className="section-divider">Pending Evaluations</div>

                {coursesNotice ? (
                    <div className="white-pill-card">
                        <div className="info-text-box" style={{ padding: "10px" }}>
                            <p style={{ fontSize: "0.85rem", color: "#555", margin: 0 }}>{coursesNotice}</p>
                        </div>
                    </div>
                ) : null}

                {courses.map((course, index) => (
                    <div key={index} className={`white-pill-card ${course.isDone ? "completed-card" : ""}`}>
                        <div className="student-info-flex">
                            <div className="info-text-box">
                                <p className="small-label">
                                    Course Code: {course.CourseNo ?? course.courseNo ?? "—"}
                                </p>
                                <p style={{ fontSize: "0.95rem", fontWeight: "bold", color: "#1a2e28" }}>
                                    {course.CourseName ?? course.courseName ?? "—"}
                                </p>
                                <p style={{ fontSize: "0.8rem", color: "#d32f2f" }}>
                                    Teacher: {course.TeacherName ?? course.teacherName ?? "—"}
                                </p>
                            </div>

                            <button
                                type="button"
                                className={course.isDone ? "done-badge" : "evaluate-btn-solid"}
                                disabled={course.isDone}
                                onClick={() =>
                                    navigate("/StudentQuestionsDashboard", {
                                        state: {
                                            courseNo: course.CourseNo ?? course.courseNo,
                                            courseName: course.CourseName ?? course.courseName,
                                            teacherName: course.TeacherName ?? course.teacherName,
                                            teacherID: course.EmpNo ?? course.empNo,
                                            AridNo: arid,
                                            returnTo: "/StudentDashboard",
                                            returnState: { AridNo: arid },
                                        },
                                    })
                                }
                            >
                                {course.isDone ? "✓ Done" : "Evaluate"}
                            </button>
                        </div>
                    </div>
                ))}

                {isTopper && (
                    <div className="white-pill-card" style={{ border: "2px solid #b40f0f" }}>
                        <div className="student-info-flex" style={{ justifyContent: "center", padding: "10px" }}>
                            <button
                                type="button"
                                className={isConfDone ? "done-badge" : "evaluate-btn-solid"}
                                style={{
                                    backgroundColor: isConfDone ? "" : "#b40f0f",
                                    width: "100%",
                                    cursor: isConfDone ? "default" : "pointer",
                                }}
                                disabled={isConfDone}
                                onClick={() =>
                                    navigate("/ConfidentalStudentEvaluationForm", {
                                        state: { AridNo: arid, backTo: "/StudentDashboard" },
                                    })
                                }
                            >
                                {isConfDone ? "✅ Confidential Done" : "🌟 Perform Confidential Evaluation"}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="questions-footer-nav">
                <button type="button" className="logout-btn-white" onClick={() => navigate("/")}>
                    Logout
                </button>
            </div>
        </div>
    );
};

export default StudentDashboard;
