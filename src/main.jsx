import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './index.css';

// Components Imports
import Login from '../Frontend/Login.jsx';
import StudentDashboard from '../Frontend/Student/StudentDashboard.jsx';
import LastSemStudentDashboard from '../Frontend/Student/LastSemStudentDashboard.jsx';
import Junior_SeniorCourseTeacherDashboard from '../Frontend/Student/Junior_SeniorCourseTeacherDashboard.jsx';
import SeniorTeacherCourse from '../Frontend/Student/SeniorTeacherCourse.jsx';
import StudentQuestionsDashboard from '../Frontend/Student/StudentQuestionsDashboard.jsx'; 
import PeerAssignment from '../Frontend/Teacher/PeerAssignment.jsx';
import TeacherDashboard_HOD from '../Frontend/Teacher/TeacherDashboard_HOD.jsx';
import TeacherEvalutionQuestions from '../Frontend/Teacher/TeacherEvalutionQuestions.jsx';
import PeerEvalutors from '../Frontend/Teacher/PeerEvalutors.jsx';
import NotPeerEvalutors from '../Frontend/Teacher/NotPeerEvalutors.jsx'; // Sahi spelling check karlein
import EvaluateTeachers from '../Frontend/Teacher/EvaluateTeachers.jsx';
import DirectorDashboard from '../Frontend/Director/DirectorDashboard.jsx';
import TeacherPerfomance from '../Frontend/Director/TeacherPerfomance/TeacherPerfomance.jsx';
import CHR from '../Frontend/Teacher/CHR.jsx';
import Attendance from '../Frontend/Teacher/Attendance.jsx';
import RCEvaluation from '../Frontend/Director/TeacherPerfomance/RCEvaluation.jsx';
import CompareScreenFrom_C_T from '../Frontend/Director/TeacherPerfomance/CompareScreenFrom_C_T.jsx';
import ConfidentalStudentEvaluationForm from '../Frontend/Student/ConfidentalStudentEvaluationForm.jsx';
import ConfidentialQuestionsDashboard from '../Frontend/Student/ConfidentialQuestionsDashboard.jsx';
//import ConfidentialQuestionsDashboard from '../Frontend/Student/ConfidentialQuestionsDashboard.jsx';
//import AllAssignedCourseTeachers from '../Frontend/Director/TeacherPerfomance/AllAssignedCourseTeachers.jsx';
//import ViewConfidentialEvaluation from '../Frontend/Director/TeacherPerfomance/ViewConfidentialEvaluation.jsx';
//import ViewRegularEvaluation from '../Frontend/Director/TeacherPerfomance/ViewRegularEvaluation.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Auth Route */}
        <Route path="/" element={<Login />} />

        {/* Student Routes */}
        <Route path="/StudentDashboard" element={<StudentDashboard />} />
        <Route path="/LastSemStudentDashboard" element={<LastSemStudentDashboard />} />
        <Route path="/Junior_SeniorCourseTeacherDashboard" element={<Junior_SeniorCourseTeacherDashboard />} />
        <Route path="/SeniorTeacherCourse" element={<SeniorTeacherCourse />} />
        <Route path="/StudentQuestionsDashboard" element={<StudentQuestionsDashboard />} />
        <Route path="/ConfidentalStudentEvaluationForm" element={<ConfidentalStudentEvaluationForm/>}/>
         <Route path="/ConfidentialQuestionsDashboard" element={<ConfidentialQuestionsDashboard/>}/>

        {/* Teacher Routes */}
        <Route path="/NotPeerEvaluators" element={<NotPeerEvalutors />} />
        <Route path="/PeerAssignment" element={<PeerAssignment />} />
        <Route path="/TeacherDashboard_HOD" element={<TeacherDashboard_HOD />} />
        <Route path="/TeacherEvalutionQuestions" element={<TeacherEvalutionQuestions/>} />
        <Route path="/PeerEvalutors" element={<PeerEvalutors/>} />
        <Route path="/EvaluateTeachers" element={<EvaluateTeachers/>} />
        <Route path="/CHR" element={<CHR/>} />
        <Route path="/Attendance" element={<Attendance/>} />

        {/* Director Routes */}
        <Route path="/DirectorDashboard" element={<DirectorDashboard />} />
        <Route path="/TeacherPerformance" element={<TeacherPerfomance/>} /> {/* Spelling Match with Dashboard */}
        <Route path="/RCEvaluation" element={<RCEvaluation />} />
        <Route path="/CompareScreenFrom_C_T" element={<CompareScreenFrom_C_T />} />
        {/* <Route path="/AllAssignedCourseTeachers" element={<AllAssignedCourseTeachers />} /> */}
        {/* <Route path="/ViewConfidentialEvaluation" element={<ViewConfidentialEvaluation />} /> */}
        {/* <Route path="/ViewRegularEvaluation" element={<ViewRegularEvaluation />} /> */}


        {/* Fallback */}
        <Route path="/dashboard" element={<StudentDashboard />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);