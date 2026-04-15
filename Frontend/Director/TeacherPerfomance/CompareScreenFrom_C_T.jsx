import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import APIEndPoint from "../../unity.js";

const CompareScreenWeb = ({ courseId, courseName, session, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [teacherList, setTeacherList] = useState([]);
  const [selectedTeachers, setSelectedTeachers] = useState([]);
  const [allQuestions, setAllQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [graphData, setGraphData] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const resT = await axios.get(`${APIEndPoint}/Director/GetTeachersByCourse?courseId=${courseId}&session=${session}`);
      setTeacherList(resT.data);

      const resQ = await axios.get(`${APIEndPoint}/Director/GetQuestionsList`);
      setAllQuestions(resQ.data);
      setSelectedQuestions(resQ.data.map((q) => q.Question_ID));
    } catch (e) {
      console.error("Error loading initial data:", e);
    } finally {
      setLoading(false);
    }
  };

  const getTeacherColor = (name, index) => {
    const normalizedName = name.toLowerCase();
    if (normalizedName.includes("jannat")) return "#FF0000";
    if (normalizedName.includes("mohsin")) return "#FFD700";
    if (normalizedName.includes("azeem")) return "#008000";
    const palette = ["#007AFF", "#FF9500", "#AF52DE", "#FF2D55", "#5856D6", "#34C759"];
    return palette[index % palette.length];
  };

  const handleShowEvaluation = async () => {
    if (selectedTeachers.length === 0) {
      alert("Please select at least one teacher.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${APIEndPoint}/Director/GetComparisonData`, {
        TeacherIds: selectedTeachers,
        QuestionIds: selectedQuestions,
        CourseId: courseId,
        Session: session,
      });
      formatGraphDataForWeb(response.data);
    } catch (e) {
      alert("Could not fetch evaluation data.");
    } finally {
      setLoading(false);
    }
  };

  // Recharts requires data in a format: [{ name: 'Q1', TeacherA: 4, TeacherB: 3 }]
  const formatGraphDataForWeb = (apiData) => {
    const sortedQIds = [...selectedQuestions].sort((a, b) => a - b);
    
    const formattedData = sortedQIds.map((qId) => {
      const dataPoint = { name: `Q${qId}` };
      selectedTeachers.forEach((tId) => {
        const teacher = teacherList.find((t) => t.TeacherID === tId);
        const match = apiData.find(
          (d) => d.TeacherID.toString() === tId.toString() && parseInt(d.QuestionNo) === parseInt(qId)
        );
        dataPoint[teacher?.TeacherName || tId] = match ? match.AverageRating : null;
      });
      return dataPoint;
    });

    setGraphData(formattedData);
  };

  return (
    <div className="min-h-screen bg-[#0f3b35] p-4 md:p-8 text-gray-800">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 border-b-2 border-gray-100 pb-2">Director Information</h2>
            <p className="text-gray-600 mt-2 font-medium">Name: Dr. Jamil Sawar</p>
            <p className="text-gray-500 text-sm">Designation: Admin Head</p>
          </div>
          <img 
            src="/path-to-your-avatar.png" 
            alt="Avatar" 
            className="w-20 h-20 rounded-full border-2 border-gray-200"
          />
        </div>

        {/* Info Bar */}
        <div className="bg-white rounded-lg p-4 flex flex-col md:flex-row justify-around items-center font-bold shadow-sm">
          <p>Subject: <span className="text-blue-600">{courseName}</span></p>
          <p>Session: <span className="text-blue-600">{session}</span></p>
        </div>

        {/* Selection Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 bg-white rounded-xl p-6 shadow-md">
            <h3 className="font-bold mb-4 text-[#0f3b35]">Select Teachers:</h3>
            <div className="max-h-64 overflow-y-auto border rounded-md">
              {teacherList.map((t) => (
                <div 
                  key={t.TeacherID}
                  onClick={() => setSelectedTeachers(prev => 
                    prev.includes(t.TeacherID) ? prev.filter(x => x !== t.TeacherID) : [...prev, t.TeacherID]
                  )}
                  className="flex items-center p-3 border-b hover:bg-gray-50 cursor-pointer transition"
                >
                  <input 
                    type="checkbox" 
                    checked={selectedTeachers.includes(t.TeacherID)} 
                    readOnly 
                    className="w-5 h-5 mr-3 accent-[#0f3b35]"
                  />
                  <span className="text-sm font-medium">{t.TeacherName}</span>
                </div>
              ))}
            </div>
            <button 
              onClick={handleShowEvaluation}
              className="w-full mt-6 bg-[#c91212] text-white font-bold py-3 rounded-lg hover:bg-red-700 transition"
            >
              Show Evaluation
            </button>
          </div>

          {/* Graph Area */}
          <div className="lg:col-span-8 bg-white rounded-xl p-6 shadow-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-[#0f3b35]">Performance Comparison</h3>
              <button 
                onClick={() => setShowEditModal(true)}
                className="text-sm bg-gray-100 px-3 py-1 rounded hover:bg-gray-200"
              >
                ⚙️ Edit Questions
              </button>
            </div>

            {graphData.length > 0 ? (
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={graphData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 5]} tickCount={6} />
                    <Tooltip />
                    <Legend />
                    {selectedTeachers.map((tId, idx) => {
                      const teacher = teacherList.find(t => t.TeacherID === tId);
                      const name = teacher?.TeacherName || tId;
                      return (
                        <Line
                          key={tId}
                          type="monotone"
                          dataKey={name}
                          stroke={getTeacherColor(name, idx)}
                          strokeWidth={3}
                          dot={{ r: 4 }}
                          activeDot={{ r: 8 }}
                        />
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[400px] flex items-center justify-center text-gray-400 italic">
                Select teachers and click "Show Evaluation" to view graph
              </div>
            )}
          </div>
        </div>

        {/* Back Button */}
        <button 
          onClick={onBack}
          className="w-full bg-gray-200 text-[#0f3b35] font-bold py-3 rounded-lg hover:bg-gray-300 transition"
        >
          ⬅️ Back
        </button>

        {/* Modal Replacement (Standard Div Overlay) */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold">Edit Questions</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                {allQuestions.map(item => (
                  <div 
                    key={item.Question_ID}
                    onClick={() => setSelectedQuestions(prev => 
                      prev.includes(item.Question_ID) ? prev.filter(x => x !== item.Question_ID) : [...prev, item.Question_ID]
                    )}
                    className="flex items-center p-3 border-b hover:bg-gray-50 cursor-pointer"
                  >
                    <input 
                      type="checkbox" 
                      checked={selectedQuestions.includes(item.Question_ID)} 
                      readOnly 
                      className="w-5 h-5 mr-3 accent-[#0f3b35]"
                    />
                    <span className="text-sm">{item.Question}</span>
                  </div>
                ))}
              </div>
              <div className="p-6 border-t flex gap-4">
                <button 
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-gray-200 py-3 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => { setShowEditModal(false); handleShowEvaluation(); }}
                  className="flex-1 bg-[#0f3b35] text-white py-3 rounded-lg font-bold"
                >
                  Apply Filter
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-20 z-[60]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      )}
    </div>
  );
};

export default CompareScreenWeb;