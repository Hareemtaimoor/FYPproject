import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./TeacherEvalutionQuestions.css";
import logo from "../Images/Biit_Logo.png";
import avatar from "../Images/avatar.png";
import APIEndPoint from "../unity.js";

const TeacherEvaluationQuestions = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Extract params passed from the previous list page
  const { EvaluatorID, TargetID, TargetName, Qtype, Designation } = location.state || {};
  const formattedID = EvaluatorID ? String(EvaluatorID).trim() : "";

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [count, setCount] = useState(1);
  const [selectedRatings, setSelectedRatings] = useState({}); // Stores { questionId: ratingValue }
  const [suggestion, setSuggestion] = useState("");

  const ratingMap = {
    "Excellent": 5,
    "Good": 4,
    "Satisfactory": 3,
    "Below Average": 2,
    "Poor": 1
  };

  const options = Object.keys(ratingMap);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 1. Fetch Evaluator Profile
        if (formattedID) {
          const profileResp = await fetch(`${APIEndPoint}/Teacher/GetTeacherProfile?TeacherID=${encodeURIComponent(formattedID)}`);
          if (profileResp.ok) {
            const profileData = await profileResp.json();
            setProfile(profileData);
          }
        }

        // 2. Fetch Questions and Filter
        const qResp = await fetch(`${APIEndPoint}/Student/GetQuestions`);
        if (qResp.ok) {
          const qData = await qResp.json();
          
          let targetType = "C"; // Default Common
          const cleanDesignation = Designation ? Designation.trim().toLowerCase() : "";
          const qtypeLower = Qtype ? Qtype.toLowerCase() : "";

          if (qtypeLower.includes("peer")) {
            if (cleanDesignation.includes("junior") || cleanDesignation.includes("jr")) {
              targetType = "PTJ"; // Peer Teacher Junior
            } else {
              targetType = "PTS"; // Peer Teacher Senior
            }
          }

          const filtered = qData.filter(q => q.RawType === targetType);
          setQuestions(filtered.length > 0 ? filtered : qData);
        }
      } catch (error) {
        console.error("Fetch Error:", error);
        alert("Check server connection.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [formattedID, Qtype, Designation]);

  const handleSelectOption = (opt) => {
    const currentQId = questions[count - 1]?.Question_Id;
    if (!currentQId) return;

    setSelectedRatings(prev => ({
      ...prev,
      [currentQId]: ratingMap[opt]
    }));
  };

  const handleSubmit = async () => {
    if (Object.keys(selectedRatings).length < questions.length) {
      alert("Please answer all questions before submitting.");
      return;
    }

    const payload = {
      Evaluator_Emp_no: formattedID,
      Target_Emp_no: TargetID,
      Suggestion: suggestion,
      Answers: Object.entries(selectedRatings).map(([id, rating]) => ({
        Question_ID: parseInt(id),
        Rating: rating
      }))
    };

    try {
      setLoading(true);
      const response = await fetch(`${APIEndPoint}/Evaluation/SubmitPeer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert("Evaluation submitted successfully!");
        navigate(-1);
      } else {
        const result = await response.json();
        alert(result.message || "Failed to save data.");
      }
    } catch (error) {
      alert("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="web-loader">Loading...</div>;

  const currentQuestion = questions[count - 1];
  const total_ques = questions.length;

  return (
    <div className="web-main-container">
      <div className="evaluation-card">
        
        {/* Sidebar */}
        <div className="evaluation-sidebar">
          <img src={logo} alt="BIIT Logo" className="card-logo" />
          <div className="avatar-wrapper">
            <img src={avatar} alt="Avatar" className="avatar-img" />
          </div>
          <div className="info-box">
            <p className="info-title">Evaluating Teacher</p>
            <h3 className="teacher-name">{TargetName}</h3>
            <p className="teacher-desig">{Designation}</p>
          </div>
          
          <div className="progress-section">
            <p>Q {count} of {total_ques}</p>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: `${(count / total_ques) * 100}%` }}></div>
            </div>
          </div>

          <button className="sidebar-back-btn" onClick={() => navigate(-1)}>⬅ Back</button>
        </div>

        {/* Question Area */}
        <div className="question-content">
          <h2 className="section-title">Peer Evaluation</h2>
          
          <div className="question-box">
            {questions.length > 0 ? (
              <>
                <p className="question-text">
                  <span className="q-number">{count}.</span> 
                  {currentQuestion?.Question1}
                </p>

                <div className="options-container">
                  {options.map((option) => (
                    <div 
                      key={option} 
                      className={`option-item ${selectedRatings[currentQuestion?.Question_Id] === ratingMap[option] ? "selected" : ""}`}
                      onClick={() => handleSelectOption(option)}
                    >
                      <span>{option}</span>
                    </div>
                  ))}
                </div>

                {count === total_ques && (
                  <div className="suggestion-box">
                    <label>Suggestions for {TargetName}:</label>
                    <textarea 
                      className="suggestion-input" 
                      placeholder="Write your feedback here..."
                      value={suggestion}
                      onChange={(e) => setSuggestion(e.target.value)}
                    />
                  </div>
                )}

                <div className="nav-buttons">
                  <button 
                    className="nav-btn-back" 
                    disabled={count === 1} 
                    onClick={() => setCount(count - 1)}
                    style={{ visibility: count === 1 ? 'hidden' : 'visible' }}
                  >
                    Back
                  </button>
                  
                  {count < total_ques ? (
                    <button className="nav-btn-next" onClick={() => {
                        if (selectedRatings[currentQuestion?.Question_Id]) setCount(count + 1);
                        else alert("Please select an option");
                    }}>
                      Next
                    </button>
                  ) : (
                    <button className="nav-btn-submit" onClick={handleSubmit}>Submit Feedback</button>
                  )}
                </div>
              </>
            ) : (
              <p>No questions found for this category.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherEvaluationQuestions;