import React, { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./LastSemStudentDashboard.css";
import logo from "../Images/Biit_Logo.png";
import avatar from "../Images/avatar.png";
import ApiEndPoint from "../unity.js";
import { fetchStudentCoursesMulti, axiosOkOr404 } from "./studentApiHelpers.js";

function safeTrim(v) {
    if (v == null) return "";
    return String(v).trim();
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
    const parts = [p.St_firstName, p.St_middlename, p.St_lastname].map((x) => safeTrim(x)).filter(Boolean);
    if (parts.length) return parts.join(" ");
    return "Student";
}

const LastSemStudentDashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const aridForFetch = useMemo(() => resolveStudentArid(location.state), [location.state]);

    const [profile, setProfile] = useState(null);
    const [courses, setCourses] = useState([]);
    const [supervisor, setSupervisor] = useState({ name: "Loading...", isDone: false });
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!aridForFetch) {
                navigate("/", { replace: true });
                return;
            }
            setLoadError("");
            setLoading(true);
            try {
                const profileRes = await axios.get(`${ApiEndPoint}Student/GetStudentProfile`, {
                    params: { AridNo: aridForFetch },
                });

                if (profileRes.status !== 200) {
                    setLoadError("Could not load student profile.");
                    return;
                }

                const raw = profileRes.data;
                const studentData =
                    raw && typeof raw === "object"
                        ? {
                              ...raw,
                              AridNo: safeTrim(raw.AridNo ?? raw.Reg_no ?? raw.reg_no ?? aridForFetch),
                              Course: raw.Course ?? raw.Discipline ?? raw.discipline ?? "",
                          }
                        : null;

                if (!studentData?.AridNo) {
                    setLoadError("Profile missing ARID / Reg_no.");
                    return;
                }

                setProfile(studentData);
                const arid = studentData.AridNo;

                try {
                    const { ok, list } = await fetchStudentCoursesMulti(axios, ApiEndPoint, studentData);
                    if (ok && list.length > 0) {
                        const coursesWithStatus = await Promise.all(
                            list.map(async (course) => {
                                const code = course.CourseNo ?? course.courseNo ?? "";
                                try {
                                    const check = await axios.get(
                                        `${ApiEndPoint}Student/CheckIfAlreadyEvaluated`,
                                        { params: { AridNo: arid, CourseCode: code }, ...axiosOkOr404 }
                                    );
                                    return {
                                        ...course,
                                        isDone: check.status === 200 && check.data === true,
                                    };
                                } catch {
                                    return { ...course, isDone: false };
                                }
                            })
                        );
                        coursesWithStatus.sort((a, b) =>
                            a.isDone === b.isDone ? 0 : a.isDone ? 1 : -1
                        );
                        setCourses(coursesWithStatus);
                    } else {
                        setCourses([]);
                    }
                } catch (e) {
                    console.error("Courses load failed:", e);
                    setCourses([]);
                }

                try {
                    const supervisorRes = await axios.get(`${ApiEndPoint}Student/GetSupervisorName`, {
                        params: { AridNo: arid },
                        ...axiosOkOr404,
                    });
                    let supName = "Not assigned";
                    if (supervisorRes.status === 200) {
                        const d = supervisorRes.data;
                        supName =
                            typeof d === "string"
                                ? d
                                : safeTrim(d?.Name ?? d?.name ?? d?.SupervisorName) || "Not assigned";
                    }
                    const fypCheck = await axios.get(`${ApiEndPoint}Student/CheckIfAlreadyEvaluated`, {
                        params: { AridNo: arid, CourseCode: "FYP-EVAL" },
                        ...axiosOkOr404,
                    });
                    setSupervisor({
                        name: supName,
                        isDone: fypCheck.status === 200 && fypCheck.data === true,
                    });
                } catch {
                    setSupervisor({ name: "Not assigned", isDone: false });
                }
            } catch (err) {
                console.error("Fetch Error:", err);
                setLoadError("Could not load last-semester dashboard.");
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, [aridForFetch, navigate]);

    const handleLogout = () => {
        if (window.confirm("Are you sure you want to logout?")) {
            navigate("/");
        }
    };

    if (loading) return <div className="loading">Loading...</div>;

    if (loadError || !profile) {
        return (
            <div className="ls-dashboard-wrapper">
                <div className="ls-main-container">
                    <p className="loading" style={{ textAlign: "center", padding: 20 }}>
                        {loadError || "Unable to load dashboard."}
                    </p>
                    <div className="ls-footer-section">
                        <button type="button" className="ls-logout-btn" onClick={() => navigate("/", { replace: true })}>
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
        <div className="ls-dashboard-wrapper">
            <div className="ls-main-container">
                <div className="ls-logo-section">
                    <img src={logo} alt="BIIT" className="ls-header-logo" />
                </div>

                <div className="ls-info-card">
                    <h3 className="ls-card-title">Student Information</h3>
                    <div className="ls-info-content">
                        <div className="ls-info-text">
                            <p>
                                Name: <strong>{displayName}</strong>
                            </p>
                            <p>Arid#: {arid}</p>
                            <p>
                                Section: {safeTrim(profile.Course) || "—"}-{safeTrim(profile.Semester) || "—"}
                                {safeTrim(profile.Section) || ""}
                            </p>
                        </div>
                        <img src={avatar} alt="Student" className="ls-student-avatar" />
                    </div>
                </div>

                <div className="ls-courses-container">
                    <h3 className="ls-card-title">Enrolled Courses</h3>
                    <div className="ls-scroll-box">
                        {courses.map((course, index) => (
                            <div key={index} className={`ls-item-row ${course.isDone ? "ls-done-bg" : ""}`}>
                                <div className="ls-item-details">
                                    <span className={`ls-item-name ${course.isDone ? "ls-text-muted" : ""}`}>
                                        {course.CourseName ?? course.courseName ?? "—"}
                                    </span>
                                    <span className="ls-item-subtext">
                                        {course.TeacherName ?? course.teacherName ?? "—"}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    className={`ls-eval-btn ${course.isDone ? "ls-btn-disabled" : ""}`}
                                    disabled={course.isDone}
                                    onClick={() =>
                                        navigate("/StudentQuestionsDashboard", {
                                            state: {
                                                courseNo: course.CourseNo ?? course.courseNo,
                                                AridNo: arid,
                                                teacherName: course.TeacherName ?? course.teacherName,
                                                teacherID: course.EmpNo ?? course.empNo,
                                                returnTo: "/LastSemStudentDashboard",
                                                returnState: { AridNo: arid },
                                            },
                                        })
                                    }
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
                                type="button"
                                className={`ls-eval-btn ${supervisor.isDone ? "ls-btn-disabled" : ""}`}
                                disabled={supervisor.isDone}
                                onClick={() =>
                                    navigate("/StudentQuestionsDashboard", {
                                        state: {
                                            courseNo: "FYP-EVAL",
                                            AridNo: arid,
                                            teacherName: supervisor.name,
                                            returnTo: "/LastSemStudentDashboard",
                                            returnState: { AridNo: arid },
                                        },
                                    })
                                }
                            >
                                {supervisor.isDone ? "Done" : "Evaluate"}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="ls-footer-section">
                    <button type="button" className="ls-logout-btn" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LastSemStudentDashboard;
