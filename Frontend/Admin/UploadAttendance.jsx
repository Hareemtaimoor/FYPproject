import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./UploadAttendance.css";
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

const ACCEPT = ".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const UploadAttendance = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef(null);

  const TeacherID =
    (location.state?.TeacherID && String(location.state.TeacherID).trim()) || readTeacherId();

  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [adminData, setAdminData] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const fetchAdminProfile = useCallback(async () => {
    if (!TeacherID) {
      setProfileLoading(false);
      return;
    }
    try {
      const response = await fetch(api(`Teacher/GetTeacherProfile?TeacherID=${encodeURIComponent(TeacherID)}`));
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        setAdminData(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setProfileLoading(false);
    }
  }, [TeacherID]);

  useEffect(() => {
    fetchAdminProfile();
  }, [fetchAdminProfile]);

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const lower = file.name.toLowerCase();
    if (!lower.endsWith(".xls") && !lower.endsWith(".xlsx")) {
      alert("Please select an Excel file (.xls or .xlsx).");
      e.target.value = "";
      return;
    }
    setSelectedFile(file);
  };

  const pickFile = () => fileInputRef.current?.click();

  const uploadFile = async () => {
    if (!selectedFile) {
      alert("Please select the updated attendance Excel file.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch(api("Admin/SaveAttendance"), {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        alert("Attendance records saved successfully!");
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        let msg = "Data mismatch in Excel.";
        try {
          const err = await response.json();
          msg = err.Message || err.message || msg;
        } catch {
          /* ignore */
        }
        alert(`Upload failed: ${msg}`);
      }
    } catch {
      alert("Check server connection.");
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    navigate("/AdminDashboard", { state: { TeacherID } });
  };

  return (
    <div className="ua-page">
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT}
        className="ua-file-input-hidden"
        onChange={onFileChange}
      />

      <div className="ua-inner">
        <img src={logo} alt="BIIT" className="ua-logo" />

        <div className="ua-profile-container">
          {profileLoading ? (
            <div className="ua-profile-loading" aria-busy="true">
              <div className="ua-spinner ua-spinner--sm" />
            </div>
          ) : (
            <div className="ua-profile-text">
              <span className="ua-item-label">Admin Information</span>
              <p className="ua-p-text">
                Name: <strong>{adminData?.Name || adminData?.name || "N/A"}</strong>
              </p>
              <p className="ua-p-text">
                Designation: <strong>{adminData?.Designation || adminData?.designation || "N/A"}</strong>
              </p>
              <p className="ua-p-sub">BIIT Administration Staff</p>
            </div>
          )}
          <img src={maleAvatar} alt="" className="ua-avatar" />
        </div>

        <div className="ua-upload-box">
          <h2 className="ua-section-title">Bulk attendance upload</h2>

          <button type="button" className="ua-pick-btn" onClick={pickFile}>
            {selectedFile ? `📄 ${selectedFile.name}` : "📁 Select attendance.xlsx"}
          </button>

          {loading ? (
            <div className="ua-upload-loading">
              <div className="ua-spinner" />
            </div>
          ) : (
            <button
              type="button"
              className="ua-action-btn"
              onClick={uploadFile}
              disabled={!selectedFile}
            >
              ➕ Save records to SQL
            </button>
          )}

          <button type="button" className="ua-back-btn" onClick={goBack}>
            ⬅️ Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadAttendance;
