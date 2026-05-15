import React, { useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./ManageStudent.css";
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

const SAMPLE_ROWS = [
  { id: "1", arid: "2022-Arid-123", name: "Sample Student A" },
  { id: "2", arid: "2022-Arid-124", name: "Sample Student B" },
  { id: "3", arid: "2022-Arid-125", name: "Sample Student C" },
];

/**
 * Web port of RN ManagerStudent: profile card, name search, upload, student rows with edit/delete.
 * Responsive: stacked search on narrow screens; table header + row layout from ~520px.
 */
const ManageStudent = () => {
  const navigate = useNavigate();
  const user = useMemo(() => readStoredUser(), []);
  const fileRef = useRef(null);

  const managerName =
    user?.name ||
    user?.Name ||
    user?.username ||
    user?.userid ||
    user?.UserId ||
    "Mr Nazir Shah";
  const designation =
    user?.designation || user?.Designation || "Database Administrator";

  const [nameQuery, setNameQuery] = useState("");
  const [students, setStudents] = useState(SAMPLE_ROWS);

  const filtered = useMemo(() => {
    const q = nameQuery.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        String(s.arid).toLowerCase().includes(q) || String(s.name || "").toLowerCase().includes(q)
    );
  }, [students, nameQuery]);

  const handleSearch = () => {
    /* filter is reactive; button matches RN affordance */
  };

  const handleUploadClick = () => {
    fileRef.current?.click();
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    window.alert(`Selected file: ${file.name}\nWire this to your API (bulk import) when ready.`);
  };

  const handleEdit = (row) => {
    const q = new URLSearchParams({ arid: row.arid, name: row.name || "" });
    navigate(`/ManagerUpdateStudent?${q.toString()}`);
  };

  const handleDelete = (row) => {
    if (!window.confirm(`Delete student ${row.arid}?`)) return;
    setStudents((prev) => prev.filter((s) => s.id !== row.id));
  };

  return (
    <div className="ms-page">
      <div className="ms-scroll">
        <img src={logo} alt="BIIT" className="ms-logo" />

        <section className="ms-card" aria-label="Manager information">
          <h2 className="ms-card-title">Manager information</h2>
          <div className="ms-profile-row">
            <div>
              <p className="ms-txt">
                Name: <strong>{managerName}</strong>
              </p>
              <p className="ms-txt">
                Designation: <strong>{designation}</strong>
              </p>
            </div>
            <img src={avatar} alt="" className="ms-avatar" />
          </div>
        </section>

        <section className="ms-mcard" aria-label="Manage students">
          <h2 className="ms-mtitle">Manage student</h2>

          <div className="ms-search-row">
            <input
              type="search"
              className="ms-input"
              placeholder="Name or ARID"
              value={nameQuery}
              onChange={(e) => setNameQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <button type="button" className="ms-search-btn" onClick={handleSearch}>
              🔍 Search
            </button>
          </div>

          <input ref={fileRef} type="file" className="ms-file-hidden" accept=".csv,.xlsx,.xls" onChange={handleFile} />
          <button type="button" className="ms-upload-btn" onClick={handleUploadClick}>
            ⬆ Upload student
          </button>

          <div className="ms-thead" role="row">
            <span className="ms-th">Arid no</span>
            <span className="ms-th">Edit / Delete</span>
          </div>

          <div className="ms-list">
            {filtered.length === 0 ? (
              <p className="ms-empty">No students match your search.</p>
            ) : (
              filtered.map((row) => (
                <div key={row.id} className="ms-trow">
                  <span className="ms-td">{row.arid}</span>
                  <div className="ms-arow">
                    <button type="button" className="ms-edit-btn" onClick={() => handleEdit(row)}>
                      ✏ Edit
                    </button>
                    <button type="button" className="ms-delete-btn" onClick={() => handleDelete(row)}>
                      ❌ Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <button type="button" className="ms-back-btn" onClick={() => navigate("/ManagerDashboard")}>
          ⬅ Back
        </button>
      </div>
    </div>
  );
};

export default ManageStudent;
