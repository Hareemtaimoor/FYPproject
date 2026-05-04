import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./CHR.css";
import logo from "../Images/Biit_Logo.png";
import avatar from "../Images/avatar.png";
import APIEndPoint from "../unity.js";
import { extractTeacherDisplay, getStoredTeacherId, readUserFromStorage } from "./teacherProfileDisplay.js";

const api = (path) => `${APIEndPoint}${path.replace(/^\//, "")}`;

/** Normalize to `YYYY-MM-DD` for API query and `<input type="date" />`. */
const normDate = (s) => {
  const t = String(s ?? "").trim();
  if (!t) return "";

  if (/^\d{4}-\d{2}-\d{2}/.test(t)) return t.slice(0, 10);

  const net = t.match(/\/Date\((\d+)\)\//);
  if (net) {
    const d = new Date(parseInt(net[1], 10));
    return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
  }

  const slash = t.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (slash) {
    let a = parseInt(slash[1], 10);
    let b = parseInt(slash[2], 10);
    const y = slash[3];
    let day = a;
    let month = b;
    if (b > 12 && a <= 12) {
      month = a;
      day = b;
    } else if (a > 12 && b <= 12) {
      day = a;
      month = b;
    }
    if (month < 1 || month > 12 || day < 1 || day > 31) return t.slice(0, 10);
    return `${y}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  const parsed = new Date(t);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);

  return t.slice(0, 10);
};

const itemToDateString = (item) => {
  if (item == null) return "";
  if (typeof item === "string" || typeof item === "number") return normDate(String(item));
  if (typeof item === "object" && !Array.isArray(item)) {
    const raw =
      item.Date ??
      item.date ??
      item.Value ??
      item.value ??
      item.ReportDate ??
      item.reportDate ??
      item.CHRDate ??
      item.chrDate ??
      item.SessionDate ??
      item.sessionDate ??
      "";
    return normDate(raw);
  }
  return "";
};

const parseDateList = (payload) => {
  if (Array.isArray(payload)) return [...new Set(payload.map(itemToDateString).filter(Boolean))].sort();
  if (payload && typeof payload === "object") {
    const inner = payload.Dates ?? payload.dates ?? payload.DateList ?? payload.dateList ?? payload.data;
    if (Array.isArray(inner)) return [...new Set(inner.map(itemToDateString).filter(Boolean))].sort();
  }
  return [];
};

const pickProfile = (data) =>
  data?.Profile ?? data?.profile ?? data?.TeacherProfile ?? data?.teacherProfile ?? null;

const pickReports = (data) => {
  const r =
    data?.Reports ??
    data?.reports ??
    data?.ReportList ??
    data?.reportList ??
    data?.Rows ??
    data?.rows ??
    data?.Classes ??
    data?.classes ??
    data?.HeldClasses ??
    data?.heldClasses;
  return Array.isArray(r) ? r : [];
};

const normalizeRow = (item, index) => ({
  SrNo: item.SrNo ?? item.srNo ?? index + 1,
  Course: item.Course ?? item.course ?? item.Subject ?? item.subject ?? "-",
  Discipline_Section:
    item.Discipline_Section ?? item.discipline_Section ?? item.Section ?? item.section ?? item.Sec ?? "-",
  Venue: item.Venue ?? item.venue ?? item.Room ?? item.room ?? "-",
  Status: item.Status ?? item.status ?? "Held",
});

const CHR = () => {
  const navigate = useNavigate();
  /** From `GetTeacherProfile` — always try so the info card works even if CHR report omits profile. */
  const [localProfile, setLocalProfile] = useState(null);
  /** Optional fields from `GetTeacherCHR` response (merged over localProfile). */
  const [chrProfile, setChrProfile] = useState(null);
  const [chrData, setChrData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [datesReady, setDatesReady] = useState(false);

  const [dateList, setDateList] = useState([]);
  const [selectedDate, setSelectedDate] = useState(() => normDate(new Date().toISOString()));

  const [showModal, setShowModal] = useState(false);
  const [comment, setComment] = useState("");

  const TeacherID = getStoredTeacherId();
  const chrRequestId = useRef(0);

  const selectOptions = useMemo(() => {
    const cur = normDate(selectedDate);
    return [...new Set([...dateList, cur].filter(Boolean))].sort();
  }, [dateList, selectedDate]);

  const teacherDisplay = extractTeacherDisplay(
    {
      ...(localProfile && typeof localProfile === "object" ? localProfile : {}),
      ...(chrProfile && typeof chrProfile === "object" ? chrProfile : {}),
    },
    readUserFromStorage()
  );

  const getDayName = (dateStr) => {
    const d = new Date(normDate(dateStr) + "T12:00:00");
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", { weekday: "long" });
  };

  const fetchDateHistory = useCallback(async () => {
    if (!TeacherID) return;
    try {
      const res = await axios.get(api(`Teacher/GetAvailableCHRDates?tId=${encodeURIComponent(TeacherID)}`));
      const dates = parseDateList(res.data);
      setDateList(dates);
      if (dates.length > 0) {
        setSelectedDate((prev) => {
          const cur = normDate(prev);
          return dates.includes(cur) ? prev : dates[0];
        });
      }
    } catch (error) {
      console.error("CHR dates error:", error.response?.data ?? error.message);
      setDateList([]);
    } finally {
      setDatesReady(true);
    }
  }, [TeacherID]);

  const fetchCHRReport = useCallback(
    async (date) => {
      if (!TeacherID) return;
      const d = normDate(date);
      if (!d) return;

      const reqId = ++chrRequestId.current;
      setLoading(true);
      setLoadError("");

      try {
        const res = await axios.get(
          api(`Teacher/GetTeacherCHR?tId=${encodeURIComponent(TeacherID)}&date=${encodeURIComponent(d)}`)
        );
        if (reqId !== chrRequestId.current) return;

        const body = res.data;
        const fromChr = pickProfile(body);
        setChrProfile(fromChr && typeof fromChr === "object" ? fromChr : null);
        const rows = pickReports(body).map(normalizeRow);
        setChrData(rows);
        setLoadError("");
      } catch (error) {
        if (reqId !== chrRequestId.current) return;
        console.error("CHR report error:", error.response?.data ?? error.message);
        setChrData([]);
        setLoadError("Could not load this report. Try another date or check your connection.");
      } finally {
        if (reqId === chrRequestId.current) setLoading(false);
      }
    },
    [TeacherID]
  );

  useEffect(() => {
    if (!TeacherID) {
      navigate("/");
      return;
    }
    setDatesReady(false);
    fetchDateHistory();
  }, [TeacherID, navigate, fetchDateHistory]);

  useEffect(() => {
    if (!TeacherID) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await axios.get(api(`Teacher/GetTeacherProfile?TeacherID=${encodeURIComponent(TeacherID)}`));
        if (!cancelled) setLocalProfile(res.data);
      } catch (error) {
        console.error("CHR profile error:", error.response?.data ?? error.message);
        if (!cancelled) setLocalProfile(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [TeacherID]);

  useEffect(() => {
    if (!TeacherID || !datesReady) return;
    fetchCHRReport(selectedDate);
  }, [TeacherID, selectedDate, datesReady, fetchCHRReport]);

  return (
    <div className="chr-mobile-bg">
      <div className="chr-container">
        <div className="chr-logo-header">
          <img src={logo} alt="BIIT Logo" className="chr-main-logo" />
        </div>

        <div className="chr-date-selector">
          <label className="dropdown-label" htmlFor="chr-history-date">
            Report date
          </label>
          {dateList.length > 0 ? (
            <select
              id="chr-history-date"
              className="history-dropdown"
              value={normDate(selectedDate)}
              onChange={(e) => setSelectedDate(normDate(e.target.value))}
            >
              {selectOptions.map((d, i) => (
                <option key={`${d}-${i}`} value={normDate(d)}>
                  {normDate(d)} ({getDayName(d) || "—"})
                </option>
              ))}
            </select>
          ) : null}

          <label className="dropdown-label chr-date-native-label" htmlFor="chr-date-native">
            {dateList.length > 0 ? "Or pick any date" : "Pick a date"}
          </label>
          <input
            id="chr-date-native"
            type="date"
            className="chr-date-native"
            value={normDate(selectedDate) || ""}
            max="2099-12-31"
            onChange={(e) => {
              const v = e.target.value;
              if (v) setSelectedDate(normDate(v));
            }}
          />
          <p className="chr-date-hint">Changing the date reloads the class held report for that day.</p>
        </div>

        <div className="chr-info-card">
          <h3 className="chr-card-label">Teacher information</h3>
          <div className="chr-info-content">
            <div className="chr-text-details">
              <p>
                Name: <strong>{teacherDisplay.name}</strong>
              </p>
              <p>Designation: {teacherDisplay.designation}</p>
            </div>
            <img src={avatar} alt="" className="chr-avatar-img" />
          </div>
        </div>

        <div className="chr-report-card-white">
          <div className="chr-table-header-dark">
            Class held report
            <div className="chr-date-sub-gold">{getDayName(selectedDate) || normDate(selectedDate)}</div>
          </div>

          <div className="chr-table-wrapper-white">
            {loading ? (
              <div className="mini-loader">Loading report…</div>
            ) : loadError ? (
              <div className="chr-error-banner" role="alert">
                {loadError}
              </div>
            ) : (
              <div className="chr-table-scroll">
                <table className="chr-main-table-white">
                  <thead>
                    <tr>
                      <th>Sr.</th>
                      <th>Subject</th>
                      <th>Sec</th>
                      <th>Venue</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chrData.length > 0 ? (
                      chrData.map((item, index) => (
                        <tr key={`${item.Course}-${item.Discipline_Section}-${index}`}>
                          <td>{item.SrNo}</td>
                          <td>{item.Course}</td>
                          <td>{item.Discipline_Section}</td>
                          <td>{item.Venue}</td>
                          <td
                            className={
                              String(item.Status).toLowerCase() === "late" ? "status-red" : "status-green"
                            }
                          >
                            {item.Status}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="no-data">
                          No class records for this date.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="chr-footer">
          <button type="button" className="chr-add-comment" onClick={() => setShowModal(true)}>
            + Add comments
          </button>
          <button type="button" className="chr-home-btn" onClick={() => navigate(-1)}>
            Home
          </button>
        </div>

        {showModal ? (
          <div
            className="modal-overlay"
            role="presentation"
            onClick={() => setShowModal(false)}
            onKeyDown={(e) => e.key === "Escape" && setShowModal(false)}
          >
            <div
              className="modal-content"
              role="dialog"
              aria-modal="true"
              aria-labelledby="chr-modal-title"
              onClick={(e) => e.stopPropagation()}
            >
              <h4 id="chr-modal-title">Class remark</h4>
              <textarea
                placeholder="Enter comments…"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <div className="modal-btns">
                <button type="button" onClick={() => setShowModal(false)}>
                  Close
                </button>
                <button type="button" className="save-btn" onClick={() => setShowModal(false)}>
                  Save
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default CHR;
