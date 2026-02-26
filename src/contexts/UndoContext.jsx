import React, { createContext, useContext, useState, useCallback } from 'react';

const UndoContext = createContext(null);

// Maximum number of actions to keep in history
const MAX_HISTORY = 20;

export function UndoProvider({ children }) {
    const [history, setHistory] = useState([]);
    const [redoStack, setRedoStack] = useState([]);

    // Record an action that can be undone
    const recordAction = useCallback((action) => {
        /*
         * action = {
         *   type: 'UPDATE_STUDENT' | 'DELETE_STUDENT' | 'ADD_STUDENT' | 'UPDATE_FIELD' | etc.,
         *   description: 'Changed student name',
         *   undo: async () => { ... }, // Function to reverse the action
         *   redo: async () => { ... }, // Function to redo the action
         *   timestamp: Date.now()
         * }
         */
        const actionWithTime = {
            ...action,
            timestamp: Date.now(),
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        };

        setHistory(prev => {
            const newHistory = [...prev, actionWithTime];
            // Keep only last MAX_HISTORY actions
            if (newHistory.length > MAX_HISTORY) {
                return newHistory.slice(-MAX_HISTORY);
            }
            return newHistory;
        });

        // Clear redo stack when new action is recorded
        setRedoStack([]);

        console.log('UndoContext: Recorded action:', action.description);
    }, []);

    // Undo the last action
    const undo = useCallback(async () => {
        if (history.length === 0) {
            console.log('UndoContext: Nothing to undo');
            return null;
        }

        const lastAction = history[history.length - 1];

        try {
            console.log('UndoContext: Undoing:', lastAction.description);
            await lastAction.undo();

            // Move action to redo stack
            setRedoStack(prev => [...prev, lastAction]);
            setHistory(prev => prev.slice(0, -1));

            return lastAction;
        } catch (error) {
            console.error('UndoContext: Undo failed:', error);
            throw error;
        }
    }, [history]);

    // Redo the last undone action
    const redo = useCallback(async () => {
        if (redoStack.length === 0) {
            console.log('UndoContext: Nothing to redo');
            return null;
        }

        const lastUndone = redoStack[redoStack.length - 1];

        try {
            console.log('UndoContext: Redoing:', lastUndone.description);
            await lastUndone.redo();

            // Move action back to history
            setHistory(prev => [...prev, lastUndone]);
            setRedoStack(prev => prev.slice(0, -1));

            return lastUndone;
        } catch (error) {
            console.error('UndoContext: Redo failed:', error);
            throw error;
        }
    }, [redoStack]);

    // Clear all history
    const clearHistory = useCallback(() => {
        setHistory([]);
        setRedoStack([]);
        console.log('UndoContext: History cleared');
    }, []);

    // Get current state
    const canUndo = history.length > 0;
    const canRedo = redoStack.length > 0;
    const lastAction = history[history.length - 1] || null;
    const lastUndoneAction = redoStack[redoStack.length - 1] || null;

    return (
        <UndoContext.Provider value={{
            recordAction,
            undo,
            redo,
            clearHistory,
            canUndo,
            canRedo,
            history,
            redoStack,
            lastAction,
            lastUndoneAction,
            historyCount: history.length,
            redoCount: redoStack.length
        }}>
            {children}
        </UndoContext.Provider>
    );
}

export function useUndo() {
    const context = useContext(UndoContext);
    if (!context) {
        throw new Error('useUndo must be used within an UndoProvider');
    }
    return context;
}

export default UndoContext;
