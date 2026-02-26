import React, { useState, useEffect, useRef } from 'react';
import { useUndo } from '../../contexts/UndoContext';
import * as db from '../../services/database';
import { SaveIcon, PrinterIcon, PlusIcon, TrashIcon, FileTextIcon, ImageIcon } from '../Icons/CustomIcons';
import './HOIDiary.css';

export default function HOIDiary() {
    const [pages, setPages] = useState([]);
    const [currentPage, setCurrentPage] = useState(null);
    const [content, setContent] = useState('');
    const [attachments, setAttachments] = useState([]);
    const [saving, setSaving] = useState(false);
    const textareaRef = useRef(null);
    const { recordAction } = useUndo();

    useEffect(() => {
        loadPages();
    }, []);

    const loadPages = async () => {
        try {
            const saved = await db.getSetting('hoi_diary_pages') || [];
            setPages(saved);
            if (saved.length > 0 && !currentPage) {
                loadPage(saved[saved.length - 1]);
            }
        } catch (error) {
            console.error('Failed to load diary:', error);
        }
    };

    const loadPage = (page) => {
        setCurrentPage(page);
        setContent(page.content || '');
        setAttachments(page.attachments || []);
    };

    const handleNewPage = () => {
        const newPage = {
            id: Date.now().toString(),
            title: `Page ${pages.length + 1}`,
            date: new Date().toLocaleDateString(),
            createdAt: Date.now()
        };
        setCurrentPage(newPage);
        setContent('');
        setAttachments([]);
    };

    const handleSave = async () => {
        if (!currentPage) return;

        setSaving(true);
        try {
            const pageData = {
                ...currentPage,
                content,
                attachments,
                title: (content || '').split('\n')[0]?.substring(0, 50) || `Page ${pages.length + 1}`,
                updatedAt: Date.now()
            };

            let newPages;
            const existingIndex = pages.findIndex(p => p.id === currentPage.id);
            if (existingIndex >= 0) {
                newPages = pages.map(p => p.id === currentPage.id ? pageData : p);
            } else {
                newPages = [...pages, pageData];
            }

            await db.setSetting('hoi_diary_pages', newPages);
            setPages(newPages);
            setCurrentPage(pageData);

            recordAction({
                type: 'SAVE_DIARY_PAGE',
                description: `Saved diary page: ${pageData.title.substring(0, 30)}...`,
                undo: async () => {
                    await db.setSetting('hoi_diary_pages', pages);
                    setPages(pages);
                },
                redo: async () => {
                    await db.setSetting('hoi_diary_pages', newPages);
                    setPages(newPages);
                }
            });
        } catch (error) {
            console.error('Failed to save:', error);
            alert('Failed to save. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleDeletePage = async (pageId) => {
        const page = pages.find(p => p.id === pageId);
        const newPages = pages.filter(p => p.id !== pageId);
        setPages(newPages);
        await db.setSetting('hoi_diary_pages', newPages);

        if (currentPage?.id === pageId) {
            if (newPages.length > 0) {
                loadPage(newPages[newPages.length - 1]);
            } else {
                setCurrentPage(null);
                setContent('');
                setAttachments([]);
            }
        }

        recordAction({
            type: 'DELETE_DIARY_PAGE',
            description: `Deleted diary page: ${page?.title?.substring(0, 30)}...`,
            undo: async () => {
                const list = await db.getSetting('hoi_diary_pages') || [];
                list.push(page);
                await db.setSetting('hoi_diary_pages', list);
                setPages(list);
            },
            redo: async () => {
                const list = await db.getSetting('hoi_diary_pages') || [];
                const filtered = list.filter(p => p.id !== pageId);
                await db.setSetting('hoi_diary_pages', filtered);
                setPages(filtered);
            }
        });
    };

    const handleFileAttach = async (e) => {
        const files = e.target.files;
        if (!files.length) return;

        const selectionStart = textareaRef.current?.selectionStart || 0;
        const lineNumber = (content || '').substring(0, selectionStart).split('\n').length;

        for (const file of files) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const attachment = {
                    id: Date.now().toString(),
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    data: event.target.result,
                    line: lineNumber
                };
                setAttachments(prev => [...prev, attachment]);
            };

            if (file.type.startsWith('image/')) {
                reader.readAsDataURL(file);
            } else {
                reader.readAsDataURL(file);
            }
        }
    };

    const handleRemoveAttachment = (attachmentId) => {
        setAttachments(prev => prev.filter(a => a.id !== attachmentId));
    };

    const handlePrint = () => {
        window.print();
    };

    const getLineAttachments = (lineNumber) => {
        return attachments.filter(a => a.line === lineNumber);
    };

    return (
        <div className="hoi-diary">
            {/* Sidebar with pages */}
            <div className="diary-sidebar">
                <div className="sidebar-header">
                    <h3>📕 Diary Pages</h3>
                    <button className="new-page-btn" onClick={handleNewPage}>
                        <PlusIcon size={16} />
                    </button>
                </div>
                <div className="pages-list">
                    {pages.length === 0 ? (
                        <div className="empty-pages">
                            <p>No pages yet</p>
                            <button onClick={handleNewPage}>Create first page</button>
                        </div>
                    ) : (
                        pages.map(page => (
                            <div
                                key={page.id}
                                className={`page-item ${currentPage?.id === page.id ? 'active' : ''}`}
                                onClick={() => loadPage(page)}
                            >
                                <div className="page-info">
                                    <span className="page-title">
                                        {page.title?.substring(0, 30) || 'Untitled'}
                                    </span>
                                    <span className="page-date">{page.date}</span>
                                </div>
                                <button
                                    className="delete-page-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm('Delete this page?')) {
                                            handleDeletePage(page.id);
                                        }
                                    }}
                                >
                                    <TrashIcon size={14} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Main writing area */}
            <div className="diary-main">
                <div className="diary-header">
                    <h2>✍️ HOI Diary</h2>
                    <div className="diary-actions">
                        <label className="attach-btn">
                            <input
                                type="file"
                                multiple
                                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                                onChange={handleFileAttach}
                                hidden
                            />
                            <PlusIcon size={16} />
                            Attach
                        </label>
                        <button className="action-btn" onClick={handlePrint}>
                            <PrinterIcon size={20} />
                            Print
                        </button>
                        <button
                            className="save-btn"
                            onClick={handleSave}
                            disabled={saving || !currentPage}
                        >
                            <SaveIcon size={20} />
                            {saving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>

                {currentPage ? (
                    <div className="writing-area">
                        <div className="paper">
                            <div className="paper-header">
                                <span className="date">{currentPage.date}</span>
                            </div>
                            <textarea
                                ref={textareaRef}
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Start writing here..."
                                className="paper-content"
                            />

                            {/* Show attachments */}
                            {attachments.length > 0 && (
                                <div className="attachments-bar">
                                    <h4>📎 Attachments ({attachments.length})</h4>
                                    <div className="attachments-list">
                                        {attachments.map(att => (
                                            <div key={att.id} className="attachment-item">
                                                {att.type.startsWith('image/') ? (
                                                    <img src={att.data} alt={att.name} className="att-preview" />
                                                ) : (
                                                    <div className="att-icon">
                                                        <FileTextIcon size={24} />
                                                    </div>
                                                )}
                                                <span className="att-name">{att.name}</span>
                                                <button
                                                    className="att-remove"
                                                    onClick={() => handleRemoveAttachment(att.id)}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="no-page">
                        <h3>📝 Select or create a page</h3>
                        <p>Click the + button to start a new diary page</p>
                        <button onClick={handleNewPage} className="create-btn">
                            <PlusIcon size={18} />
                            Create New Page
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
