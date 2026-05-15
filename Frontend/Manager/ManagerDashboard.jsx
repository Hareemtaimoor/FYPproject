import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./ManagerDashboard.css";
import logo from "../Images/Biit_Logo.png";
import avatar from "../Images/maleAvatar.png";

function readStoredUser() {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Manager home (React web port of a typical RN manager hub: profile header + action tiles).
 * Responsive: single column on phones, 2 columns on small tablets, 3 on desktop.
 */
const ManagerDashboard = () => {
  const navigate = useNavigate();
  const user = useMemo(() => readStoredUser(), []);

  const displayName =
    user?.name ||
    user?.Name ||
    user?.username ||
    user?.userid ||
    user?.UserId ||
    "Manager";
  const userId = user?.userid || user?.UserId || user?.username || "";

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("user");
      navigate("/", { replace: true });
    }
  };

  const tiles = [
    {
      key: "rc",
      label: "Analytics & feedback",
      title: "RC evaluation",
      desc: "Review sessions, courses, and teacher comparison charts.",
      path: "/RCEvaluation",
      cta: "Open",
    },
    {
      key: "gender",
      label: "Participation",
      title: "Gender analytics",
      desc: "View evaluation participation ratios by gender.",
      path: "/GenderAnalytics",
      cta: "View",
    },
    {
      key: "questions",
      label: "Evaluation setup",
      title: "Lab evaluation questions",
      desc: "Maintain question bank used in evaluations.",
      path: "/ManageQuestions",
      cta: "Manage",
    },
    {
      key: "decrypt",
      label: "Confidential",
      title: "Decryptor tools",
      desc: "Open confidential decryptor workflows (if permitted).",
      path: "/ConfidentialDecryptor",
      cta: "Open",
    },
    {
      key: "students",
      label: "Student records",
      title: "Manage students",
      desc: "Search, upload, and maintain student ARID listings.",
      path: "/ManagerManageStudent",
      cta: "Open",
    },
  ];

  return (
    <div className="md-page">
      <div className="md-inner">
        <header className="md-top">
          <div className="md-logo-wrap">
            <img src={logo} alt="BIIT" className="md-logo" />
          </div>

          <div className="md-profile-card">
            <div className="md-profile-text">
              <p>
                Name: <strong>{displayName}</strong>
              </p>
              {userId ? (
                <p>
                  ID: <strong>{userId}</strong>
                </p>
              ) : null}
              <p>
                Role: <strong>Manager</strong>
              </p>
              <span className="md-role-pill">BIIT administration</span>
            </div>
            <img src={avatar} alt="" className="md-avatar" />
          </div>
        </header>

        <h1 className="md-title">Manager dashboard</h1>
        <p className="md-subtitle">Quick access to analytics and evaluation tools</p>

        <section className="md-grid" aria-label="Manager actions">
          {tiles.map((t) => (
            <button
              key={t.key}
              type="button"
              className="md-card"
              onClick={() => navigate(t.path)}
            >
              <span className="md-card-label">{t.label}</span>
              <span className="md-card-title">{t.title}</span>
              <span className="md-card-desc">{t.desc}</span>
              <span className="md-card-cta" aria-hidden>
                {t.cta} →
              </span>
            </button>
          ))}
        </section>

        <footer className="md-footer">
          <button type="button" className="md-btn-secondary" onClick={() => navigate(-1)}>
            ← Back
          </button>
          <button type="button" className="md-btn-logout" onClick={handleLogout}>
            Logout
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ManagerDashboard;
