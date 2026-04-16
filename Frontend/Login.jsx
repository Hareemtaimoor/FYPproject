import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import logo from "./Images/Biit_Logo.png"; 
import axios from "axios";
import ApiEndPoint from './unity.js';

const Login = () => {
    const nav = useNavigate();
    const [userid, setUserid] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
        const response = await axios.get(
            `${ApiEndPoint}LogIn/LoginUser?username=${userid.trim()}&password=${password.trim()}`
        );

        if (response.status === 200 && response.data) {
            const data = response.data;
            localStorage.setItem("user", JSON.stringify(data));

            const userType = (data.userType || "").toLowerCase().trim();
            // Data ko clean karein comparison ke liye
            const designationRaw = (data.designation || "").toLowerCase().trim();
            const designationClean = designationRaw.replace(/\s+/g, ''); // "associatelecturer"
            
            const evalStatus = parseInt(data.eval, 10);
            const sem = parseInt(data.semester, 10);
            const currentUserId = data.userid || userid;

            // 1. STUDENT LOGIC
            if (userType === "student") {
                if (sem >= 1 && sem <= 6) {
                    nav("/StudentDashboard", { state: { AridNo: currentUserId }, replace: true });
                } else {
                    nav("/LastSemStudentDashboard", { state: { AridNo: currentUserId }, replace: true });
                }
            } 
            
            
           // 2. TEACHER LOGIC (Fixed)
else if (userType.includes("teacher")) {
    // Designation se spaces khatam kar ke comparison karein
    // designationClean check: "associateprofessor" ya "hod"
    if (designationClean === "associateprofessor" || designationClean === "hod") {
        nav("/TeacherDashboard_HOD", { replace: true });
    } 
    // Agar HOD ya Associate Professor nahi hai, toh evaluation status check karein
    else if (evalStatus === 1) {
        nav("/PeerEvalutors", { replace: true });
    } else {
        nav("/NotPeerEvaluators", { replace: true });
    }
}

            // 3. DIRECTOR LOGIC
            else if (userType.includes("director")) {
                nav("/DirectorDashboard", { replace: true });
            }
        }
    } catch (error) {
        console.error("Login Error:", error);
        alert("Login Failed: Check Credentials or Server.");
    } finally {
        setLoading(false);
    }
};

    return (
        <div className="login-wrapper">
            {/* <button 
                className="director-link-btn" 
                onClick={() => nav("/DirectorDashboard")}
            >
                Director
            </button> */}

            <div className="login-card">
                <img src={logo} alt="BIIT Logo" className="login-logo" />
                <h1 className="login-title">BIIT</h1>
                <p className="login-subtitle">TEACHER EVALUATION SYSTEM</p>

                <form onSubmit={handleLogin} className="login-form">
                    <input
                        type="text"
                        className="login-input"
                        placeholder="Enter User ID"
                        value={userid}
                        onChange={(e) => setUserid(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        className="login-input"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <button className="login-btn" type="submit" disabled={loading}>
                        {loading ? "Logging in..." : "Login"}
                    </button>
                    <p className="login-footer">© 2026 Barani Institute of Information Technology</p>
                </form>
            </div>
        </div>
    );
};

export default Login;