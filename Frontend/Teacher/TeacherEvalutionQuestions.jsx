import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import "./TeacherEvalutionQuestions.css";
import logo from "../Images/Biit_Logo.png";
import avatar from "../Images/avatar.png";
import APIEndPoint from "../unity.js";
import { extractTeacherDisplay, readUserFromStorage, unwrapProfilePayload } from "./teacherProfileDisplay.js";

const api = (path) => `${APIEndPoint}${path.replace(/^\//, "")}`;

const readStoredTeacherId = () => {
  try {
    const u = JSON.parse(localStorage.getItem("user"));
    if (u?.userid != null && String(u.userid).trim() !== "") return String(u.userid).trim();
    if (u?.userId != null && String(u.userId).trim() !== "") return String(u.userId).trim();
  } catch {
    /* ignore */
  }
  return "";
};

/** Backend peer ratings: higher = better. UI shows 1–5 with legend 1=Excellent … 5=Poor. */
const RATING_SCALE = [
  { displayNum: 1, label: "Poor", value: 5 },
  { displayNum: 2, label: "Below Average", value: 4 },
  { displayNum: 3, label: "Satisfactory", value: 3 },
  { displayNum: 4, label: "Good", value: 2 },
  { displayNum: 5, label: "Excelent", value: 1 },
];

/**
 * Used only when `Student/GetQuestions` fails or returns no rows for this peer type.
 * IDs are placeholders — your API must accept them or sync these with DB question IDs.
 */
const getFallbackPeerQuestions = (rawType) => {
  const rt = rawType === "PTJ" ? "PTJ" : "PTS";
  const lines = [
    "Subject knowledge and preparation for class.",
    "Clarity of explanation and use of examples.",
    "Student engagement and classroom interaction.",
    "Punctuality, attendance, and professional conduct.",
    "Fairness in assessment and feedback to students.",
    "Use of teaching aids / technology where appropriate.",
    "Contribution to department and academic environment.",
    "Overall effectiveness as a teacher.",
  ];
  return lines.map((Question1, i) => ({
    Question_Id: 99001 + i,
    Question1,
    RawType: rt,
  }));
};

const TeacherEvaluationQuestions = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const state = location.state || {};

  const TargetID = (
    state.TargetID ??
    searchParams.get("targetId") ??
    searchParams.get("TargetID") ??
    ""
  )
    .toString()
    .trim();

  const EvaluatorID = state.EvaluatorID ?? searchParams.get("evaluatorId") ?? "";
  const TargetName = state.TargetName ?? "";
  const Qtype = state.Qtype ?? "Peer Evaluation";
  const Designation = state.Designation ?? "";

  const formattedID =
    EvaluatorID != null && String(EvaluatorID).trim() !== ""
      ? String(EvaluatorID).trim()
      : readStoredTeacherId();

  const [questions, setQuestions] = useState([]);
  const [bootLoading, setBootLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [profile, setProfile] = useState(null);
  const [count, setCount] = useState(1);
  const [selectedRatings, setSelectedRatings] = useState({});
  const [suggestion, setSuggestion] = useState("");
  const [loadError, setLoadError] = useState("");
  const [questionsSource, setQuestionsSource] = useState("api");

  const loadQuestions = useCallback(async () => {
    if (!TargetID) return;

    setBootLoading(true);
    setLoadError("");

    let targetType = "C";
    const cleanDesignation = (Designation ?? "").toString().trim().toLowerCase();
    const qtypeLower = (Qtype ?? "").toString().toLowerCase();
    const isPeer = qtypeLower.includes("peer");

    if (isPeer) {
      if (cleanDesignation.includes("junior") || cleanDesignation.includes("jr")) {
        targetType = "PTJ";
      } else {
        targetType = "PTS";
      }
    }

    try {
      if (formattedID) {
        const profileResp = await fetch(
          api(`Teacher/GetTeacherProfile?TeacherID=${encodeURIComponent(formattedID)}`)
        );
        if (profileResp.ok) {
          const profileData = await profileResp.json();
          const normalized = unwrapProfilePayload(profileData) ?? profileData;
          setProfile(normalized && typeof normalized === "object" ? normalized : null);
        } else {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }

      let list = [];
      let source = "api";

      const qResp = await fetch(api("Student/GetQuestions"));
      if (qResp.ok) {
        const qData = await qResp.json();
        if (Array.isArray(qData) && qData.length > 0) {
          const filtered = qData.filter((q) => q.RawType === targetType);
          if (filtered.length > 0) {
            list = filtered;
          } else if (isPeer) {
            list = getFallbackPeerQuestions(targetType);
            source = "fallback";
          } else {
            list = qData;
          }
        } else if (isPeer) {
          list = getFallbackPeerQuestions(targetType);
          source = "fallback";
        }
      }

      if (list.length === 0 && isPeer) {
        list = getFallbackPeerQuestions(targetType);
        source = "fallback";
      }

      if (list.length === 0) {
        if (!qResp.ok) {
          setLoadError("Could not load questions.");
        } else {
          setLoadError("No questions for this evaluation.");
        }
        setQuestions([]);
        setQuestionsSource("api");
      } else {
        setQuestions(list);
        setQuestionsSource(source);
        setLoadError("");
      }
      setCount(1);
      setSelectedRatings({});
    } catch (e) {
      console.error("Fetch Error:", e);
      if (isPeer) {
        const list = getFallbackPeerQuestions(targetType);
        setQuestions(list);
        setQuestionsSource("fallback");
        setLoadError("");
      } else {
        setLoadError("Check server connection.");
        setQuestions([]);
        setQuestionsSource("api");
      }
      setCount(1);
      setSelectedRatings({});
    } finally {
      setBootLoading(false);
    }
  }, [TargetID, formattedID, Qtype, Designation]);

  useEffect(() => {
    if (!TargetID) {
      setBootLoading(false);
      alert("No teacher selected for evaluation.");
      navigate("/EvaluateTeachers", { replace: true });
      return;
    }
    loadQuestions();
  }, [TargetID, loadQuestions, navigate]);

  const handleSelectRating = (backendValue) => {
    const currentQId = questions[count - 1]?.Question_Id;
    if (!currentQId) return;
    setSelectedRatings((prev) => ({
      ...prev,
      [currentQId]: backendValue,
    }));
  };

  const handleNext = () => {
    const currentQId = questions[count - 1]?.Question_Id;
    if (!selectedRatings[currentQId]) {
      alert("Please select an option.");
      return;
    }
    if (count < questions.length) setCount((c) => c + 1);
  };

  const handleBack = () => {
    if (count > 1) setCount((c) => c - 1);
  };

  const handleSubmit = async () => {
    if (!formattedID) {
      alert("Evaluator session missing. Please login again.");
      return;
    }
    if (!TargetID) {
      alert("Target teacher missing. Please select teacher again.");
      return;
    }
    const currentQId = questions[count - 1]?.Question_Id;
    if (currentQId && selectedRatings[currentQId] == null) {
      alert("Please select an option for this question.");
      return;
    }
    if (Object.keys(selectedRatings).length < questions.length) {
      alert("Please answer all questions before submitting.");
      return;
    }

    const payload = {
      Evaluator_Emp_no: formattedID,
      Target_Emp_no: String(TargetID),
      Suggestion: suggestion,
      Answers: Object.entries(selectedRatings).map(([id, rating]) => ({
        Question_ID: parseInt(id, 10),
        Rating: rating,
      })),
    };

    try {
      setSubmitting(true);
      const response = await fetch(api("Evaluation/SubmitPeer"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert("Evaluation submitted successfully!");
        navigate(-1);
      } else {
        let msg = "Failed to save data.";
        try {
          const result = await response.json();
          msg = result.message || msg;
        } catch {
          /* ignore */
        }
        alert(msg);
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const totalQ = questions.length;
  const currentQuestion = questions[count - 1];
  const currentQId = currentQuestion?.Question_Id;
  const selectedValue = currentQId != null ? selectedRatings[currentQId] : undefined;
  const progressPct = totalQ > 0 ? Math.min(100, (count / totalQ) * 100) : 0;
  const evaluatorDisplay = extractTeacherDisplay(profile, readUserFromStorage());

  if (!TargetID) {
    return null;
  }

  if (bootLoading && totalQ === 0) {
    return (
      <div className="teq-page">
        <div className="teq-loader-wrap">
          <div className="teq-spinner" />
          <p className="teq-loader-text">Loading evaluation…</p>
        </div>
      </div>
    );
  }

  if (totalQ === 0) {
    return (
      <div className="teq-page">
        <div className="teq-inner">
          <p className="teq-empty-msg">{loadError || "No questions for this evaluation."}</p>
          <button type="button" className="teq-btn-white" onClick={() => navigate("/EvaluateTeachers")}>
            Back to list
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="teq-page">
      <div className="teq-inner">
        <img src={logo} alt="BIIT" className="teq-logo" />

        <p className="teq-q-count">
          Question {count} / {totalQ}
        </p>

        <div className="teq-progress-track" aria-hidden>
          <div className="teq-progress-fill" style={{ width: `${progressPct}%` }} />
        </div>

        {/* Evaluator — RN “Teacher Information” style */}
        <div className="teq-card">
          <h2 className="teq-card-title">Teacher information</h2>
          <div className="teq-card-row">
            <div>
              <p className="teq-line">
                Name: <strong>{evaluatorDisplay.name}</strong>
              </p>
              <p className="teq-line">Designation: {evaluatorDisplay.designation}</p>
            </div>
            <img src={avatar} alt="" className="teq-avatar" />
          </div>
        </div>

        {/* Target teacher */}
        <div className="teq-card">
          <div className="teq-card-row teq-target-row">
            <div>
              <p className="teq-target-label">Evaluating</p>
              <p className="teq-line teq-target-name">
                <strong>{TargetName || "—"}</strong>
              </p>
              <p className="teq-line">{Designation || "—"}</p>
              {TargetID ? <p className="teq-id">ID: {TargetID}</p> : null}
            </div>
            <img src={avatar} alt="" className="teq-avatar teq-avatar-sm" />
          </div>
        </div>

        {/* Question + radio options — legend above question text */}
        <div className="teq-card teq-question-card">
          <div className="teq-rating-legend">
            <p className="teq-legend-title">Rating scale</p>
            {RATING_SCALE.map(({ displayNum, label }) => (
              <div key={displayNum} className="teq-legend-row">
                <span className="teq-legend-num">{displayNum}</span>
                <span className="teq-legend-label">{label}</span>
              </div>
            ))}
          </div>

          {questionsSource === "fallback" ? (
            <p className="teq-source-note">Using built-in questionnaire (server had no matching questions).</p>
          ) : null}

          <p className="teq-question-text">
            <span className="teq-q-num">{count}.</span>
            {currentQuestion?.Question1}
          </p>

          <div className="teq-radio-list teq-radio-numbers" role="radiogroup" aria-label="Rating 1 to 5">
            {RATING_SCALE.map(({ displayNum, label, value }) => {
              const isOn = selectedValue === value;
              return (
                <button
                  key={value}
                  type="button"
                  className={`teq-radio-row teq-radio-num-only ${isOn ? "selected" : ""}`}
                  onClick={() => handleSelectRating(value)}
                  title={`${displayNum} — ${label}`}
                  aria-label={`${displayNum}, ${label}`}
                >
                  <span className="teq-radio-outer" aria-hidden>
                    {isOn ? <span className="teq-radio-inner" /> : null}
                  </span>
                  <span className="teq-radio-num">{displayNum}</span>
                </button>
              );
            })}
          </div>

          {count === totalQ && (
            <div className="teq-suggestion-block">
              <label htmlFor="teq-suggestion" className="teq-suggestion-label">
                Suggestions / comments
              </label>
              <textarea
                id="teq-suggestion"
                className="teq-suggestion-input"
                placeholder="Optional feedback…"
                value={suggestion}
                onChange={(e) => setSuggestion(e.target.value)}
                rows={3}
              />
            </div>
          )}

          <div className="teq-nav-row">
            {count > 1 ? (
              <button type="button" className="teq-btn-white" onClick={handleBack} disabled={submitting}>
                Back
              </button>
            ) : (
              <span className="teq-nav-spacer" />
            )}

            {count < totalQ ? (
              <button type="button" className="teq-btn-white" onClick={handleNext} disabled={submitting}>
                Next
              </button>
            ) : (
              <button
                type="button"
                className="teq-btn-primary"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? "Submitting…" : "Submit"}
              </button>
            )}
          </div>
        </div>

        <button
          type="button"
          className="teq-btn-outline"
          onClick={() => navigate(-1)}
          disabled={submitting}
        >
          Leave evaluation
        </button>
      </div>
    </div>
  );
};

export default TeacherEvaluationQuestions;
