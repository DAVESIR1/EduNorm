import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import PrivacyPolicy from './components/Legal/PrivacyPolicy'
import TermsOfService from './components/Legal/TermsOfService'
import { UndoProvider } from './contexts/UndoContext'
import { MenuProvider } from './contexts/MenuContext'
import './styles/design-system.css'

// Error Boundary Component
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('App Error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                    fontFamily: 'system-ui, sans-serif',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white'
                }}>
                    <h1 style={{ marginBottom: '20px' }}>⚠️ Something went wrong</h1>
                    <p style={{ marginBottom: '20px', textAlign: 'center', maxWidth: '500px' }}>
                        The app encountered an error. This might be due to missing configuration.
                        Please try refreshing the page.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            padding: '12px 24px',
                            fontSize: '16px',
                            borderRadius: '8px',
                            border: 'none',
                            background: 'white',
                            color: '#667eea',
                            cursor: 'pointer',
                            fontWeight: '600'
                        }}
                    >
                        🔄 Refresh Page
                    </button>
                    <details style={{ marginTop: '30px', opacity: 0.7 }}>
                        <summary style={{ cursor: 'pointer' }}>Technical Details</summary>
                        <pre style={{
                            marginTop: '10px',
                            padding: '10px',
                            background: 'rgba(0,0,0,0.3)',
                            borderRadius: '8px',
                            fontSize: '12px',
                            overflow: 'auto',
                            maxWidth: '80vw'
                        }}>
                            {this.state.error?.toString()}
                        </pre>
                    </details>
                </div>
            );
        }

        return this.props.children;
    }
}

// Wrap app with error boundary and providers
ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ErrorBoundary>
            <BrowserRouter>
                <UndoProvider>
                    <MenuProvider>
                        <Routes>
                            <Route path="/" element={<App />} />
                            <Route path="/privacy" element={<PrivacyPolicy />} />
                            <Route path="/terms" element={<TermsOfService />} />
                        </Routes>
                    </MenuProvider>
                </UndoProvider>
            </BrowserRouter>
        </ErrorBoundary>
    </React.StrictMode>,
)
