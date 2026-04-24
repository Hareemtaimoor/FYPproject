import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./ConfidentialDecryptor.css";
import logo from "../Images/Biit_Logo.png";
import ApiEndPoint from "../unity.js";

const BASE64_KEY = "vrHFCSCrUlrMHNWFTYJgS09SfZFC+QY0PuMuOz0pyXY=";

const base64ToBytes = (base64) => {
    const sanitized = base64
        .trim()
        .replace(/\s/g, "")
        .replace(/-/g, "+")
        .replace(/_/g, "/");
    const padded = sanitized + "=".repeat((4 - (sanitized.length % 4)) % 4);

    if (!/^[A-Za-z0-9+/=]+$/.test(padded)) {
        throw new Error("Invalid base64 input in encrypted file.");
    }

    const binary = window.atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
};

const decodeUtf8 = (bytes) => new TextDecoder().decode(bytes);

const tryDecrypt = async (algorithmName, ivBytes, cipherBytes, key) => {
    const algorithm = { name: algorithmName, iv: ivBytes };
    const plainBuffer = await window.crypto.subtle.decrypt(algorithm, key, cipherBytes);
    return decodeUtf8(new Uint8Array(plainBuffer));
};

const ConfidentialDecryptor = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [fileName, setFileName] = useState("");
    const [isDecrypting, setIsDecrypting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const decryptPayload = async (payloadText, rawBytes) => {
        const keyBytes = base64ToBytes(BASE64_KEY);
        const importedKey = await window.crypto.subtle.importKey(
            "raw",
            keyBytes,
            { name: "AES-GCM" },
            false,
            ["decrypt"]
        );

        let payloadObj = null;
        try {
            payloadObj = JSON.parse(payloadText);
        } catch {
            payloadObj = null;
        }

        // Format A (recommended): {"iv":"<base64>","ciphertext":"<base64>","mode":"AES-GCM|AES-CBC"}
        if (payloadObj?.iv && payloadObj?.ciphertext) {
            const iv = base64ToBytes(payloadObj.iv);
            const ciphertext = base64ToBytes(payloadObj.ciphertext);
            const mode = (payloadObj.mode || "AES-GCM").toUpperCase();

            if (mode === "AES-CBC") {
                const cbcKey = await window.crypto.subtle.importKey(
                    "raw",
                    keyBytes,
                    { name: "AES-CBC" },
                    false,
                    ["decrypt"]
                );
                return tryDecrypt("AES-CBC", iv, ciphertext, cbcKey);
            }
            return tryDecrypt("AES-GCM", iv, ciphertext, importedKey);
        }

        // Format B1: file content is base64 text where IV is prepended to ciphertext.
        let raw = null;
        try {
            raw = base64ToBytes(payloadText);
        } catch {
            raw = rawBytes;
        }

        // Try AES-GCM (12-byte IV prefix)
        if (raw.length > 12) {
            try {
                const iv12 = raw.slice(0, 12);
                const data12 = raw.slice(12);
                return await tryDecrypt("AES-GCM", iv12, data12, importedKey);
            } catch {
                // continue to AES-CBC fallback
            }
        }

        // Try AES-CBC (16-byte IV prefix)
        if (raw.length > 16) {
            const cbcKey = await window.crypto.subtle.importKey(
                "raw",
                keyBytes,
                { name: "AES-CBC" },
                false,
                ["decrypt"]
            );
            const iv16 = raw.slice(0, 16);
            const data16 = raw.slice(16);
            return tryDecrypt("AES-CBC", iv16, data16, cbcKey);
        }

        throw new Error(
            "Unsupported encrypted file format. Use JSON {iv,ciphertext,mode} or base64/binary with IV prefixed."
        );
    };

    const handleFileSelect = async (event) => {
        const file = event.target.files?.[0];
        setError("");
        setSuccess("");
        if (!file) return;

        setFileName(file.name);
        setIsDecrypting(true);
        try {
            const fileBytes = new Uint8Array(await file.arrayBuffer());
            const encryptedText = await file.text();
            const decryptedText = await decryptPayload(encryptedText, fileBytes);
            const parsed = JSON.parse(decryptedText);
            await axios.post(`${ApiEndPoint}director/save-confidential`, parsed, {
                headers: {
                    "Content-Type": "application/json",
                },
            });
            setSuccess("File decrypted and saved to DB successfully.");
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
                        Upload AES-256 encrypted file. It will be decrypted and saved to DB.
                    </p>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".txt,.json,.enc"
                        onChange={handleFileSelect}
                        className="file-input"
                    />
                    {fileName && <p className="file-name">Selected: {fileName}</p>}
                    {isDecrypting && <p className="status-text">Decrypting...</p>}
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
