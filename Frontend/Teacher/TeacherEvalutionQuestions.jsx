import React, { useState } from "react";
import "./TeacherEvalutionQuestions.css";
import logo from "../Images/Biit_Logo.png";
import avatar from "../Images/avatar.png";

const TeacherEvalutionQuestions = () => {
  const [count, setCount] = useState(1);
  const [selectedOption, setSelectedOption] = useState(null);
  const [suggestion, setSuggestion] = useState("");

  const total_ques = 5; // Sample ke liye maine 5 rakha hai, aap ise 20 kar sakti hain

  const options = ["Excellent", "Good", "Satisfactory", "Needs Improvement", "Poor"];

  const handleNext = () => {
    if (!selectedOption) {
      alert("Please select an option!");
      return;
    }
    setCount(count + 1);
    setSelectedOption(null);
  };

  const handleBack = () => {
    if (count > 1) {
      setCount(count - 1);
      setSelectedOption(null);
    }
  };

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
            <p className="info-title">Teacher Evaluated</p>
            <h3 className="teacher-name">Ms. Nadia Arif</h3>
          </div>
          <div className="progress-section">
            <p>Q {count} of {total_ques}</p>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: `${(count / total_ques) * 100}%` }}></div>
            </div>
          </div>
        </div>

        {/* Question Area */}
        <div className="question-content">
          <h2 className="section-title">Evaluation Questions</h2>
          
          <div className="question-box">
            <p className="question-text">
              <span className="q-number">{count}.</span> 
              {count === 1 && "Does the teacher explain the concepts clearly?"}
              {count === 2 && "Is the teacher punctual in classes?"}
              {count === 3 && "Does the teacher encourage student participation?"}
              {count === 4 && "Is the course material up-to-date?"}
              {count === 5 && "The teacher treats all students fairly and respectfully?"}
            </p>

            <div className="options-container">
              {options.map((option) => (
                <div 
                  key={option} 
                  className={`option-item ${selectedOption === option ? "selected" : ""}`}
                  onClick={() => setSelectedOption(option)}
                >
                  <span>{option}</span>
                </div>
              ))}
            </div>

            {/* Suggestion Box: Only shows on the LAST question */}
            {count === total_ques && (
              <div className="suggestion-box">
                <label>Add Suggestions/Comments:</label>
                <textarea 
                  className="suggestion-input" 
                  placeholder="Share your feedback here..."
                  value={suggestion}
                  onChange={(e) => setSuggestion(e.target.value)}
                />
              </div>
            )}

            <div className="nav-buttons">
              {count > 1 && <button className="nav-btn-back" onClick={handleBack}>Back</button>}
              
              {count < total_ques ? (
                <button className="nav-btn-next" onClick={handleNext}>Next</button>
              ) : (
                <button className="nav-btn-submit" onClick={() => alert("Submitted!")}>Submit</button>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TeacherEvalutionQuestions;