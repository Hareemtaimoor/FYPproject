import React, { useState, useEffect } from "react";
import axios from "axios";
// Assuming you have this file or a similar config
import APIEndPoint from "../../APIEndPoint"; 

const RCEvaluation = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState("Teachers");
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState("");
  const [dataList, setDataList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);

  // 1. Fetch Sessions for the Dropdown
  const fetchSessions = async () => {
    try {
      const response = await axios.get(`${APIEndPoint}/Director/GetAllSessions`);
      setSessions(response.data);
      if (response.data.length > 0) {
        setSelectedSession(response.data[0]);
      }
    } catch (error) {
      console.error("Could not load sessions.", error);
    }
  };

  // 2. Main Logic to Fetch and Merge Data (The "Friend's Logic")
  const fetchData = async () => {
    if (!selectedSession) return;
    setLoading(true);
    try {
      let endpoint = "";
      if (activeTab === "Teachers") {
        endpoint = `${APIEndPoint}/Director/GetAllocatedTeachers?session=${encodeURIComponent(selectedSession)}`;
      } else if (activeTab === "Courses") {
        endpoint = `${APIEndPoint}/Director/GetAllocatedCourses?session=${encodeURIComponent(selectedSession)}`;
      } else {
        setDataList([]);
        setLoading(false);
        return;
      }

      // Step A: Fetch Main List
      const response = await axios.get(endpoint);
      let fetchedData = response.data;

      // Step B: If Teachers Tab, fetch ratings and Merge (Extra logic added here)
      if (activeTab === "Teachers") {
        try {
          const ratingRes = await axios.get(
            `${APIEndPoint}/Director/GetTeacherAverageRatings?session=${encodeURIComponent(selectedSession)}`
          );
          const ratingsMap = ratingRes.data;

          fetchedData = fetchedData.map((teacher) => {
            const ratingObj = ratingsMap.find(
              (r) => 
                String(r.TeacherID).trim().toUpperCase() === 
                String(teacher.TeacherID).trim().toUpperCase()
            );
            
            return {
              ...teacher,
              AverageRating: ratingObj ? ratingObj.AverageRating.toFixed(1) : "N/A",
            };
          });
        } catch (e) {
          console.log("Ratings fetch failed, showing list without ratings.");
        }
      }

      setDataList(fetchedData);
    } catch (error) {
      setDataList([]);
      console.error("API Error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSessions(); }, []);
  useEffect(() => { fetchData(); }, [activeTab, selectedSession]);

  const toggleSelection = (id) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-[#0f3b35] p-4 text-white font-sans">
      {/* Header Card */}
      <div className="bg-white text-black rounded-xl p-4 flex justify-between items-center mb-4 shadow-lg">
        <div>
          <h2 className="font-bold text-lg">Director Information</h2>
          <p className="text-sm text-gray-600">Name: DR. MOHAMMAD JAMIL SAWAR</p>
          <p className="text-sm text-gray-600">Designation: Administrative Head</p>
        </div>
        <img 
          src="/path-to-your-avatar.png" 
          alt="avatar" 
          className="w-12 h-12 rounded-full border border-gray-200" 
        />
      </div>

      {/* Tabs */}
      <div className="flex bg-white/10 p-1 rounded-lg mb-4">
        {["Teachers", "Courses", "Confidential"].map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setSelectedItems([]); }}
            className={`flex-1 py-2 rounded-md text-sm transition-all ${
              activeTab === tab ? "bg-white text-[#0f3b35] font-bold" : "text-gray-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Session Picker */}
      <select 
        value={selectedSession} 
        onChange={(e) => setSelectedSession(e.target.value)}
        className="w-full p-2 mb-4 rounded bg-white text-black focus:outline-none"
      >
        <option value="" disabled>Select Session</option>
        {sessions.map((s, i) => <option key={i} value={s}>{s}</option>)}
      </select>

      {/* List Container */}
      <div className="flex-1 overflow-y-auto mb-4" style={{ maxHeight: '60vh' }}>
        {loading ? (
          <div className="text-center py-10 italic">Loading data...</div>
        ) : dataList.length === 0 ? (
          <div className="text-center py-10 opacity-50">No data available</div>
        ) : (
          dataList.map((item, index) => {
            const id = item.TeacherID || item.CourseNo;
            const isSelected = selectedItems.includes(id);
            return (
              <div key={id || index} className="bg-white text-black p-3 rounded-lg mb-2 flex items-center justify-between">
                <div className="flex items-center flex-1">
                  <input 
                    type="checkbox" 
                    checked={isSelected} 
                    onChange={() => toggleSelection(id)}
                    className="w-5 h-5 mr-3 accent-[#0f3b35]"
                  />
                  <div>
                    <p className="font-bold">{item.TeacherName || item.CourseName}</p>
                    {item.Designation && <p className="text-xs text-gray-500">{item.Designation}</p>}
                  </div>
                </div>

                {activeTab === "Teachers" ? (
                  <div className="bg-[#0f3b35] text-white p-2 rounded-md text-center min-w-[60px]">
                    <p className="text-[10px] uppercase">Avg</p>
                    <p className="font-bold text-sm">{item.AverageRating === "N/A" ? "--" : item.AverageRating}</p>
                  </div>
                ) : (
                  <button className="text-[#0f3b35] text-xl font-bold">➔</button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Buttons */}
      <button 
        disabled={selectedItems.length < 2}
        className={`w-full py-4 rounded-lg font-bold mb-3 transition-opacity ${
          selectedItems.length < 2 ? "bg-red-800 opacity-50" : "bg-red-600 hover:bg-red-700"
        }`}
      >
        Compare Selected ({selectedItems.length})
      </button>

      <button 
        onClick={() => window.history.back()}
        className="w-full py-3 bg-white text-[#0f3b35] font-bold rounded-full shadow-md"
      >
        🏠 Dashboard
      </button>
    </div>
  );
};

export default RCEvaluation;