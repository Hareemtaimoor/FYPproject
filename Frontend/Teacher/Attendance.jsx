import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Attendance.css";
import logo from "../Images/Biit_Logo.png";
import avatar from "../Images/avatar.png";
import ApiEndPoint from '../unity.js';
import { extractTeacherDisplay, getStoredTeacherId, readUserFromStorage, unwrapProfilePayload } from "./teacherProfileDisplay.js";

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

  const user = readUserFromStorage();
  const TeacherID = getStoredTeacherId();

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

        const raw = profileRes.data;
        const normalized = unwrapProfilePayload(raw) ?? raw;
        setTeacherData(normalized && typeof normalized === "object" ? normalized : null);
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

  const teacherDisplay = extractTeacherDisplay(teacherData, user);

  return (
    <div className="att-mobile-bg">
      <div className="att-container">
        <img src={logo} alt="BIIT" className="att-main-logo" />

        <div className="att-info-card">
          <div className="att-card-label">Teacher Information</div>
          <div className="att-info-content">
            <div className="att-text-details">
              <p>
                Name: <strong>{teacherDisplay.name}</strong>
              </p>
              <p>Designation: {teacherDisplay.designation}</p>
            </div>
            <img src={avatar} alt="Profile" className="att-avatar-img" />
          </div>
        </div>

        <div className="att-data-card-white">
          <div className="att-table-header-dark">
            <span className="att-table-title">Monthly attendance</span>
            <div className="att-date-sub-gold">
              {dbRange.start && dbRange.end ? (
                <>
                  {dbRange.start} <span className="att-range-sep">→</span> {dbRange.end}
                </>
              ) : (
                "Date range loading…"
              )}
            </div>
          </div>

          <div className="att-table-shell" role="region" aria-label="Attendance records">
            {loading ? (
              <div className="att-loader">Syncing…</div>
            ) : (
              <table className="att-main-table-white">
                {/* <caption className="att-table-caption">
                  Daily check-in and check-out for the selected period
                </caption> */}
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">Day</th>
                    <th scope="col">In</th>
                    <th scope="col">Out</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceData.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="att-empty-cell">
                        No attendance rows for this range.
                      </td>
                    </tr>
                  ) : (
                    attendanceData.map((row, i) => {
                      const rawDate = row.AttendanceDate ?? row.attendanceDate;
                      const datePart =
                        rawDate != null ? String(rawDate).split("T")[0] : "";
                      const dateShort = datePart.length >= 5 ? datePart.slice(5) : "—";
                      const dayLabel = row.Day
                        ? String(row.Day).slice(0, 3)
                        : rawDate
                          ? new Date(rawDate).toLocaleDateString("en-US", { weekday: "short" })
                          : "—";
                      const st = String(row.Status ?? row.status ?? "Present").toLowerCase();
                      const statusLetter = (row.Status ?? row.status ?? "P").toString().slice(0, 1).toUpperCase();
                      return (
                        <tr key={row.RecordID ?? row.recordID ?? i}>
                          <td data-label="Date">{dateShort}</td>
                          <td data-label="Day">{dayLabel}</td>
                          <td data-label="In">{row.CheckIn || row.TimeIn || row.Check_In || "—"}</td>
                          <td data-label="Out">{row.CheckOut || row.TimeOut || row.Check_Out || "—"}</td>
                          <td
                            data-label="Status"
                            className={st === "absent" ? "att-status att-status--absent" : "att-status att-status--present"}
                          >
                            <span className="att-status-pill">{statusLetter}</span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="att-footer">
          <button type="button" className="att-add-comment" onClick={() => setIsModalOpen(true)}>
            Add remarks / comments
          </button>
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