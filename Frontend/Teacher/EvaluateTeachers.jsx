import React from "react";
import "./EvaluateTeachers.css";
import logo from "../Images/Biit_Logo.png";
import avatar from "../Images/avatar.png";
import { useNavigate } from "react-router-dom";

const EvaluateTeachers = () => {
  const navigate = useNavigate();
  const teacherList = [
    { name: "Dr. Irum", designation: "HOD", status: "Evaluate" },
    { name: "Mr. Aftab", designation: "Assistant Professor", status: "Evaluate" },
    { name: "Mr. Azeem", designation: "Assistant Professor", status: "Evaluated" },
    { name: "Mr. Daniyal", designation: "Lecturer", status: "Evaluated" },
  ];

  return (
    <div className="compact-bg">
      <div className="compact-content">
        
        {/* 1. Header Logo */}
        <div className="mini-logo-wrap">
          <img src={logo} alt="BIIT" className="mini-logo" />
        </div>

        {/* 2. Mini Profile Card (Like Student Info) */}
        <div className="mini-info-card">
          <div className="info-flex">
            <div className="info-text">
              <p className="p-name"><strong>Ms. Nadia Arif</strong></p>
              <p className="p-sub">Assistant Director</p>
            </div>
            <img src={avatar} alt="User" className="mini-avatar" />
          </div>
        </div>

        {/* 3. Main List Card */}
        <div className="mini-courses-card">
          <div className="mini-card-header">Evaluate Teachers</div>
          <div className="mini-scroll-box">
            {teacherList.map((teacher, index) => {
              const isDone = teacher.status === "Evaluated";
              return (
                <div key={index} className={`mini-row ${isDone ? "done-row" : ""}`}>
                  <div className="row-details">
                    <span className={`row-title ${isDone ? "ls-text-muted" : ""}`}>
                        {teacher.name}
                    </span>
                    <span className="row-sub">{teacher.designation}</span>
                  </div>
                  <button 
                    className={`mini-btn ${isDone ? "btn-off" : ""}`}
                    disabled={isDone}
                  >
                    {isDone ? "Done" : "Eval"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Footer Back Button */}
        <div className="mini-footer">
          <button className="mini-logout" onClick={() => navigate(-1)}>
            ⬅ Back
          </button>
        </div>

      </div>
    </div>
  );
};

export default EvaluateTeachers;