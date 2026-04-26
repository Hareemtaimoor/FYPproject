import React, { useEffect, useState, useCallback, useMemo } from "react";
import "./EvaluateTeachers.css";
import logo from "../Images/Biit_Logo.png";
import avatar from "../Images/avatar.png";
import { useNavigate, useLocation } from "react-router-dom";
import APIEndPoint from '../unity.js';

const EvaluateTeachers = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 1. Check karein ke ID sahi key se aa rahi hai
  // Agar aapne Dashboard se 'Emp_no' pass kiya hai to wo bhi check karega
  const TeacherID = location.state?.TeacherID || location.state?.Emp_no || "";
  const formattedID = String(TeacherID).trim();

  const [hodProfile, setHodProfile] = useState(null);
  const [facultyList, setFacultyList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = useCallback(async () => {
    if (!formattedID) {
      console.error("No TeacherID found in navigation state!");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Slash handling for APIEndPoint
      const base = APIEndPoint.endsWith('/') ? APIEndPoint : `${APIEndPoint}/`;

      // 2. Fetch Evaluator Profile
      const profileUrl = `${base}api/Teacher/GetTeacherProfile?TeacherID=${formattedID}`;
      const profileResp = await fetch(profileUrl);
      
      if (profileResp.ok) {
        const profileData = await profileResp.json();
        console.log("Profile Data:", profileData); // Debugging ke liye
        setHodProfile(profileData);
      }

      // 3. Fetch All Teachers
      const facultyUrl = `${base}api/Teacher/GetAllTeachers`;
      const facultyResp = await fetch(facultyUrl);

      if (facultyResp.ok) {
        const facultyData = await facultyResp.json();

        const facultyWithStatus = await Promise.all(
          facultyData.map(async (faculty) => {
            try {
              // TargetID check: Kuch APIs me TeacherID hota hai kuch me Emp_no
              const targetID = faculty.TeacherID || faculty.Emp_no;
              const checkUrl = `${base}api/Teacher/CheckIfAlreadyEvaluated?EvaluatorID=${formattedID}&TargetID=${targetID}`;
              const checkResp = await fetch(checkUrl);
              const isEvaluated = await checkResp.json();
              return { ...faculty, isDone: isEvaluated === true };
            } catch (e) {
              return { ...faculty, isDone: false };
            }
          })
        );

        facultyWithStatus.sort((a, b) => (a.isDone === b.isDone ? 0 : a.isDone ? 1 : -1));
        setFacultyList(facultyWithStatus);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }, [formattedID]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredData = useMemo(() => {
    return facultyList.filter((item) =>
      (item.Name || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
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

        {/* Evaluator Info Section */}
        <div className="mini-info-card">
          <div className="peer-card-label">Evaluator Information</div>
          <div className="info-flex">
            <div className="info-text">
              {/* Profile data check */}
              <p className="p-name">
                <strong>Name: </strong> {hodProfile?.Name || "Not Found"}
              </p>
              <p className="p-sub">
                <strong>Designation: </strong> {hodProfile?.Designation || "N/A"}
              </p>
            </div>
            <img src={avatar} alt="User" className="mini-avatar" />
          </div>
        </div>

        <div className="search-wrap">
          <input 
            type="text" 
            placeholder="🔎 Search faculty..." 
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="mini-courses-card">
          <div className="mini-card-header">Faculty Evaluation List</div>
          <div className="mini-scroll-box">
            {filteredData.length > 0 ? (
              filteredData.map((teacher, index) => (
                <div key={index} className={`mini-row ${teacher.isDone ? "done-row" : ""}`}>
                  <div className="row-details">
                    <span className="row-title"><strong>{teacher.Name}</strong></span>
                    <span className="row-sub">{teacher.Designation}</span>
                  </div>
                  <button 
                    className={`mini-btn ${teacher.isDone ? "btn-off" : ""}`}
                    disabled={teacher.isDone}
                    onClick={() => navigate("/TeacherEvaluationQuestions", {
                      state: {
                        TargetID: teacher.TeacherID || teacher.Emp_no,
                        EvaluatorID: formattedID,
                        TargetName: teacher.Name,
                        Qtype: "Peer Evaluation"
                      }
                    })}
                  >
                    {teacher.isDone ? "Evaluated" : "Evaluate"}
                  </button>
                </div>
              ))
            ) : (
              <p className="no-results" style={{textAlign:'center', padding:'20px'}}>No data available.</p>
            )}
          </div>
        </div>

        <div className="mini-footer">
          <button className="mini-logout" onClick={() => navigate(-1)}>⬅ Back</button>
        </div>
      </div>
    </div>
  );
};

export default EvaluateTeachers;