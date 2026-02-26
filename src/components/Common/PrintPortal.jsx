import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const PRINT_STYLES = `
    /* Injected Print Styles */
    body { margin: 0; padding: 0; background: #e0e0e0; font-family: 'Inter', sans-serif; overflow-y: auto !important; }
    * { box-sizing: border-box; }
    
    /* A4 Page Layout */
    .print-page-a4 {
        width: 210mm;
        min-height: 297mm;
        padding: 10mm;
        margin: 20px auto;
        background: white;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        position: relative;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
    }

    /* ID Card Section */
    .id-card-grid {
        display: flex;
        flex-wrap: wrap;
        align-content: flex-start;
        width: 100%;
        height: auto;
    }
    .id-card-print-item {
        width: 50%;
        padding: 5mm;
        display: flex;
        justify-content: center;
        align-items: flex-start;
        page-break-inside: avoid;
        box-sizing: border-box;
    }
    /* Force ID Card Dimensions */
    .id-card {
        width: 85.6mm !important;
        min-height: 54mm !important;
        height: auto !important;
        max-width: 85.6mm !important;
        flex-shrink: 0 !important;
        border: 1px solid #ddd;
        box-shadow: none !important;
        transform: none !important;
        margin: 0 !important;
    }

    /* Document Styles */
    .doc-header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
    .doc-logo { width: 80px; height: 80px; object-fit: contain; }
    .doc-school-info { flex: 1; padding: 0 20px; }
    .doc-school-name { font-size: 24px; font-weight: bold; margin: 0 0 5px 0; text-transform: uppercase; }
    .doc-school-contact { font-size: 12px; color: #555; }
    .doc-title { font-size: 18px; font-weight: 600; text-transform: uppercase; margin-top: 5px; padding: 5px 15px; background: #f0f0f0; border-radius: 4px; display: inline-block; }
    .doc-photo { width: 90px; height: 110px; object-fit: cover; border: 1px solid #ddd; background: #f9f9f9; }
    
    /* Grid & Fields */
    .doc-section { margin-bottom: 15px; break-inside: avoid; }
    .doc-section-title { font-size: 14px; font-weight: 700; text-transform: uppercase; color: #333; border-bottom: 1px solid #ddd; margin-bottom: 10px; padding-bottom: 3px; }
    .doc-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px 15px; }
    .doc-field { display: flex; flex-direction: column; }
    .doc-label { font-size: 10px; color: #666; text-transform: uppercase; font-weight: 600; }
    .doc-value { font-size: 12px; color: #000; font-weight: 500; border-bottom: 1px dotted #ccc; padding-bottom: 2px; min-height: 18px; }

    @media print {
        body { background: white; margin: 0; overflow: visible; }
        .print-page-a4 { margin: 0; box-shadow: none; width: 100%; min-height: auto; }
        .no-print { display: none !important; }
    }
`;

const PrintPortal = ({ children, title = 'Print Document', onClose }) => {
    const [container, setContainer] = useState(null);
    // Keep reference to window to close it on unmount
    const [printWindowRef, setPrintWindowRef] = useState(null);

    useEffect(() => {
        // Open window
        const printWindow = window.open('', '_blank', 'width=1000,height=800');
        if (!printWindow) {
            alert('Please allow popups for this website to enable printing.');
            if (onClose) onClose();
            return;
        }

        setPrintWindowRef(printWindow);

        // Write Basic Skeleton
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${title}</title>
            </head>
            <body>
                <div id="print-root"></div>
            </body>
            </html>
        `);
        printWindow.document.close();

        // Get Root
        const root = printWindow.document.getElementById('print-root');
        setContainer(root);

        // Cleanup Handler
        const handleClose = () => {
            if (onClose) onClose();
        };
        printWindow.addEventListener('beforeunload', handleClose);

        // Auto Print Trigger
        setTimeout(() => {
            printWindow.print();
        }, 1500);

        return () => {
            printWindow.removeEventListener('beforeunload', handleClose);
            // We don't forcibly close the window on unmount to prevent annoying the user if they are still previewing,
            // BUT if the parent unmounts (navigates away), we probably should.
            // For now, let's leave it open or let user close it.
            // Actually, react-portal pattern usually implies lifecycle tie.
            // If we don't close it, it becomes a "detached" zombie window.
            // Let's close it to be safe and clean.
            printWindow.close();
        };
    }, []);

    if (!container) return null;

    return createPortal(
        <>
            <style>{PRINT_STYLES}</style>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
            {children}
        </>,
        container
    );
};

export default PrintPortal;
