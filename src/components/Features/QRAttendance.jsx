import React, { useState, useRef } from 'react';
import { X, QrCode, User, Download } from 'lucide-react';
import './QRAttendance.css';

export default function QRAttendance({ isOpen, onClose, students = [], schoolName }) {
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const qrRef = useRef(null);

    if (!isOpen) return null;

    const filteredStudents = students.filter(s => {
        const name = s.name || s.studentFirstName || '';
        const grNo = s.grNo || '';
        const query = searchQuery.toLowerCase();
        return name.toLowerCase().includes(query) || grNo.toLowerCase().includes(query);
    });

    // Generate a simple QR code as SVG (basic implementation)
    const generateQRPattern = (data) => {
        // Create a simple visual representation (for demo purposes)
        // For production, use a library like qrcode.react
        const size = 200;
        const cells = 21;
        const cellSize = size / cells;
        const patterns = [];

        // Generate pseudo-random pattern based on data
        const hash = data.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

        for (let i = 0; i < cells; i++) {
            for (let j = 0; j < cells; j++) {
                // Position detection patterns (corners)
                const isTopLeftBox = (i < 7 && j < 7);
                const isTopRightBox = (i < 7 && j >= cells - 7);
                const isBottomLeftBox = (i >= cells - 7 && j < 7);

                if (isTopLeftBox || isTopRightBox || isBottomLeftBox) {
                    // Draw finder patterns
                    const isOuter = (i === 0 || j === 0 || i === 6 || j === 6 ||
                        (isTopRightBox && (j === cells - 1 || j === cells - 7)) ||
                        (isBottomLeftBox && (i === cells - 1 || i === cells - 7)));
                    const isInner = (i >= 2 && i <= 4 && j >= 2 && j <= 4) ||
                        (isTopRightBox && i >= 2 && i <= 4 && j >= cells - 5 && j <= cells - 3) ||
                        (isBottomLeftBox && i >= cells - 5 && i <= cells - 3 && j >= 2 && j <= 4);

                    if (isOuter || isInner) {
                        patterns.push(
                            <rect
                                key={`${i}-${j}`}
                                x={j * cellSize}
                                y={i * cellSize}
                                width={cellSize}
                                height={cellSize}
                                fill="#333"
                            />
                        );
                    }
                } else {
                    // Data cells - pseudo-random based on position and hash
                    const shouldFill = ((i * cells + j + hash) % 3 === 0) ||
                        ((i + j + hash) % 5 === 0);
                    if (shouldFill) {
                        patterns.push(
                            <rect
                                key={`${i}-${j}`}
                                x={j * cellSize}
                                y={i * cellSize}
                                width={cellSize}
                                height={cellSize}
                                fill="#333"
                            />
                        );
                    }
                }
            }
        }

        return patterns;
    };

    const handleDownload = () => {
        if (!qrRef.current) return;

        const svg = qrRef.current;
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        canvas.width = 300;
        canvas.height = 350;

        img.onload = () => {
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 50, 20, 200, 200);

            // Add text
            ctx.fillStyle = '#333';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(selectedStudent?.name || selectedStudent?.studentFirstName || 'Student', canvas.width / 2, 250);
            ctx.font = '12px Arial';
            ctx.fillText(`GR: ${selectedStudent?.grNo || 'N/A'}`, canvas.width / 2, 275);
            ctx.fillText(schoolName || 'School', canvas.width / 2, 295);

            const link = document.createElement('a');
            link.download = `QR_${selectedStudent?.name || 'student'}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        };

        img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    };

    return (
        <div className="qr-overlay" onClick={onClose}>
            <div className="qr-modal" onClick={e => e.stopPropagation()}>
                <div className="qr-header">
                    <h2><QrCode size={24} /> QR Attendance</h2>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="qr-content">
                    <div className="qr-sidebar">
                        <input
                            type="text"
                            className="qr-search"
                            placeholder="Search students..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div className="student-list">
                            {filteredStudents.length === 0 ? (
                                <p className="no-students">No students found. Add students first.</p>
                            ) : (
                                filteredStudents.map(student => (
                                    <button
                                        key={student.id}
                                        className={`student-item ${selectedStudent?.id === student.id ? 'active' : ''}`}
                                        onClick={() => setSelectedStudent(student)}
                                    >
                                        <User size={16} />
                                        <span>{student.name || student.studentFirstName || 'Student'}</span>
                                        <small>GR: {student.grNo || 'N/A'}</small>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="qr-display">
                        {selectedStudent ? (
                            <>
                                <div className="qr-code-container">
                                    <svg
                                        ref={qrRef}
                                        width="200"
                                        height="200"
                                        viewBox="0 0 200 200"
                                        className="qr-code-svg"
                                    >
                                        <rect width="200" height="200" fill="white" />
                                        {generateQRPattern(`${selectedStudent.id}-${selectedStudent.grNo}-${schoolName}`)}
                                    </svg>
                                </div>
                                <div className="qr-info">
                                    <h3>{selectedStudent.name || selectedStudent.studentFirstName}</h3>
                                    <p>GR No: {selectedStudent.grNo || 'N/A'}</p>
                                    <p>Class: {selectedStudent.standard || 'N/A'}</p>
                                </div>
                                <button className="download-btn" onClick={handleDownload}>
                                    <Download size={18} />
                                    Download QR Code
                                </button>
                            </>
                        ) : (
                            <div className="no-selection">
                                <QrCode size={64} />
                                <p>Select a student to generate QR Code</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
