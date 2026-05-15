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
import EvaluationRate from '../Frontend/Teacher/EvaluationRate.jsx';
import DirectorDashboard from '../Frontend/Director/DirectorDashboard.jsx';
import TeacherPerfomance from '../Frontend/Director/TeacherPerfomance/TeacherPerfomance.jsx';
import CHR from '../Frontend/Teacher/CHR.jsx';
import Attendance from '../Frontend/Teacher/Attendance.jsx';
import RCEvaluation from '../Frontend/Director/TeacherPerfomance/RCEvaluation.jsx';
import ConfidentialRCEvaluation from '../Frontend/Director/TeacherPerfomance/ConfidentialRCEvaluation.jsx';
import CompareScreenFrom_C_T from '../Frontend/Director/TeacherPerfomance/CompareScreenFrom_C_T.jsx';
import ConfidentialCompareScreen from '../Frontend/Director/TeacherPerfomance/ConfidentialCompareScreen.jsx';
import TeacherPerformanceDashboard from '../Frontend/Director/TeacherPerfomance/TeacherPerformanceDashboard.jsx';
import CompareResults from '../Frontend/Director/TeacherPerfomance/CompareResults.jsx';
import GenderAnalytics from '../Frontend/Director/TeacherPerfomance/GenderAnalytics.jsx';
import TeacherGradeDashboard from '../Frontend/Director/TeacherPerfomance/TeacherGradeDashboard.jsx';
import AddLabEvalQuestions from '../Frontend/Director/Questions/AddLabEvalQuestions.jsx';
import ConfidentalStudentEvaluationForm from '../Frontend/Student/ConfidentalStudentEvaluationForm.jsx';
import ConfidentialQuestionsDashboard from '../Frontend/Student/ConfidentialQuestionsDashboard.jsx';
import ConfidentialDecryptor from '../Frontend/Director/ConfidentialDecryptor.jsx';
import ConfidentialDecryptorTable from '../Frontend/Director/ConfidentialDecryptorTable.jsx';
import AdminDashboard from '../Frontend/Admin/AdminDashboard.jsx';
import UploadAttendance from '../Frontend/Admin/UploadAttendance.jsx';
import UploadCHR from '../Frontend/Admin/UploadCHR.jsx';
import ManagerDashboard from '../Frontend/Manager/ManagerDashboard.jsx';
import ManageStudent from '../Frontend/Manager/ManageStudent.jsx';
import UpdateFaculty from '../Frontend/Manager/UpdateFaculty.jsx';
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
        <Route path="/EvaluationRate" element={<EvaluationRate/>} />

        {/* Manager Routes */}
        <Route path="/ManagerDashboard" element={<ManagerDashboard />} />
        <Route path="/ManagerManageStudent" element={<ManageStudent />} />
        <Route path="/ManagerUpdateStudent" element={<UpdateFaculty />} />

        {/* Admin Routes */}
        <Route path="/AdminDashboard" element={<AdminDashboard />} />
        <Route path="/UploadAttendance" element={<UploadAttendance />} />
        <Route path="/UploadCHR" element={<UploadCHR />} />

        {/* Director Routes */}
        <Route path="/DirectorDashboard" element={<DirectorDashboard />} />
        <Route path="/ManageQuestions" element={<AddLabEvalQuestions />} />
        <Route path="/TeacherPerformance" element={<TeacherPerfomance/>} /> {/* Spelling Match with Dashboard */}
        <Route path="/RCEvaluation" element={<RCEvaluation />} />
        <Route path="/ConfidentialRCEvaluation" element={<ConfidentialRCEvaluation />} />
        <Route path="/TeacherPerformanceDashboard" element={<TeacherPerformanceDashboard />} />
        <Route path="/CompareResults" element={<CompareResults />} />
        <Route path="/CompareScreenFrom_C_T" element={<CompareScreenFrom_C_T />} />
        <Route path="/ConfidentialCompareScreen" element={<ConfidentialCompareScreen />} />
        <Route path="/GenderAnalytics" element={<GenderAnalytics />} />
        <Route path="/TeacherGradeDashboard" element={<TeacherGradeDashboard />} />
        <Route path="/ConfidentialDecryptor" element={<ConfidentialDecryptor />} />
        <Route path="/ConfidentialDecryptorTable" element={<ConfidentialDecryptorTable />} />
        {/* <Route path="/AllAssignedCourseTeachers" element={<AllAssignedCourseTeachers />} /> */}
        {/* <Route path="/ViewConfidentialEvaluation" element={<ViewConfidentialEvaluation />} /> */}
        {/* <Route path="/ViewRegularEvaluation" element={<ViewRegularEvaluation />} /> */}


        {/* Fallback */}
        <Route path="/dashboard" element={<StudentDashboard />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);