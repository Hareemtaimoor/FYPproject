import React, { useEffect, useState, useCallback, useMemo } from "react";
import "./EvaluateTeachers.css";
import logo from "../Images/Biit_Logo.png";
import avatar from "../Images/avatar.png";
import { useNavigate, useLocation } from "react-router-dom";
import APIEndPoint from "../unity.js";

const api = (path) => `${APIEndPoint}${path.replace(/^\//, "")}`;

const readLoggedInTeacherId = () => {
  try {
    const u = JSON.parse(localStorage.getItem("user"));
    if (u?.userid != null && String(u.userid).trim() !== "") return String(u.userid).trim();
    if (u?.userId != null && String(u.userId).trim() !== "") return String(u.userId).trim();
  } catch {
    /* ignore */
  }
  return "";
};

const EvaluateTeachers = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const stateTeacherId = location.state?.TeacherID || location.state?.Emp_no || "";
  const formattedID =
    stateTeacherId && String(stateTeacherId).trim() !== ""
      ? String(stateTeacherId).trim()
      : readLoggedInTeacherId();

  const [hodProfile, setHodProfile] = useState(null);
  const [facultyList, setFacultyList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState("");

  const checkPeerStatus = useCallback(async (targetId) => {
    // Primary endpoint used elsewhere in project
    const primary = api(
      `Evaluation/CheckPeerStatus?evaluatorId=${encodeURIComponent(formattedID)}&targetId=${encodeURIComponent(targetId)}`
    );
    const fallback = api(
      `Teacher/CheckIfAlreadyEvaluated?EvaluatorID=${encodeURIComponent(formattedID)}&TargetID=${encodeURIComponent(targetId)}`
    );

    try {
      const resp = await fetch(primary);
      if (resp.ok) return (await resp.json()) === true;
    } catch {
      /* ignore and try fallback */
    }
    try {
      const resp = await fetch(fallback);
      if (resp.ok) return (await resp.json()) === true;
    } catch {
      /* ignore */
    }
    return false;
  }, [formattedID]);

  const fetchData = useCallback(async () => {
    if (!formattedID) {
      setLoading(false);
      setMessage("Session missing. Please login again.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const profileResp = await fetch(
        api(`Teacher/GetTeacherProfile?TeacherID=${encodeURIComponent(formattedID)}`)
      );
      if (profileResp.ok) {
        const profileData = await profileResp.json();
        setHodProfile(profileData);
      }

      // Support both available backend routes
      let facultyData = [];
      const allFacultyResp = await fetch(api("Teacher/GetAllFaculty"));
      if (allFacultyResp.ok) {
        facultyData = await allFacultyResp.json();
      } else {
        const allTeachersResp = await fetch(api("Teacher/GetAllTeachers"));
        if (allTeachersResp.ok) facultyData = await allTeachersResp.json();
      }

      if (!Array.isArray(facultyData)) facultyData = [];

      const filteredFaculty = facultyData.filter(
        (f) => String(f.Emp_no ?? f.TeacherID ?? "").trim() !== formattedID
      );

      const facultyWithStatus = await Promise.all(
        filteredFaculty.map(async (faculty) => {
          const targetID = faculty.Emp_no ?? faculty.TeacherID ?? faculty.emp_no ?? faculty.teacherId;
          const isDone = targetID ? await checkPeerStatus(targetID) : false;
          return { ...faculty, isDone };
        })
      );

      facultyWithStatus.sort((a, b) => (a.isDone === b.isDone ? 0 : a.isDone ? 1 : -1));
      setFacultyList(facultyWithStatus);
      if (facultyWithStatus.length === 0) setMessage("No teachers available.");
    } catch (err) {
      console.error("Fetch Error:", err);
      setMessage("Could not load teachers. Check API connection.");
    } finally {
      setLoading(false);
    }
  }, [formattedID, checkPeerStatus]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredData = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return facultyList.filter((item) => {
      const name = (item.Name || item.name || "").toLowerCase();
      const designation = (item.Designation || item.designation || "").toLowerCase();
      return name.includes(q) || designation.includes(q);
    });
  }, [searchQuery, facultyList]);

  if (loading) {
    return (
      <div className="compact-bg loader-flex">
        <div className="spinner"></div>
        <p style={{ color: "#fff", marginTop: "10px" }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="compact-bg">
      <div className="compact-content">
        <div className="mini-logo-wrap">
          <img src={logo} alt="BIIT" className="mini-logo" />
        </div>

        <div className="mini-info-card">
          <div className="peer-card-label">Evaluator Information</div>
          <div className="info-flex">
            <div className="info-text">
              <p className="p-name">
                <strong>Name: </strong> {hodProfile?.Name || hodProfile?.name || "Not Found"}
              </p>
              <p className="p-sub">
                <strong>Designation: </strong> {hodProfile?.Designation || hodProfile?.designation || "N/A"}
              </p>
            </div>
            <img src={avatar} alt="User" className="mini-avatar" />
          </div>
        </div>

        <div className="search-wrap">
          <input
            type="text"
            placeholder="Search faculty..."
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="mini-courses-card">
          <div className="mini-card-header">Faculty Evaluation List</div>
          <div className="mini-scroll-box">
            {filteredData.length > 0 ? (
              filteredData.map((teacher, index) => {
                const targetId = teacher.Emp_no ?? teacher.TeacherID ?? teacher.emp_no ?? teacher.teacherId ?? "";
                const targetName = teacher.Name ?? teacher.name ?? "N/A";
                const targetDesignation = teacher.Designation ?? teacher.designation ?? "";
                return (
                  <div key={String(targetId || index)} className={`mini-row ${teacher.isDone ? "done-row" : ""}`}>
                    <div className="row-details">
                      <span className={`row-title ${teacher.isDone ? "ls-text-muted" : ""}`}>
                        <strong>{targetName}</strong>
                      </span>
                      <span className="row-sub">{targetDesignation || "N/A"}</span>
                    </div>
                    <button
                      className={`mini-btn ${teacher.isDone ? "btn-off" : ""}`}
                      disabled={teacher.isDone || !targetId}
                      onClick={() =>
                        navigate(
                          `/TeacherEvalutionQuestions?targetId=${encodeURIComponent(String(targetId))}&evaluatorId=${encodeURIComponent(formattedID)}`,
                          {
                            state: {
                              TargetID: String(targetId),
                              EvaluatorID: formattedID,
                              TargetName: targetName,
                              Designation: targetDesignation,
                              Qtype: "Peer Evaluation",
                            },
                          }
                        )
                      }
                    >
                      {teacher.isDone ? "Evaluated" : "Evaluate"}
                    </button>
                  </div>
                );
              })
            ) : (
              <p className="no-results">{message || "No data available."}</p>
            )}
          </div>
        </div>

        <div className="mini-footer">
          <button className="mini-logout" onClick={() => navigate(-1)}>
            Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default EvaluateTeachers;