import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./StudentQuestionsDashboard.css";
import biitLogo from "../Images/Biit_Logo.png";
import avatar from "../Images/avatar.png";
import ApiEndPoint from '../unity.js';

const StudentQuestionsDashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { courseNo, AridNo, teacherName, isLastSemester, teacherID } = location.state || {};

    const [studentProfile, setStudentProfile] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [allAnswers, setAllAnswers] = useState({});

    useEffect(() => {
        const fetchData = async () => {
            if (!AridNo) { 
                alert("Session expired. Please login again.");
                navigate("/"); 
                return; 
            }
            try {
                setLoading(true);
                const sRes = await axios.get(`${ApiEndPoint}Student/GetStudentProfile?AridNo=${AridNo}`);
                setStudentProfile(sRes.data);

                const qRes = await axios.get(`${ApiEndPoint}Student/GetQuestions`);
                if (qRes.status === 200) {
                    let fetchedQuestions = qRes.data;
                    if (!isLastSemester) {
                        fetchedQuestions = fetchedQuestions.filter(q => q.RawType !== 'S');
                    }
                    setQuestions(fetchedQuestions);
                }
            } catch (err) { 
                console.error("Fetch Error:", err.response?.data || err.message);
                alert("Could not connect to server. Check if your API is running at " + ApiEndPoint);
            } finally { 
                setLoading(false); 
            }
        };
        fetchData();
    }, [AridNo, isLastSemester, navigate]);

    // ✨ NEW: Auto-next logic when selectedOption is updated
    useEffect(() => {
        if (selectedOption !== null) {
            const timer = setTimeout(() => {
                if (currentIndex < questions.length - 1) {
                    handleNext();
                }
            }, 300); // 300ms delay for better UX
            return () => clearTimeout(timer);
        }
    }, [selectedOption]);

    const handleQuickFill = () => {
        const quickAnswers = {};
        questions.forEach((q) => {
            quickAnswers[q.Question_Id] = 4;
        });
        setAllAnswers(quickAnswers);
        setCurrentIndex(questions.length - 1);
        setSelectedOption(4);
    };

    const handleNext = () => {
        if (selectedOption === null) return alert("Please select a rating.");
        const qId = questions[currentIndex].Question_Id;
        const updatedAnswers = { ...allAnswers, [qId]: selectedOption };
        setAllAnswers(updatedAnswers);

        if (currentIndex < questions.length - 1) {
            const nextIdx = currentIndex + 1;
            setCurrentIndex(nextIdx);
            const nextQId = questions[nextIdx].Question_Id;
            setSelectedOption(updatedAnswers[nextQId] || null);
        }
    };

    const handleBack = () => {
        if (currentIndex > 0) {
            const prevIdx = currentIndex - 1;
            setCurrentIndex(prevIdx);
            setSelectedOption(allAnswers[questions[prevIdx].Question_Id] || null);
        }
    };

    const handleSubmit = async () => {
        if (selectedOption === null) return alert("Please answer the last question.");
        
        const qId = questions[currentIndex].Question_Id;
        const finalAnswersList = { ...allAnswers, [qId]: selectedOption };

        const submissionData = {
            Emp_no: teacherID || "", 
            Reg_no: AridNo || "",
            Course_no: courseNo || "",
            Discipline: studentProfile?.Course || "BCS",
            Answers: Object.keys(finalAnswersList).map(id => ({
                Question_ID: parseInt(id),
                Rating: finalAnswersList[id]
            }))
        };

        try {
            setLoading(true);
            const response = await axios.post(`${ApiEndPoint}Student/SubmitEvaluation`, submissionData);
            
            if (response.status === 200) {
                alert("Evaluation stored successfully!");
                navigate(-1); 
            }
        } catch (error) {
            const errorMsg = error.response?.data?.ExceptionMessage || error.response?.data?.Message || error.message;
            console.error("Submission Failed Detail:", errorMsg);
            alert(`Failed: ${errorMsg}`);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="questions-container"><div className="loading-text">Processing...</div></div>;

    return (
        <div className="questions-container">
            <button className="dashboard-back-link" onClick={() => navigate(-1)}>← Dashboard</button>
            <div className="questions-scroll-area">
                <div className="top-logo-wrap"><img src={biitLogo} alt="Logo" className="header-logo-img" /></div>
                
                <div className="white-pill-card">
                    <div className="student-info-flex">
                        <div className="info-text-box">
                            <p>Name: <strong>{studentProfile?.FullName}</strong></p>
                            <p>Arid#: {AridNo}</p>
                        </div>
                        <img src={avatar} alt="Avatar" className="student-avatar-img" />
                    </div>
                </div>

                <div className="white-pill-card">
                    <div className="student-info-flex">
                        <div className="info-text-box">
                            <p>Teacher: <span style={{color: '#d32f2f', fontWeight: 'bold'}}>{teacherName || "N/A"}</span></p>
                            <p>
                                Course: 
                                <span style={{ color: '#1976d2', fontWeight: 'bold' }}>
                                    {courseNo || "N/A"} 
                                    {location.state?.courseName ? ` - ${location.state.courseName}` : ""}
                                </span>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="white-pill-card question-main-card">
                    <div className="q-counter-badge">{currentIndex + 1} / {questions.length}</div>
                    <h2 className="question-heading">{questions[currentIndex]?.Question1}</h2>
                    <div className="rating-options-grid">
                        {[1, 2, 3, 4, 5].map((num) => (
                            <button key={num} 
                                className={`rating-circle ${selectedOption === num ? "selected" : ""}`}
                                onClick={() => setSelectedOption(num)}>{num}</button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="questions-footer-nav">
                <button className="nav-btn-outline" onClick={handleBack} disabled={currentIndex === 0}>Back</button>
                
                {currentIndex < questions.length - 1 && (
                    <button className="nav-btn-quick" onClick={handleQuickFill} style={{backgroundColor: '#ffc107', color: 'black'}}>Quick Fill (4)</button>
                )}

                {currentIndex < questions.length - 1 ? (
                    <button className="nav-btn-solid" onClick={handleNext}>Next</button>
                ) : (
                    <button className="nav-btn-submit" onClick={handleSubmit}>Submit</button>
                )}
            </div>
        </div>
    );
};

export default StudentQuestionsDashboard;