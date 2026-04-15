import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Attendance.css";
import logo from "../Images/Biit_Logo.png";
import avatar from "../Images/avatar.png";
import ApiEndPoint from '../unity.js'; 

const Attendance = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [teacherData, setTeacherData] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [dbRange, setDbRange] = useState({ start: "", end: "" });

  // Dialog box states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  const user = JSON.parse(localStorage.getItem("user")) || {};
  const TeacherID = user.userid;

  useEffect(() => {
    if (TeacherID) fetchInitialData();
    else navigate("/");
  }, [TeacherID]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const rangeRes = await axios.get(`${ApiEndPoint}Teacher/GetTeacherDateRange?teacherId=${TeacherID}`);
      
      if (rangeRes.data) {
        const { Start, End } = rangeRes.data;
        setDbRange({ start: Start, end: End });

        const [profileRes, attendanceRes] = await Promise.all([
          axios.get(`${ApiEndPoint}Teacher/GetTeacherProfile?TeacherID=${TeacherID}`),
          axios.get(`${ApiEndPoint}Teacher/GetTeacherAttendanceRange?teacherId=${TeacherID}&start=${Start}&end=${End}`)
        ]);

        setTeacherData(profileRes.data);
        setAttendanceData(attendanceRes.data || []);
      }
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  const handleSaveComment = async () => {
    if (!comment.trim()) {
      alert("Please enter a comment");
      return;
    }

    // Default hum pehle record ki ID bhej rahe hain
    const attendanceId = attendanceData[0]?.RecordID || 0; 

    try {
      setSaving(true);
      const response = await axios.post(
        `${ApiEndPoint}Teacher/AddAttendanceComments?attendanceId=${attendanceId}&teacherId=${TeacherID}&comments=${comment}`
      );
      
      if (response.status === 200) {
        alert("Comment saved successfully!");
        setIsModalOpen(false);
        setComment("");
      }
    } catch (error) {
      alert("Error saving comment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="att-mobile-bg">
      <div className="att-container">
        <img src={logo} alt="BIIT" className="att-main-logo" />

        <div className="att-info-card">
          <div className="att-card-label">Teacher Information</div>
          <div className="att-info-content">
            <div className="att-text-details">
              <p>Name: <strong>{teacherData?.Name || "Malaika Noor"}</strong></p>
              <p>Designation: {teacherData?.Designation || "Lecturer"}</p>
            </div>
            <img src={avatar} alt="Profile" className="att-avatar-img" />
          </div>
        </div>

        <div className="att-data-card-white">
          <div className="att-table-header-dark">
            Monthly Attendance
            <div className="att-date-sub-gold">{dbRange.start} to {dbRange.end}</div>
          </div>
          
          <div className="att-table-wrapper">
            {loading ? <div className="att-loader">Syncing...</div> : (
              <table className="att-main-table-white">
                <thead>
                  <tr><th>Date</th><th>Day</th><th>In</th><th>Out</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {attendanceData.map((row, i) => (
                    <tr key={i}>
                      <td>{row.AttendanceDate?.split('T')[0].slice(5)}</td>
                      <td>{row.Day ? row.Day.slice(0,3) : new Date(row.AttendanceDate).toLocaleDateString('en-US', {weekday: 'short'})}</td>
                      {/* Multiple checks for property names in your View */}
                      <td>{row.CheckIn || row.TimeIn || row.Check_In || "-"}</td>
                      <td>{row.CheckOut || row.TimeOut || row.Check_Out || "-"}</td>
                      <td className={row.Status?.toLowerCase()==='absent'?'att-red':'att-green'}>
                        {row.Status?.slice(0,1) || "P"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="att-footer">
          <p className="att-add-comment" onClick={() => setIsModalOpen(true)}>Add Remarks / Comments</p>
          <button className="att-home-btn" onClick={() => navigate(-1)}>🏠 Home</button>
        </div>

        {/* --- Remark Dialog Box --- */}
        {isModalOpen && (
          <div className="att-modal-overlay">
            <div className="att-modal-box">
              <h3>Add Remarks</h3>
              <textarea 
                className="att-modal-input"
                placeholder="Enter remarks here..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <div className="att-modal-btns">
                <button className="att-btn-cancel" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button className="att-btn-save" onClick={handleSaveComment} disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Attendance;