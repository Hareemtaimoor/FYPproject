import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./EvaluationRate.css";
import logo from "../Images/Biit_Logo.png";
import avatarImg from "../Images/avatar.png";
import maleAvatar from "../Images/maleAvatar.png";
import APIEndPoint from "../unity.js";
import { getStoredTeacherId } from "./teacherProfileDisplay.js";

const api = (path) => `${APIEndPoint}${path.replace(/^\//, "")}`;

/** Same list as React Native — special profile image for these IDs. */
const AVATAR_IDS = [
  "BIIT167", "BIIT189", "BIIT212", "BIIT213", "BIIT346", "BIIT359",
  "BIIT365", "BIIT368", "BIIT222", "BIIT202", "BIIT386", "BIIT422",
  "BIIT394", "BIIT397", "BIIT395", "BIIT393", "BIIT400", "BIIT402",
  "BIIT403", "BIIT404", "BIIT407", "BIIT409", "BIIT411", "BIIT412",
  "BIIT416", "BIIT417", "BIIT418", "BIIT421", "BIIT424", "BIIT425",
  "BIIT427", "BIIT429",
];

const sessionApiParam = (session) =>
  String(session || "").startsWith("SOS") ? String(session).replace(/^SOS/i, "") : String(session || "");

/** Demo peer % when API has no row or returns 0 — replace with live data once `GetPeerAverageRatings` is populated. */
const DEMO_PEER_PERCENT = 84;

const EvaluationRate = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const TeacherID =
    (location.state?.TeacherID && String(location.state.TeacherID).trim()) || getStoredTeacherId();

  const [teacherData, setTeacherData] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState("");
  const [studentScore, setStudentScore] = useState(0);
  const [peerScore, setPeerScore] = useState(0);
  const [peerIsDemo, setPeerIsDemo] = useState(false);
  const [loading, setLoading] = useState(true);

  const profileImage = AVATAR_IDS.includes(String(TeacherID).toUpperCase()) ? avatarImg : maleAvatar;

  const fetchScores = useCallback(
    async (session) => {
      if (!TeacherID || !session) return;
      const apiSessionParam = sessionApiParam(session);

      try {
        const stdRes = await fetch(api(`Director/GetTeacherAverageRatings?session=${encodeURIComponent(apiSessionParam)}`));
        const stdList = stdRes.ok ? await stdRes.json().catch(() => []) : [];
        const listStd = Array.isArray(stdList) ? stdList : [];

        const stdMatch = listStd.find((t) =>
          String(t.TeacherID ?? t.teacherID ?? "")
            .toLowerCase()
            .includes(String(TeacherID).toLowerCase())
        );

        if (stdMatch) {
          const ratingNum = parseFloat(stdMatch.AverageRating ?? stdMatch.averageRating);
          setStudentScore(Number.isFinite(ratingNum) ? Math.round((ratingNum / 5) * 100) : 0);
        } else {
          setStudentScore(0);
        }

        const peerRes = await fetch(api(`Director/GetPeerAverageRatings?session=${encodeURIComponent(apiSessionParam)}`));
        const peerList = peerRes.ok ? await peerRes.json().catch(() => []) : [];
        const listPeer = Array.isArray(peerList) ? peerList : [];

        const peerMatch = listPeer.find((t) =>
          String(t.TeacherID ?? t.teacherID ?? "")
            .toLowerCase()
            .includes(String(TeacherID).toLowerCase())
        );

        if (peerMatch) {
          const peerRatingNum = parseFloat(peerMatch.AverageRating ?? peerMatch.averageRating);
          const pct = Number.isFinite(peerRatingNum) ? Math.round((peerRatingNum / 5) * 100) : 0;
          if (pct > 0) {
            setPeerScore(pct);
            setPeerIsDemo(false);
          } else {
            setPeerScore(DEMO_PEER_PERCENT);
            setPeerIsDemo(true);
          }
        } else {
          setPeerScore(DEMO_PEER_PERCENT);
          setPeerIsDemo(true);
        }
      } catch (e) {
        console.error("Score fetch error:", e);
        setStudentScore(0);
        setPeerScore(DEMO_PEER_PERCENT);
        setPeerIsDemo(true);
      }
    },
    [TeacherID]
  );

  useEffect(() => {
    if (!TeacherID) {
      setLoading(false);
      navigate("/", { replace: true });
      return;
    }

    let cancelled = false;

    const fetchInitialData = async () => {
      try {
        const profRes = await fetch(api(`Teacher/GetTeacherProfile?TeacherID=${encodeURIComponent(TeacherID)}`));
        const profJson = profRes.ok ? await profRes.json().catch(() => null) : null;
        if (!cancelled) setTeacherData(profJson);

        const sessionRes = await fetch(api("Director/GetAllSessions"));
        const sessionJson = sessionRes.ok ? await sessionRes.json().catch(() => []) : [];
        const list = Array.isArray(sessionJson) ? sessionJson : [];

        if (!cancelled) {
          setSessions(list);
          if (list.length > 0) {
            const first = list[0];
            setSelectedSession(first);
            fetchScores(first);
          } else {
            setSelectedSession("");
            setStudentScore(0);
            setPeerScore(DEMO_PEER_PERCENT);
            setPeerIsDemo(true);
          }
        }
      } catch (e) {
        console.error("Initial load error:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchInitialData();
    return () => {
      cancelled = true;
    };
  }, [TeacherID, navigate, fetchScores]);

  const onSessionChange = (e) => {
    const val = e.target.value;
    setSelectedSession(val);
    if (val) fetchScores(val);
  };

  if (loading && !teacherData) {
    return (
      <div className="er-loader-container">
        <div className="er-spinner" aria-busy="true" />
      </div>
    );
  }

  return (
    <div className="er-page">
      <div className="er-inner">
        <div className="er-logo-container">
          <img src={logo} alt="BIIT" className="er-logo" />
        </div>

        <div className="er-profile-card">
          <div className="er-profile-info">
            <p className="er-p-text">
              Name: <strong>{teacherData?.Name || teacherData?.name || "N/A"}</strong>
            </p>
            <p className="er-p-text">
              Designation:{" "}
              <strong>{teacherData?.Designation || teacherData?.designation || "Faculty"}</strong>
            </p>
            <p className="er-p-sub">BIIT Academic Staff</p>
          </div>
          <img src={profileImage} alt="" className="er-avatar" />
        </div>

        <div className="er-dropdown-card">
          <label htmlFor="er-session-select" className="er-dropdown-label">
            Select session:
          </label>
          <div className="er-picker-wrapper">
            <select
              id="er-session-select"
              className="er-picker"
              value={selectedSession}
              onChange={onSessionChange}
              disabled={sessions.length === 0}
            >
              {sessions.length === 0 ? (
                <option value="">No sessions</option>
              ) : (
                sessions.map((s, index) => (
                  <option key={`${s}-${index}`} value={s}>
                    {s}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        <h2 className="er-section-title">Evaluation summary</h2>

        <div className="er-analytics-card">
          <div className="er-stats-row" role="group" aria-label="Scores as percentage of maximum">
            <div className="er-circle-wrapper">
              <div
                className="er-donut er-donut--student"
                style={{ "--er-fill": Math.min(100, Math.max(0, studentScore)) }}
                role="img"
                aria-label={`Student feedback ${studentScore} percent`}
              >
                <div className="er-donut-inner">
                  <span className="er-percent-text">{studentScore}%</span>
                </div>
              </div>
              <span className="er-circle-label">Student feedback</span>
            </div>
            <div className="er-circle-wrapper">
              <div
                className="er-donut er-donut--peer"
                style={{ "--er-fill": Math.min(100, Math.max(0, peerScore)) }}
                role="img"
                aria-label={`Peer evaluation ${peerScore} percent${peerIsDemo ? " sample data" : ""}`}
              >
                <div className="er-donut-inner">
                  <span className="er-percent-text">{peerScore}%</span>
                </div>
              </div>
              <span className="er-circle-label">Peer evaluation</span>
            </div>
          </div>

          {peerIsDemo && (
            <p className="er-demo-note" role="status">
              Peer score shows sample data ({DEMO_PEER_PERCENT}%) until peer evaluations exist for this session.
            </p>
          )}

          <div className="er-chart-wrap" aria-label="Comparison chart">
            <h3 className="er-chart-title">Comparison</h3>
            <div className="er-bar-chart">
              <div className="er-bar-row">
                <span className="er-bar-label">Student</span>
                <div className="er-bar-track">
                  <div
                    className="er-bar-fill er-bar-fill--student"
                    style={{ width: `${Math.min(100, Math.max(0, studentScore))}%` }}
                  />
                </div>
                <span className="er-bar-value">{studentScore}%</span>
              </div>
              <div className="er-bar-row">
                <span className="er-bar-label">Peer</span>
                <div className="er-bar-track">
                  <div
                    className="er-bar-fill er-bar-fill--peer"
                    style={{ width: `${Math.min(100, Math.max(0, peerScore))}%` }}
                  />
                </div>
                <span className="er-bar-value">{peerScore}%</span>
              </div>
            </div>
            <div className="er-chart-axis" aria-hidden="true">
              <span className="er-chart-axis-spacer" />
              <div className="er-chart-axis-ticks">
                <span>0</span>
                <span>25</span>
                <span>50</span>
                <span>75</span>
                <span>100</span>
              </div>
              <span className="er-chart-axis-spacer" />
            </div>
          </div>
        </div>

        <button type="button" className="er-back-btn" onClick={() => navigate(-1)}>
          Back to dashboard
        </button>
      </div>
    </div>
  );
};

export default EvaluationRate;
