import React, { useState, useEffect, useCallback } from 'react';
import { useUndo } from '../../contexts/UndoContext';
import * as db from '../../services/database';
import { SaveIcon, PrinterIcon, PlusIcon, TrashIcon, EditIcon, FileTextIcon } from '../Icons/CustomIcons';
import './SalaryBook.css';

// Default salary fields
const SALARY_FIELDS = [
    { id: 'basic_salary', label: 'Basic Salary', type: 'number' },
    { id: 'da', label: 'DA (Dearness Allowance)', type: 'number' },
    { id: 'hra', label: 'HRA (House Rent)', type: 'number' },
    { id: 'ta', label: 'TA (Travel Allowance)', type: 'number' },
    { id: 'medical', label: 'Medical Allowance', type: 'number' },
    { id: 'special', label: 'Special Allowance', type: 'number' },
    { id: 'pf', label: 'PF Deduction', type: 'number', isDeduction: true },
    { id: 'professional_tax', label: 'Professional Tax', type: 'number', isDeduction: true },
    { id: 'income_tax', label: 'Income Tax (TDS)', type: 'number', isDeduction: true },
    { id: 'insurance', label: 'Insurance Deduction', type: 'number', isDeduction: true },
    { id: 'other_deduction', label: 'Other Deduction', type: 'number', isDeduction: true },
];

const MONTHS = [
    'April', 'May', 'June', 'July', 'August', 'September',
    'October', 'November', 'December', 'January', 'February', 'March'
];

function getCurrentFinancialYear() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-indexed
    if (month >= 3) return `${year}-${year + 1}`;
    return `${year - 1}-${year}`;
}

function getFinancialYears() {
    const currentFY = getCurrentFinancialYear();
    const startYear = parseInt(currentFY.split('-')[0]);
    const years = [];
    for (let i = startYear - 5; i <= startYear + 1; i++) {
        years.push(`${i}-${i + 1}`);
    }
    return years;
}

export default function SalaryBook() {
    const [selectedYear, setSelectedYear] = useState(getCurrentFinancialYear());
    const [salaryData, setSalaryData] = useState({});
    const [staffList, setStaffList] = useState([]);
    const [selectedStaff, setSelectedStaff] = useState('');
    const [editMonth, setEditMonth] = useState(null);
    const [monthData, setMonthData] = useState({});
    const [saving, setSaving] = useState(false);
    const [showSlip, setShowSlip] = useState(null);
    const { recordAction } = useUndo();

    // Load staff list
    useEffect(() => {
        const loadStaff = async () => {
            const saved = await db.getSetting('staff_info_list') || [];
            setStaffList(saved);
            if (saved.length > 0 && !selectedStaff) {
                setSelectedStaff(saved[0].id);
            }
        };
        loadStaff();
    }, []);

    // Load salary data when staff or year changes
    useEffect(() => {
        if (selectedStaff && selectedYear) {
            loadSalaryData();
        }
    }, [selectedStaff, selectedYear]);

    const loadSalaryData = async () => {
        try {
            const key = `salary_${selectedStaff}_${selectedYear}`;
            const saved = await db.getSetting(key) || {};
            setSalaryData(saved || {});
        } catch (error) {
            console.error('Failed to load salary data:', error);
            setSalaryData({});
        }
    };

    const handleEditMonth = (month) => {
        setEditMonth(month);
        setMonthData((salaryData && salaryData[month]) ? salaryData[month] : {});
    };

    const handleFieldChange = (fieldId, value) => {
        setMonthData(prev => ({ ...prev, [fieldId]: parseFloat(value) || 0 }));
    };

    const calculateTotals = useCallback((data) => {
        let earnings = 0;
        let deductions = 0;
        const safeData = data || {};

        SALARY_FIELDS.forEach(field => {
            const val = safeData[field.id] || 0;
            if (field.isDeduction) {
                deductions += val;
            } else {
                earnings += val;
            }
        });

        return { earnings, deductions, net: earnings - deductions };
    }, []);

    const handleSaveMonth = async () => {
        if (!editMonth || !selectedStaff) return;

        setSaving(true);
        try {
            const key = `salary_${selectedStaff}_${selectedYear}`;
            const oldData = { ...salaryData };
            const newData = { ...salaryData, [editMonth]: monthData };

            await db.setSetting(key, newData);
            setSalaryData(newData);
            setEditMonth(null);

            recordAction({
                type: 'UPDATE_SALARY',
                description: `Updated salary for ${editMonth} ${selectedYear}`,
                undo: async () => {
                    await db.setSetting(key, oldData);
                    setSalaryData(oldData);
                },
                redo: async () => {
                    await db.setSetting(key, newData);
                    setSalaryData(newData);
                }
            });
        } catch (error) {
            console.error('Failed to save:', error);
            alert('Failed to save salary data. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleAutoFill = () => {
        // Auto-fill remaining months with current month data
        if (!editMonth) return;
        const currentMonthIndex = MONTHS.indexOf(editMonth);
        const newData = { ...salaryData };

        for (let i = currentMonthIndex + 1; i < MONTHS.length; i++) {
            if (!newData[MONTHS[i]] || Object.keys(newData[MONTHS[i]]).length === 0) {
                newData[MONTHS[i]] = { ...monthData };
            }
        }

        setSalaryData(newData);
    };

    const handlePrintSlip = (month) => {
        setShowSlip(month);
        setTimeout(() => window.print(), 500);
    };

    const activeStaff = staffList.find(s => s.id === selectedStaff);

    // Salary Slip Modal
    if (showSlip) {
        const slipData = (salaryData && salaryData[showSlip]) || {};
        const totals = calculateTotals(slipData);

        return (
            <div className="salary-slip-modal">
                <div className="salary-slip print-area">
                    <div className="slip-header">
                        <h2>Salary Slip</h2>
                        <p className="slip-period">{showSlip} {selectedYear}</p>
                        <p className="slip-name">{activeStaff?.data?.name || 'Staff Member'}</p>
                        <p className="slip-designation">{activeStaff?.data?.designation || ''}</p>
                    </div>

                    <div className="slip-body">
                        <div className="slip-column">
                            <h4>Earnings</h4>
                            {SALARY_FIELDS.filter(f => !f.isDeduction).map(field => (
                                <div key={field.id} className="slip-row">
                                    <span>{field.label}</span>
                                    <span>₹{(slipData[field.id] || 0).toLocaleString()}</span>
                                </div>
                            ))}
                            <div className="slip-row total">
                                <span>Total Earnings</span>
                                <span>₹{totals.earnings.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="slip-column">
                            <h4>Deductions</h4>
                            {SALARY_FIELDS.filter(f => f.isDeduction).map(field => (
                                <div key={field.id} className="slip-row">
                                    <span>{field.label}</span>
                                    <span>₹{(slipData[field.id] || 0).toLocaleString()}</span>
                                </div>
                            ))}
                            <div className="slip-row total">
                                <span>Total Deductions</span>
                                <span>₹{totals.deductions.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="slip-net">
                        <span>Net Salary</span>
                        <span>₹{totals.net.toLocaleString()}</span>
                    </div>
                </div>

                <div className="slip-actions no-print">
                    <button className="btn-secondary" onClick={() => setShowSlip(null)}>Close</button>
                    <button className="btn-primary" onClick={() => window.print()}>
                        <PrinterIcon size={16} /> Print
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="salary-book">
            <div className="salary-header">
                <h2>💰 Salary Book</h2>
                <div className="salary-controls">
                    <select
                        className="input-field"
                        value={selectedStaff}
                        onChange={(e) => setSelectedStaff(e.target.value)}
                    >
                        <option value="">Select Staff...</option>
                        {staffList.map(staff => (
                            <option key={staff.id} value={staff.id}>
                                {staff.data?.name || 'Unknown'} - {staff.data?.designation || 'No Designation'}
                            </option>
                        ))}
                    </select>

                    <select
                        className="input-field"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                    >
                        {getFinancialYears().map(fy => (
                            <option key={fy} value={fy}>FY {fy}</option>
                        ))}
                    </select>
                </div>
            </div>

            {!selectedStaff ? (
                <div className="empty-state">
                    <p>👆 Select a staff member to view/edit salary data</p>
                    <p className="hint">Add staff members from the HOI → Staff Info menu first</p>
                </div>
            ) : editMonth ? (
                /* Month Edit Form */
                <div className="month-edit-form">
                    <div className="form-header">
                        <h3>📝 {editMonth} {selectedYear}</h3>
                        <span className="staff-name">{activeStaff?.data?.name || 'Staff Member'}</span>
                    </div>

                    <div className="salary-grid">
                        <div className="salary-column">
                            <h4 className="column-title earnings">💚 Earnings</h4>
                            {SALARY_FIELDS.filter(f => !f.isDeduction).map(field => (
                                <div key={field.id} className="salary-field">
                                    <label>{field.label}</label>
                                    <div className="currency-input">
                                        <span className="currency-symbol">₹</span>
                                        <input
                                            type="number"
                                            value={monthData[field.id] || ''}
                                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                            placeholder="0"
                                            className="input-field"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="salary-column">
                            <h4 className="column-title deductions">❤️ Deductions</h4>
                            {SALARY_FIELDS.filter(f => f.isDeduction).map(field => (
                                <div key={field.id} className="salary-field">
                                    <label>{field.label}</label>
                                    <div className="currency-input">
                                        <span className="currency-symbol">₹</span>
                                        <input
                                            type="number"
                                            value={monthData[field.id] || ''}
                                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                            placeholder="0"
                                            className="input-field"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="salary-summary">
                        <div className="summary-item earnings">
                            <span>Total Earnings</span>
                            <span>₹{calculateTotals(monthData).earnings.toLocaleString()}</span>
                        </div>
                        <div className="summary-item deductions">
                            <span>Total Deductions</span>
                            <span>₹{calculateTotals(monthData).deductions.toLocaleString()}</span>
                        </div>
                        <div className="summary-item net">
                            <span>Net Salary</span>
                            <span>₹{calculateTotals(monthData).net.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="form-actions">
                        <button className="btn-secondary" onClick={() => setEditMonth(null)}>Cancel</button>
                        <button className="btn-accent" onClick={handleAutoFill} title="Copy this data to remaining empty months">
                            Auto-fill Remaining
                        </button>
                        <button className="btn-primary" onClick={handleSaveMonth} disabled={saving}>
                            <SaveIcon size={16} />
                            {saving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>
            ) : (
                /* Monthly Overview Table */
                <div className="salary-table-wrapper">
                    <table className="salary-table">
                        <thead>
                            <tr>
                                <th>Month</th>
                                <th>Earnings</th>
                                <th>Deductions</th>
                                <th>Net Salary</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {MONTHS.map(month => {
                                const data = (salaryData && salaryData[month]) || {};
                                const totals = calculateTotals(data);
                                const hasData = Object.keys(data).length > 0;

                                return (
                                    <tr key={month} className={hasData ? 'has-data' : ''}>
                                        <td className="month-name">{month}</td>
                                        <td className="amount earnings">
                                            {hasData ? `₹${totals.earnings.toLocaleString()}` : '-'}
                                        </td>
                                        <td className="amount deductions">
                                            {hasData ? `₹${totals.deductions.toLocaleString()}` : '-'}
                                        </td>
                                        <td className="amount net">
                                            {hasData ? `₹${totals.net.toLocaleString()}` : '-'}
                                        </td>
                                        <td className="actions">
                                            <button
                                                className="btn-icon-sm"
                                                onClick={() => handleEditMonth(month)}
                                                title="Edit"
                                            >
                                                <EditIcon size={16} />
                                            </button>
                                            {hasData && (
                                                <button
                                                    className="btn-icon-sm"
                                                    onClick={() => handlePrintSlip(month)}
                                                    title="Print Slip"
                                                >
                                                    <PrinterIcon size={16} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            <tr className="annual-total">
                                <td><strong>Annual Total</strong></td>
                                <td className="amount earnings">
                                    <strong>₹{MONTHS.reduce((sum, m) => sum + calculateTotals((salaryData && salaryData[m]) || {}).earnings, 0).toLocaleString()}</strong>
                                </td>
                                <td className="amount deductions">
                                    <strong>₹{MONTHS.reduce((sum, m) => sum + calculateTotals((salaryData && salaryData[m]) || {}).deductions, 0).toLocaleString()}</strong>
                                </td>
                                <td className="amount net">
                                    <strong>₹{MONTHS.reduce((sum, m) => sum + calculateTotals((salaryData && salaryData[m]) || {}).net, 0).toLocaleString()}</strong>
                                </td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}
        </div>
    );
}
