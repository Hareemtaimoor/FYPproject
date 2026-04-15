import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./PeerAssignment.css";
import logo from "../Images/Biit_Logo.png";
import avatar from "../Images/avatar.png";
import ApiEndPoint from '../unity.js';

const PeerAssignment = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [allTeachers, setAllTeachers] = useState([]);
  const [selectedTeachers, setSelectedTeachers] = useState([]);
  const [loading, setLoading] = useState(false);

  // 1. Data Fetching
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${ApiEndPoint}Teacher/GetAllTeachers`);
        if (response.data) {
          const sorted = response.data.sort((a, b) => a.Name.localeCompare(b.Name));
          setAllTeachers(sorted);

          // Pre-select jo pehle se eval = 1 hain
          const preSelected = sorted
            .filter(t => t.EvalStatus === 1 || t.EvalStatus === "1")
            .map(t => t.Emp_no);
          
          setSelectedTeachers(preSelected);
        }
      } catch (error) {
        console.error("Error fetching teachers:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTeachers();
  }, []);

  const filteredTeachers = allTeachers.filter((teacher) =>
    teacher.Name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleTeacher = (id) => {
    if (selectedTeachers.includes(id)) {
      setSelectedTeachers(selectedTeachers.filter((tId) => tId !== id));
    } else {
      setSelectedTeachers([...selectedTeachers, id]);
    }
  };

  // 4. Save Logic
  const handleAssign = async () => {
    try {
      setLoading(true);
      
      // Axios request with explicit content-type
      const response = await axios({
        method: 'post',
        url: `${ApiEndPoint}Teacher/SavePeerAssignment`,
        data: selectedTeachers, // Array of strings
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 200) {
        alert("Peer Assignment successfully updated!");
        navigate(-1);
      }
    } catch (error) {
      // Detailed error logging
      const errorMsg = error.response?.data?.Message || "Failed to save assignment.";
      alert(errorMsg);
      console.error("Save Error:", error.response || error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="peer-mobile-bg">
      <div className="peer-mobile-container">
        
        <div className="peer-header">
          <img src={logo} alt="BIIT Logo" className="peer-main-logo" />
        </div>

        <div className="peer-info-card">
          <div className="peer-card-label">Teacher Information</div>
          <div className="peer-info-content">
            <div className="peer-text-details">
              <p>Name: <strong>Dr. Munir Ahmed</strong></p>
              <p>Designation: HOD</p>
            </div>
            <img src={avatar} alt="Profile" className="peer-avatar-img" />
          </div>
        </div>

        <div className="peer-data-card">
          <div className="peer-table-header">Peer Assignment</div>

          <div className="peer-search-box">
            <input 
              type="text" 
              placeholder="Name 🔍 Search" 
              className="peer-input" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="peer-table-wrapper">
            {loading && allTeachers.length === 0 ? (
              <div style={{textAlign:'center', padding:'20px', color:'#0f3b35'}}>Loading Teachers...</div>
            ) : (
              <table className="peer-main-table">
                <thead>
                  <tr>
                    <th>Teacher Name</th>
                    <th>Select</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeachers.map((teacher) => (
                    <tr 
                      key={teacher.Emp_no} 
                      onClick={() => toggleTeacher(teacher.Emp_no)}
                      className={selectedTeachers.includes(teacher.Emp_no) ? "row-highlight" : ""}
                    >
                      <td>{teacher.Name}</td>
                      <td>
                        <div className={`peer-checkbox ${selectedTeachers.includes(teacher.Emp_no) ? "checked" : ""}`}>
                          {selectedTeachers.includes(teacher.Emp_no) && "✓"}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="peer-footer">
          <button 
            className="peer-submit-pill" 
            disabled={loading}
            onClick={handleAssign}
          >
             {loading ? "Processing..." : `✓ Submit (${selectedTeachers.length})`}
          </button>
          <button className="peer-home-btn" onClick={() => navigate(-1)}>
             🏠 Home
          </button>
        </div>

      </div>
    </div>
  );
};

export default PeerAssignment;