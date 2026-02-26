import React from 'react';
import { useUndo } from '../../contexts/UndoContext';
import { RotateCcwIcon, RotateCwIcon } from '../Icons/CustomIcons';
import './UndoRedoBar.css';

export default function UndoRedoBar() {
    const {
        canUndo,
        canRedo,
        undo,
        redo,
        lastAction,
        lastUndoneAction,
        historyCount
    } = useUndo();

    const handleUndo = async () => {
        try {
            const action = await undo();
            if (action) {
                // Show toast or notification
                console.log('Undone:', action.description);
            }
        } catch (error) {
            console.error('Undo failed:', error);
        }
    };

    const handleRedo = async () => {
        try {
            const action = await redo();
            if (action) {
                console.log('Redone:', action.description);
            }
        } catch (error) {
            console.error('Redo failed:', error);
        }
    };

    // Don't show if nothing to undo/redo
    if (!canUndo && !canRedo) {
        return null;
    }

    return (
        <div className="undo-redo-bar">
            <button
                className={`undo-btn ${canUndo ? 'active' : ''}`}
                onClick={handleUndo}
                disabled={!canUndo}
                title={lastAction ? `Undo: ${lastAction.description}` : 'Nothing to undo'}
            >
                <RotateCcwIcon size={18} />
                <span>Undo</span>
                {historyCount > 0 && <span className="count">{historyCount}</span>}
            </button>

            <button
                className={`redo-btn ${canRedo ? 'active' : ''}`}
                onClick={handleRedo}
                disabled={!canRedo}
                title={lastUndoneAction ? `Redo: ${lastUndoneAction.description}` : 'Nothing to redo'}
            >
                <RotateCwIcon size={18} />
                <span>Redo</span>
            </button>
        </div>
    );
}
