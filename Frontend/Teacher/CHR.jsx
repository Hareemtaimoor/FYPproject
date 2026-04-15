import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./CHR.css";
import logo from "../Images/Biit_Logo.png";
import avatar from "../Images/avatar.png";
import APIEndPoint from "../unity"; 

const CHR = () => {
  const navigate = useNavigate();
  const [teacherData, setTeacherData] = useState(null);
  const [chrData, setChrData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // States for Date History
  const [dateList, setDateList] = useState([]); 
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // States for Modal
  const [showModal, setShowModal] = useState(false);
  const [comment, setComment] = useState("");

  const userData = JSON.parse(localStorage.getItem("user")) || {};
  const TeacherID = userData.userid;

  const getDayName = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  useEffect(() => {
    if (!TeacherID) {
      navigate("/");
      return;
    }
    fetchDateHistory();
  }, [TeacherID]);

  useEffect(() => {
    if (TeacherID && selectedDate) {
      fetchCHRReport(selectedDate);
    }
  }, [selectedDate]);

  const fetchDateHistory = async () => {
    try {
      const res = await axios.get(`${APIEndPoint}Teacher/GetAvailableCHRDates?tId=${TeacherID}`);
      if (res.data && res.data.length > 0) {
        setDateList(res.data);
        if (!res.data.includes(selectedDate)) {
          setSelectedDate(res.data[0]);
        }
      }
    } catch (error) {
      console.error("History Error:", error.response || error);
    }
  };

  const fetchCHRReport = async (date) => {
    setLoading(true);
    try {
      const res = await axios.get(`${APIEndPoint}Teacher/GetTeacherCHR?tId=${TeacherID}&date=${date}`);
      setTeacherData(res.data.Profile); 
      setChrData(res.data.Reports || []);
    } catch (error) {
      console.error("Fetch Error:", error.response || error);
      setChrData([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chr-mobile-bg">
      <div className="chr-container">
        
        <div className="chr-logo-header">
          <img src={logo} alt="BIIT Logo" className="chr-main-logo" />
        </div>

        {/* Date Selection Dropdown */}
        <div className="chr-date-selector">
          <label className="dropdown-label">Select History Date:</label>
          <select 
            className="history-dropdown"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          >
            {dateList.length > 0 ? (
              dateList.map((d, i) => (
                <option key={i} value={d}>{d} ({getDayName(d)})</option>
              ))
            ) : (
              <option value={selectedDate}>{selectedDate}</option>
            )}
          </select>
        </div>

        {/* Teacher Info (White Card) */}
        <div className="chr-info-card">
          <h3 className="chr-card-label">Teacher Information</h3>
          <div className="chr-info-content">
            <div className="chr-text-details">
              <p>Name: <strong>{teacherData?.Name || "Malaika Noor"}</strong></p>
              <p>Designation: {teacherData?.Designation || "Student"}</p>
            </div>
            <img src={avatar} alt="Profile" className="chr-avatar-img" />
          </div>
        </div>

        {/* Class Held Report (White Table Card) */}
        <div className="chr-report-card-white">
          <div className="chr-table-header-dark">
             Class Held Report
             <div className="chr-date-sub-gold">{getDayName(selectedDate)}</div>
          </div>
          
          <div className="chr-table-wrapper-white">
            {loading ? (
              <div className="mini-loader">Loading Report...</div>
            ) : (
              <table className="chr-main-table-white">
                <thead>
                  <tr>
                    <th>Sr.</th>
                    <th>Subject</th>
                    <th>Sec</th>
                    <th>Venue</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {chrData.length > 0 ? (
                    chrData.map((item, index) => (
                      <tr key={index}>
                        <td>{item.SrNo || index + 1}</td>
                        <td>{item.Course || "-"}</td>
                        <td>{item.Discipline_Section || "-"}</td>
                        <td>{item.Venue || "-"}</td>
                        <td className={item.Status?.toLowerCase() === 'late' ? 'status-red' : 'status-green'}>
                          {item.Status || "Held"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="5" className="no-data">No history records.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="chr-footer">
          <p className="chr-add-comment" onClick={() => setShowModal(true)}>+ Add Comments</p>
          <button className="chr-home-btn" onClick={() => navigate(-1)}>🏠 Home</button>
        </div>

        {/* Modal Overlay */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h4>Class Remark</h4>
              <textarea 
                placeholder="Enter comments..." 
                value={comment} 
                onChange={(e) => setComment(e.target.value)} 
              />
              <div className="modal-btns">
                <button onClick={() => setShowModal(false)}>Close</button>
                <button className="save-btn" onClick={() => setShowModal(false)}>Save</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default CHR;