import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./AddLabEvalQuestions.css";
import logo from "../../Images/Biit_Logo.png";
import maleAvatar from "../../Images/maleAvatar.png";
import APIEndPoint from "../../unity.js";

const api = (path) => `${APIEndPoint}${path.replace(/^\//, "")}`;

const evalTypes = [
  { id: "T", label: "Teacher" },
  { id: "C", label: "Course" },
  { id: "P", label: "Peer" },
  { id: "S", label: "Supervisor" },
  { id: "Conf", label: "Confidential" },
];

const normalizeQuestion = (q) => ({
  Question_ID: q.Question_ID ?? q.Question_Id ?? 0,
  Question: (q.Question ?? q.Question1 ?? "").toString(),
  Type: (q.Type ?? q.RawType ?? "").toString(),
});

const AddLabEvalQuestions = () => {
  const navigate = useNavigate();
  const topRef = useRef(null);

  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newQuestion, setNewQuestion] = useState("");
  const [selectedType, setSelectedType] = useState("T");
  const [subType, setSubType] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(api("Director/GetActiveQuestions"));
      const raw = Array.isArray(response.data) ? response.data : [];
      const validData = raw.map(normalizeQuestion).filter((q) => q.Question_ID !== 0);
      setQuestions(validData);
      setFilteredQuestions(validData);
    } catch {
      alert("Could not load questions.");
      setQuestions([]);
      setFilteredQuestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const applyFilters = useCallback(
    (list, search, type) => {
      let temp = [...list];
      if (type !== "All") {
        temp = temp.filter((q) => {
          if (type === "P") return q.Type === "P" || q.Type === "PTS" || q.Type === "PTJ";
          if (type === "Conf") return q.Type === "Conf" || q.Type === "FT" || q.Type === "FE";
          return q.Type === type;
        });
      }
      const s = (search ?? "").trim();
      if (s) {
        const lower = s.toLowerCase();
        temp = temp.filter(
          (q) =>
            String(q.Question_ID).includes(s) ||
            (q.Question && q.Question.toLowerCase().includes(lower))
        );
      }
      return temp;
    },
    []
  );

  useEffect(() => {
    setFilteredQuestions(applyFilters(questions, searchQuery, filterType));
  }, [questions, searchQuery, filterType, applyFilters]);

  const resetForm = () => {
    setNewQuestion("");
    setEditingId(null);
    setSubType("");
    setSelectedType("T");
  };

  const handleSave = async () => {
    if (!newQuestion.trim()) {
      alert("Enter question text.");
      return;
    }

    const finalDescription =
      (selectedType === "Conf" || selectedType === "P") && subType ? subType : selectedType;

    if ((selectedType === "Conf" || selectedType === "P") && !subType) {
      alert("Please select a sub-type (FT/FE or PTS/PTJ).");
      return;
    }

    const payload = {
      Question_ID: editingId || 0,
      Question: newQuestion.trim(),
      Description: finalDescription,
    };

    try {
      setSaving(true);
      const action = editingId ? "ModifyQuestion" : "AddQuestion";
      await axios.post(api(`Director/${action}`), payload);
      alert(editingId ? "Question modified (new version created)." : "Question added.");
      resetForm();
      fetchQuestions();
    } catch {
      alert("Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item) => {
    setEditingId(item.Question_ID);
    setNewQuestion(item.Question || "");
    if (["FT", "FE"].includes(item.Type)) {
      setSelectedType("Conf");
      setSubType(item.Type);
    } else if (["PTS", "PTJ"].includes(item.Type)) {
      setSelectedType("P");
      setSubType(item.Type);
    } else {
      setSelectedType(item.Type || "T");
      setSubType("");
    }
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleRemove = async (item) => {
    if (!window.confirm(`Remove question ID ${item.Question_ID}?`)) return;
    try {
      await axios.post(api("Director/RemoveQuestion"), { Question_ID: item.Question_ID });
      alert("Removed.");
      fetchQuestions();
    } catch {
      alert("Remove failed or endpoint not available.");
    }
  };

  return (
    <div className="seq-page">
      <div ref={topRef} className="seq-top-anchor" />

      <div className="seq-logo-container">
        <img src={logo} alt="BIIT" className="seq-logo" />
      </div>

      <div className="seq-scroll">
        <div className="seq-profile-card">
          <div className="seq-profile-info">
            <p className="seq-p-text">
              Name: <strong>DR. MOHAMMAD JAMIL SAWAR</strong>
            </p>
            <p className="seq-p-text">
              Role: <strong>Director</strong>
            </p>
            <p className="seq-p-sub">BIIT Administration</p>
          </div>
          <img src={maleAvatar} alt="" className="seq-avatar" />
        </div>

        <div className="seq-white-box">
          <p className="seq-box-label">
            {editingId ? `MODIFYING ID: ${editingId}` : "CREATE NEW QUESTION"}
          </p>

          <div className="seq-create-type-row">
            {evalTypes.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`seq-mini-tab ${selectedType === t.id ? "seq-active-tab" : ""}`}
                onClick={() => {
                  setSelectedType(t.id);
                  setSubType("");
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {selectedType === "Conf" && (
            <div className="seq-sub-type-row">
              {["FT", "FE"].map((st) => (
                <button
                  key={st}
                  type="button"
                  className={`seq-sub-btn ${subType === st ? "seq-active-sub" : ""}`}
                  onClick={() => setSubType(st)}
                >
                  {st === "FT" ? "FT (Theory)" : "FE (Exp)"}
                </button>
              ))}
            </div>
          )}

          {selectedType === "P" && (
            <div className="seq-sub-type-row">
              {["PTS", "PTJ"].map((st) => (
                <button
                  key={st}
                  type="button"
                  className={`seq-sub-btn ${subType === st ? "seq-active-sub" : ""}`}
                  onClick={() => setSubType(st)}
                >
                  {st === "PTS" ? "PTS (Senior)" : "PTJ (Junior)"}
                </button>
              ))}
            </div>
          )}

          <textarea
            className="seq-input-field"
            placeholder="Question text..."
            rows={3}
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
          />

          {editingId ? (
            <div className="seq-button-row">
              <button type="button" className="seq-add-btn seq-add-btn-grow" onClick={handleSave} disabled={saving}>
                {saving ? "…" : "UPDATE VERSION"}
              </button>
              <button type="button" className="seq-add-btn seq-cancel-btn" onClick={resetForm}>
                CANCEL
              </button>
            </div>
          ) : (
            <button type="button" className="seq-add-btn" onClick={handleSave} disabled={saving}>
              {saving ? "…" : "ADD QUESTION"}
            </button>
          )}
        </div>

        <div className="seq-manage-header">
          <div className="seq-header-row">
            <span className="seq-section-title">MANAGE QUESTIONS</span>
            <span className="seq-count-badge">
              <span className="seq-count-text">{filteredQuestions.length}</span>
            </span>
          </div>

          <input
            type="search"
            className="seq-search-bar"
            placeholder="Search ID or Question..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <div className="seq-filter-scroll" role="tablist" aria-label="Filter by type">
            <button
              type="button"
              className={`seq-filter-btn ${filterType === "All" ? "seq-active-filter" : ""}`}
              onClick={() => setFilterType("All")}
            >
              All
            </button>
            {evalTypes.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`seq-filter-btn ${filterType === t.id ? "seq-active-filter" : ""}`}
                onClick={() => setFilterType(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="seq-question-list-box">
          {loading ? (
            <div className="seq-loader-wrap">
              <div className="seq-spinner" />
            </div>
          ) : filteredQuestions.length > 0 ? (
            <div className="seq-question-list-inner">
              {filteredQuestions.map((item) => (
                <div key={item.Question_ID} className="seq-single-question-item">
                  <div className="seq-q-header">
                    <span className="seq-q-id-text">ID: {item.Question_ID}</span>
                    <span className="seq-type-tag">{item.Type}</span>
                  </div>
                  <p className="seq-q-main-text">{item.Question}</p>
                  <div className="seq-q-actions">
                    <button type="button" className="seq-action-btn seq-action-modify" onClick={() => startEdit(item)}>
                      Modify
                    </button>
                    <button type="button" className="seq-action-btn seq-action-remove" onClick={() => handleRemove(item)}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="seq-no-data-text">No questions found.</p>
          )}
        </div>

        <button type="button" className="seq-back-btn" onClick={() => navigate("/DirectorDashboard")}>
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default AddLabEvalQuestions;
