import React, { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./ConfidentialDecryptor.css";
import logo from "../Images/Biit_Logo.png";

const ConfidentialDecryptorTable = () => {
    const navigate = useNavigate();
    const { state } = useLocation();
    const records = state?.records || [];
    const rawJson = state?.rawJson || "";
    const fileName = state?.fileName || "";

    const columns = useMemo(() => {
        if (!records.length) return [];
        const keys = new Set();
        records.forEach((row) => {
            Object.keys(row || {}).forEach((k) => keys.add(k));
        });
        return Array.from(keys);
    }, [records]);

    return (
        <div className="decrypt-page">
            <div className="decrypt-scroll">
                <div className="top-logo-wrap">
                    <img src={logo} alt="BIIT Logo" className="header-logo-img" />
                </div>

                <div className="decrypt-card">
                    <h2>Decrypted Confidential Data</h2>
                    {fileName && <p className="file-name">Source file: {fileName}</p>}
                    {!records.length && (
                        <p className="hint-text">
                            No decrypted data found. Upload a file from the previous screen.
                        </p>
                    )}
                </div>

                {records.length > 0 && (
                    <div className="decrypt-card table-card">
                        <h3>Decrypted Records</h3>
                        <div className="table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        {columns.map((col) => (
                                            <th key={col}>{col}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {records.map((row, idx) => (
                                        <tr key={`row-${idx}`}>
                                            {columns.map((col) => (
                                                <td key={`${idx}-${col}`}>
                                                    {typeof row[col] === "object"
                                                        ? JSON.stringify(row[col])
                                                        : String(row[col] ?? "")}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {rawJson && (
                    <div className="decrypt-card">
                        <h3>Raw Decrypted JSON</h3>
                        <pre className="raw-json">{rawJson}</pre>
                    </div>
                )}
            </div>

            <div className="questions-footer-nav">
                <button className="logout-btn-white" onClick={() => navigate("/ConfidentialDecryptor")}>
                    Back to Upload
                </button>
            </div>
        </div>
    );
};

export default ConfidentialDecryptorTable;
