import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./AdminDashboard.css";
import logo from "../Images/Biit_Logo.png";
import maleAvatar from "../Images/maleAvatar.png";
import APIEndPoint from "../unity.js";

const api = (path) => `${APIEndPoint}${path.replace(/^\//, "")}`;

const readTeacherId = () => {
  try {
    const u = JSON.parse(localStorage.getItem("user") || "{}");
    if (u?.userid != null && String(u.userid).trim()) return String(u.userid).trim();
    if (u?.userId != null && String(u.userId).trim()) return String(u.userId).trim();
    if (u?.TeacherID != null && String(u.TeacherID).trim()) return String(u.TeacherID).trim();
    if (u?.Emp_no != null && String(u.Emp_no).trim()) return String(u.Emp_no).trim();
  } catch {
    /* ignore */
  }
  return "";
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const TeacherID =
    (location.state?.TeacherID && String(location.state.TeacherID).trim()) || readTeacherId();

  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAdminProfile = useCallback(async () => {
    if (!TeacherID) {
      setLoading(false);
      alert("No ID found. Please login again.");
      navigate("/", { replace: true });
      return;
    }

    try {
      setLoading(true);
      const url = api(`Teacher/GetTeacherProfile?TeacherID=${encodeURIComponent(TeacherID)}`);
      const response = await fetch(url);
      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        setAdminData(data);
      } else {
        alert(data?.Message || data?.message || "Profile not found");
        setAdminData(null);
      }
    } catch (error) {
      console.error(error);
      alert("Network Error: Cannot reach server. Check your connection.");
      setAdminData(null);
    } finally {
      setLoading(false);
    }
  }, [TeacherID, navigate]);

  useEffect(() => {
    fetchAdminProfile();
  }, [fetchAdminProfile]);

  const logout = () => {
    if (!window.confirm("Are you sure you want to logout?")) return;
    try {
      localStorage.removeItem("user");
    } catch {
      /* ignore */
    }
    navigate("/", { replace: true });
  };

  const DashboardItem = ({ label, title, buttonText, onPress }) => (
    <div className="admin-dash-card">
      <div className="admin-dash-card-content">
        <span className="admin-dash-item-label">{label}</span>
        <span className="admin-dash-item-title">{title}</span>
      </div>
      <button type="button" className="admin-dash-action-btn" onClick={onPress}>
        {buttonText}
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="admin-dash-scroll">
        <div className="admin-dash-main admin-dash-main--centered">
          <div className="admin-dash-spinner" aria-hidden />
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dash-scroll">
      <div className="admin-dash-main">
        <div className="admin-dash-logo-wrap">
          <img src={logo} alt="BIIT" className="admin-dash-logo" />
        </div>

        <div className="admin-dash-profile-card">
          <div className="admin-dash-profile-info">
            <span className="admin-dash-item-labels">Admin Information</span>
            <p className="admin-dash-p-text">
              Name: <strong>{adminData?.Name || adminData?.name || "N/A"}</strong>
            </p>
            <p className="admin-dash-p-text">
              Designation:{" "}
              <strong>{adminData?.Designation || adminData?.designation || "N/A"}</strong>
            </p>
            <p className="admin-dash-p-sub">BIIT Administration Staff</p>
          </div>
          <img src={maleAvatar} alt="" className="admin-dash-avatar" />
        </div>

        <h1 className="admin-dash-title">ADMIN DASHBOARD</h1>

        <div className="admin-dash-cards-grid">
          <DashboardItem
            label="RECORDS"
            title="Upload Attendance"
            buttonText="Upload"
            onPress={() => navigate("/UploadAttendance", { state: { TeacherID } })}
          />

          <DashboardItem
            label="COURSE HISTORY"
            title="Upload CHR"
            buttonText="Upload"
            onPress={() => navigate("/UploadCHR", { state: { TeacherID } })}
          />
        </div>

        <button type="button" className="admin-dash-logout-btn" onClick={logout}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default AdminDashboard;
