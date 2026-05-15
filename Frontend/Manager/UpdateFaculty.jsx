import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./UpdateFaculty.css";
import logo from "../Images/Biit_Logo.png";
import defaultAvatar from "../Images/maleAvatar.png";

function readStoredUser() {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const CLASS_OPTIONS = ["1A", "1B", "1C"];
const PROGRAM_OPTIONS = ["BSSE", "BSCS", "BSAI"];
const COURSE_OPTIONS = ["Database Systems", "Software Engineering", "Web Development"];

/**
 * Web port of RN UpdateFaculty (form titled "Update student").
 * RN used one `showDropdown` for all menus (bug); here each menu is independent.
 * Image: file input + preview URL instead of react-native-image-picker.
 */
const UpdateFaculty = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = useMemo(() => readStoredUser(), []);

  const managerName =
    user?.name ||
    user?.Name ||
    user?.username ||
    user?.userid ||
    user?.UserId ||
    "Mr Nazir Shah";
  const designation =
    user?.designation || user?.Designation || "Database Administrator";

  const [gender, setGender] = useState("Male");
  const [course, setCourse] = useState("");
  const [program, setProgram] = useState("");
  const [classSection, setClassSection] = useState("");
  const [openMenu, setOpenMenu] = useState(null);
  const [aridNo, setAridNo] = useState("");
  const [studentName, setStudentName] = useState("");
  const [password, setPassword] = useState("");
  const [studentPhotoUrl, setStudentPhotoUrl] = useState(null);
  const fileRef = useRef(null);
  const classRef = useRef(null);
  const programRef = useRef(null);
  const courseRef = useRef(null);

  useEffect(() => {
    const arid = searchParams.get("arid");
    const name = searchParams.get("name");
    if (arid) setAridNo(arid);
    if (name) setStudentName(name);
  }, [searchParams]);

  useEffect(() => {
    if (!openMenu) return;
    const refMap = { class: classRef, program: programRef, course: courseRef };
    const handler = (e) => {
      const r = refMap[openMenu];
      if (r?.current && !r.current.contains(e.target)) setOpenMenu(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openMenu]);

  useEffect(() => {
    return () => {
      if (studentPhotoUrl?.startsWith("blob:")) URL.revokeObjectURL(studentPhotoUrl);
    };
  }, [studentPhotoUrl]);

  const pickImage = () => fileRef.current?.click();

  const onImageFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) return;
    if (studentPhotoUrl?.startsWith("blob:")) URL.revokeObjectURL(studentPhotoUrl);
    setStudentPhotoUrl(URL.createObjectURL(file));
  };

  const displayStudentImg = studentPhotoUrl || defaultAvatar;

  const toggleMenu = (key) => {
    setOpenMenu((prev) => (prev === key ? null : key));
  };

  const selectOption = (setter, value) => {
    setter(value);
    setOpenMenu(null);
  };

  const goManageList = () => navigate("/ManagerManageStudent");

  const handleUpdate = () => {
    window.alert(
      [
        "Update (placeholder — connect API):",
        `ARID: ${aridNo || "(empty)"}`,
        `Name: ${studentName || "(empty)"}`,
        `Gender: ${gender}`,
        `Class: ${classSection || "(empty)"}`,
        `Program: ${program || "(empty)"}`,
        `Course: ${course || "(empty)"}`,
        `Password: ${password ? "(set)" : "(empty)"}`,
      ].join("\n")
    );
  };

  return (
    <div className="uf-page">
      <div className="uf-scroll">
        <img src={logo} alt="BIIT" className="uf-logo" />

        <section className="uf-card" aria-label="Manager information">
          <h2 className="uf-card-title">Manager information</h2>
          <div className="uf-profile-row">
            <div>
              <p className="uf-txt">
                Name: <strong>{managerName}</strong>
              </p>
              <p className="uf-txt">
                Designation: <strong>{designation}</strong>
              </p>
            </div>
            <img src={defaultAvatar} alt="" className="uf-avatar" />
          </div>
        </section>

        <section className="uf-mcard" aria-label="Update student form">
          <h2 className="uf-mtitle">Update student</h2>

          <div className="uf-student-preview">
            <img src={displayStudentImg} alt="Student preview" />
          </div>

          <input
            className="uf-input"
            placeholder="AridNo"
            value={aridNo}
            onChange={(e) => setAridNo(e.target.value)}
            autoComplete="username"
          />

          <div className="uf-name-row">
            <input
              className="uf-input"
              placeholder="Student name"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
            />
            <input ref={fileRef} type="file" className="uf-file-hidden" accept="image/*" onChange={onImageFile} />
            <button type="button" className="uf-image-btn" onClick={pickImage}>
              Upload image
            </button>
          </div>

          <div className="uf-dd-shell" ref={classRef}>
            <button
              type="button"
              className="uf-dd-toggle"
              aria-expanded={openMenu === "class"}
              onClick={() => toggleMenu("class")}
            >
              <span>{classSection || "Class_Section"}</span>
              <span aria-hidden>▼</span>
            </button>
            {openMenu === "class" && (
              <div className="uf-dd-list" role="listbox">
                {CLASS_OPTIONS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className="uf-dd-item"
                    role="option"
                    onClick={() => selectOption(setClassSection, item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="uf-gender-row" role="radiogroup" aria-label="Gender">
            <span className="uf-gender-text">Gender:</span>
            <label className="uf-radio-label">
              <input type="radio" name="gender" checked={gender === "Male"} onChange={() => setGender("Male")} />
              Male
            </label>
            <label className="uf-radio-label">
              <input type="radio" name="gender" checked={gender === "Female"} onChange={() => setGender("Female")} />
              Female
            </label>
          </div>

          <div className="uf-dd-shell" ref={programRef}>
            <button
              type="button"
              className="uf-dd-toggle"
              aria-expanded={openMenu === "program"}
              onClick={() => toggleMenu("program")}
            >
              <span>{program || "Program"}</span>
              <span aria-hidden>▼</span>
            </button>
            {openMenu === "program" && (
              <div className="uf-dd-list" role="listbox">
                {PROGRAM_OPTIONS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className="uf-dd-item"
                    role="option"
                    onClick={() => selectOption(setProgram, item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="uf-dd-shell" ref={courseRef}>
            <button
              type="button"
              className="uf-dd-toggle"
              aria-expanded={openMenu === "course"}
              onClick={() => toggleMenu("course")}
            >
              <span>{course || "Assign courses"}</span>
              <span aria-hidden>▼</span>
            </button>
            {openMenu === "course" && (
              <div className="uf-dd-list" role="listbox">
                {COURSE_OPTIONS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className="uf-dd-item"
                    role="option"
                    onClick={() => selectOption(setCourse, item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>

          <input
            className="uf-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />

          <div className="uf-btn-row">
            <button type="button" className="uf-update-btn" onClick={handleUpdate}>
              ✔ Update
            </button>
            <button type="button" className="uf-back-btn-inline" onClick={goManageList}>
              ⬅ Back
            </button>
          </div>
        </section>

        <button type="button" className="uf-back-pill" onClick={goManageList}>
          ⬅ Back
        </button>
      </div>
    </div>
  );
};

export default UpdateFaculty;
