import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./ConfidentialDecryptor.css";
import logo from "../Images/Biit_Logo.png";
import ApiEndPoint from "../unity.js";

const ConfidentialDecryptor = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [fileName, setFileName] = useState("");
    const [isDecrypting, setIsDecrypting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleFileSelect = async (event) => {
        const file = event.target.files?.[0];
        setError("");
        setSuccess("");
        if (!file) return;

        if (!file.name.toLowerCase().endsWith(".enc")) {
            setError("Please upload a .enc file.");
            return;
        }

        setFileName(file.name);
        setIsDecrypting(true);
        try {
            const formData = new FormData();
            formData.append("file", file);

            await axios.post(`${ApiEndPoint}director/import-confidential`, formData);
            setSuccess("Encrypted file uploaded and sent to DB endpoint successfully.");
        } catch (e) {
            const apiMessage = e.response?.data?.message || e.response?.data?.Message;
            setError(apiMessage ? `Save failed: ${apiMessage}` : `Process failed: ${e.message}`);
        } finally {
            setIsDecrypting(false);
        }
    };

    return (
        <div className="decrypt-page">
            <div className="decrypt-scroll">
                <div className="top-logo-wrap">
                    <img src={logo} alt="BIIT Logo" className="header-logo-img" />
                </div>

                <div className="decrypt-card">
                    <button
                        type="button"
                        className="upload-top-btn"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isDecrypting}
                    >
                        Upload Encrypted File
                    </button>
                    <h2>Confidential File Decryptor</h2>
                    <p className="hint-text">
                        Upload .enc file. It will be sent directly to the save endpoint.
                    </p>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".enc"
                        onChange={handleFileSelect}
                        className="file-input"
                    />
                    {fileName && <p className="file-name">Selected: {fileName}</p>}
                    {isDecrypting && <p className="status-text">Uploading...</p>}
                    {success && <p className="status-text">{success}</p>}
                    {error && <p className="error-text">{error}</p>}
                </div>
            </div>

            <div className="questions-footer-nav">
                <button className="logout-btn-white" onClick={() => navigate("/DirectorDashboard")}>
                    Back to Dashboard
                </button>
            </div>
        </div>
    );
};

export default ConfidentialDecryptor;
