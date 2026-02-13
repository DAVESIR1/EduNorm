import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const PrintFrame = ({ children, onAfterPrint, title = 'Print' }) => {
    const [mountNode, setMountNode] = useState(null);
    const iframeRef = useRef(null);

    useEffect(() => {
        // Find or create iframe
        const iframe = iframeRef.current;
        const doc = iframe.contentWindow.document;

        // Write basic structure
        doc.open();
        doc.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${title}</title>
                <style>
                    body { margin: 0; padding: 0; background: white; }
                    /* Ensure full visibility */
                    #print-mount { width: 100%; height: 100%; }
                    @media print {
                        @page { margin: 0; size: auto; }
                        body { margin: 1.6cm; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    }
                </style>
            </head>
            <body>
                <div id="print-mount"></div>
            </body>
            </html>
        `);
        doc.close();

        // Copy styles from main document to iframe to ensure consistency
        const styles = document.querySelectorAll('style, link[rel="stylesheet"]');
        styles.forEach(style => {
            if (style.tagName === 'LINK') {
                const link = doc.createElement('link');
                link.rel = 'stylesheet';
                link.href = style.href;
                doc.head.appendChild(link);
            } else {
                const newStyle = doc.createElement('style');
                newStyle.textContent = style.textContent;
                doc.head.appendChild(newStyle);
            }
        });

        // Specific Print Styles for ID Cards (Hardcoded to be safe)
        const specificStyle = doc.createElement('style');
        specificStyle.textContent = `
            /* FORCE VISIBILITY in Iframe */
            body, body * { visibility: visible !important; }
            .id-card-grid { display: flex; flex-wrap: wrap; width: 100%; }
            .id-card-print-item { width: 50%; padding: 10px; box-sizing: border-box; page-break-inside: avoid; }
            .id-card {
                width: 85.6mm !important;
                height: 54mm !important;
                border: 1px solid #ddd;
                box-shadow: none !important;
                margin: 0 !important;
                page-break-inside: avoid;
            }
            @media print {
                 .no-print { display: none !important; }
                 body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
        `;
        doc.head.appendChild(specificStyle);

        setMountNode(doc.getElementById('print-mount'));

        // Print handler
        const handlePrint = () => {
            // Wait for images/styles
            setTimeout(() => {
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
                if (onAfterPrint) onAfterPrint();
            }, 1000);
        };

        handlePrint();

    }, [onAfterPrint, title]);

    return (
        <iframe
            ref={iframeRef}
            title={title}
            style={{
                position: 'fixed',
                top: 0,
                left: '-10000px', // Move off-screen
                width: '1000px', // Give it size
                height: '1000px',
                border: 'none',
                zIndex: -1
            }}
        >
            {mountNode && createPortal(children, mountNode)}
        </iframe>
    );
};

export default PrintFrame;
