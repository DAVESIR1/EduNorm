import React from 'react';

/**
 * Component-level Error Boundary
 * Catches errors in child components and shows a friendly fallback
 * instead of crashing the entire app
 */
class ComponentErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ errorInfo });
        console.error(`[${this.props.componentName || 'Component'}] Error:`, error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: '40px 20px',
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, rgba(255,107,107,0.1), rgba(255,154,158,0.1))',
                    borderRadius: '16px',
                    border: '1px solid rgba(255,107,107,0.2)',
                    margin: '20px',
                    minHeight: '200px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px'
                }}>
                    <div style={{ fontSize: '48px' }}>😥</div>
                    <h3 style={{
                        color: '#e74c3c',
                        margin: 0,
                        fontSize: '18px',
                        fontWeight: 600
                    }}>
                        {this.props.componentName || 'This section'} encountered an issue
                    </h3>
                    <p style={{
                        color: '#888',
                        margin: 0,
                        fontSize: '14px',
                        maxWidth: '400px'
                    }}>
                        Don't worry, your data is safe. Try clicking the button below to reload this section.
                    </p>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                        <button
                            onClick={this.handleRetry}
                            style={{
                                padding: '10px 24px',
                                borderRadius: '8px',
                                border: 'none',
                                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                                color: 'white',
                                cursor: 'pointer',
                                fontWeight: 600,
                                fontSize: '14px'
                            }}
                        >
                            🔄 Try Again
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            style={{
                                padding: '10px 24px',
                                borderRadius: '8px',
                                border: '1px solid #ddd',
                                background: 'transparent',
                                color: '#666',
                                cursor: 'pointer',
                                fontWeight: 500,
                                fontSize: '14px'
                            }}
                        >
                            Refresh Page
                        </button>
                    </div>
                    <details style={{ marginTop: '16px', opacity: 0.5, fontSize: '12px' }}>
                        <summary style={{ cursor: 'pointer' }}>Technical Details</summary>
                        <pre style={{
                            marginTop: '8px',
                            padding: '8px',
                            background: 'rgba(0,0,0,0.05)',
                            borderRadius: '6px',
                            fontSize: '11px',
                            textAlign: 'left',
                            overflow: 'auto',
                            maxWidth: '500px',
                            maxHeight: '150px'
                        }}>
                            {this.state.error?.toString()}
                            {'\n\n'}
                            {this.state.errorInfo?.componentStack}
                        </pre>
                    </details>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ComponentErrorBoundary;
