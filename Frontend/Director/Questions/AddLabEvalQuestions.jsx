import React, { useState } from "react";
import "./AddLabEvalQuestions.css";
// Images ke paths ko dhyan se check karein
import logo from "../../Images/Biit_Logo.png"; 
import avatar from "../../Images/avatar.png";

const AddLabEvalQuestions = () => {
  const [showInput, setShowInput] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  
  // Isay state banaya taake questions list update ho sake
  const [questions, setQuestions] = useState([
    "Did the teacher explain the experiments clearly?",
    "Did the teacher encourage student participation and teamwork?",
    "Did the teacher encourage student participation and teamwork?"
  ]);

  const handleAddQuestion = () => {
    if (newQuestion.trim() !== "") {
      setQuestions([...questions, newQuestion]); // Naya sawal list mein add hoga
      setNewQuestion("");
      setShowInput(false);
    } else {
      alert("Please enter a question");
    }
  };

  const deleteQuestion = (index) => {
    const updatedQuestions = questions.filter((_, i) => i !== index);
    setQuestions(updatedQuestions);
  };

  return (
    <div className="main-container">
      {/* Logo Section */}
      <div className="logo-wrapper">
         <img src={logo} alt="BIIT Logo" className="web-logo" onError={(e) => e.target.style.display='none'} />
      </div>

      {/* Director Information Card */}
      <div className="info-card">
        <h3 className="info-title">Director Information</h3>
        <div className="info-row">
          <div className="info-text">
            <p><strong>Name:</strong> Dr. Jamil Sawar</p>
            <p><strong>Designation:</strong> Administrative Head</p>
          </div>
          <img src={avatar} alt="Director" className="avatar-web" onError={(e) => e.target.style.backgroundColor='#ccc'} />
        </div>
      </div>

      {/* Questions Management Card */}
      <div className="question-card">
        <h3 className="card-title">Add Student Eval Questions</h3>

        <div className="questions-list">
          {questions.map((q, index) => (
            <div key={index} className="question-item">
              <p className="question-text">{index + 1}. {q}</p>
              <div className="btn-row">
                <button className="edit-btn">Edit</button>
                <button className="delete-btn" onClick={() => deleteQuestion(index)}>Delete</button>
              </div>
            </div>
          ))}
        </div>

        {/* Dynamic Input Box */}
        {showInput && (
          <div className="input-box">
            <input
              type="text"
              placeholder="Enter new question"
              className="web-input"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              autoFocus
            />
            <button className="ok-btn" onClick={handleAddQuestion}>OK</button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="action-row">
          <button className="add-btn" onClick={() => setShowInput(true)}>Add</button>
          <button className="submit-btn" onClick={() => alert("Submitted Successfully!")}>Submit</button>
        </div>
      </div>

      {/* Dashboard Navigation */}
      <button className="dashboard-nav-btn">
        🏠 Dashboard
      </button>
    </div>
  );
};

export default AddLabEvalQuestions;