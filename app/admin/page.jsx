// app/admin/page.jsx
'use client';
import { useState, useEffect } from 'react';
import html2canvas from 'html2canvas';

export default function AdminPage() {
    const shareConfessionAsImage = async (confessionId) => {
        const confessionElement = document.getElementById(`confession-${confessionId}`);
        if (!confessionElement) return;

        try {
            // Clone element into a new white background wrapper
            const wrapper = document.createElement('div');
            wrapper.style.backgroundColor = 'white';
            wrapper.style.padding = '20px';
            wrapper.style.display = 'inline-block'; // shrink wrap
            wrapper.appendChild(confessionElement.cloneNode(true));

            document.body.appendChild(wrapper); // required for rendering

            const canvas = await html2canvas(wrapper, {
                backgroundColor: null, // keeps white background we set
                useCORS: true, // in case of external images
                scale: 2, // for higher quality image
            });

            document.body.removeChild(wrapper); // clean up

            const image = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = image;
            link.download = `confession-${confessionId}.png`;
            link.click();
        } catch (error) {
            console.error('Image generation failed:', error);
            alert('Failed to create image. Please try again.');
        }
    };

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [archivedConfessions, setArchivedConfessions] = useState([]); // Fixed variable name
    const [loginForm, setLoginForm] = useState({ username: '', password: '' });
    const [loginError, setLoginError] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [confessions, setConfessions] = useState([]);
    const [stats, setStats] = useState({ total: 0, unread: 0, today: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all');
    const [currentView, setCurrentView] = useState('main'); // 'main' or 'archive'
    const [confessionSizes, setConfessionSizes] = useState({});

    const handleArchive = (id) => {
        const toArchive = confessions.find((conf) => conf._id === id);
        if (toArchive) {
            setArchivedConfessions(prev => [...prev, toArchive]);
            setConfessions(prev => prev.filter((conf) => conf._id !== id));
            setStats(prev => ({ 
                ...prev, 
                total: prev.total - 1,
                unread: toArchive.isRead ? prev.unread : prev.unread - 1
            }));
        }
    };

    const handleUnarchive = (id) => {
        const toUnarchive = archivedConfessions.find((conf) => conf._id === id);
        if (toUnarchive) {
            setConfessions(prev => [...prev, toUnarchive]);
            setArchivedConfessions(prev => prev.filter((conf) => conf._id !== id));
            setStats(prev => ({ 
                ...prev, 
                total: prev.total + 1,
                unread: toUnarchive.isRead ? prev.unread : prev.unread + 1
            }));
        }
    };

    // Check authentication status on component mount
    useEffect(() => {
        checkAuthStatus();
    }, []);

    // Fetch data when authenticated
    useEffect(() => {
        if (isAuthenticated) {
            fetchConfessions();
            fetchStats();
        }
    }, [isAuthenticated]);

    const checkAuthStatus = async () => {
        try {
            const response = await fetch('/api/admin/auth/verify', {
                method: 'GET',
                credentials: 'include', // Include cookies
            });

            if (response.ok) {
                setIsAuthenticated(true);
            }
        } catch (error) {
            console.error('Auth check failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const updateConfessionSize = (confessionId, dimension, value) => {
        setConfessionSizes(prev => ({
            ...prev,
            [confessionId]: {
                width: 300,
                height: 300,
                ...prev[confessionId],
                [dimension]: parseInt(value) || (dimension === 'width' ? 300 : 300)
            }
        }));
    };

    const getConfessionSize = (confessionId) => {
        return confessionSizes[confessionId] || { width: 400, height: 200 };
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginError('');
        setIsLoggingIn(true);

        try {
            const response = await fetch('/api/admin/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // Include cookies
                body: JSON.stringify({
                    username: loginForm.username,
                    password: loginForm.password,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setIsAuthenticated(true);
                setLoginForm({ username: '', password: '' });
            } else {
                setLoginError(data.error || 'Login failed');
            }
        } catch (error) {
            setLoginError('Network error. Please try again.');
        } finally {
            setIsLoggingIn(false);
        }
    };

    const handleLogout = async () => {
        try {
            await fetch('/api/admin/auth/logout', {
                method: 'POST',
                credentials: 'include',
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setIsAuthenticated(false);
            setLoginForm({ username: '', password: '' });
        }
    };

    const fetchConfessions = async () => {
        try {
            const response = await fetch('/api/admin/confessions', {
                credentials: 'include',
            });
            const data = await response.json();

            if (response.ok) {
                setConfessions(data);
            } else if (response.status === 401) {
                setIsAuthenticated(false);
            } else {
                setError(data.error || 'Failed to fetch confessions');
            }
        } catch (error) {
            setError('Network error');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await fetch('/api/admin/stats', {
                credentials: 'include',
            });
            const data = await response.json();

            if (response.ok) {
                setStats(data);
            } else if (response.status === 401) {
                setIsAuthenticated(false);
            }
        } catch (error) {
            console.error('Failed to fetch stats');
        }
    };

    const markAsRead = async (id) => {
        try {
            const response = await fetch(`/api/admin/confessions/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ isRead: true }),
            });

            if (response.ok) {
                setConfessions(prev =>
                    prev.map(conf =>
                        conf._id === id ? { ...conf, isRead: true } : conf
                    )
                );
                setStats(prev => ({ ...prev, unread: prev.unread - 1 }));
            } else if (response.status === 401) {
                setIsAuthenticated(false);
            }
        } catch (error) {
            console.error('Failed to mark as read');
        }
    };

    const deleteConfession = async (id, isArchived = false) => {
        if (!confirm('Are you sure you want to delete this confession?')) return;

        try {
            const response = await fetch(`/api/admin/confessions/${id}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (response.ok) {
                if (isArchived) {
                    setArchivedConfessions(prev => prev.filter(conf => conf._id !== id));
                } else {
                    setConfessions(prev => prev.filter(conf => conf._id !== id));
                    setStats(prev => ({ ...prev, total: prev.total - 1 }));
                }
            } else if (response.status === 401) {
                setIsAuthenticated(false);
            }
        } catch (error) {
            console.error('Failed to delete confession');
        }
    };

    const banUser = async (ipAddress) => {
        if (!ipAddress) {
            alert("IP address missing, can't ban user.");
            return;
        }

        if (!confirm(`Are you sure you want to ban IP: ${ipAddress} and delete their confessions?`)) return;

        try {
            // Ban the IP
            const banResponse = await fetch('/api/admin/ban', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ ip: ipAddress }),
            });

            const banData = await banResponse.json();

            if (!banResponse.ok) {
                if (banResponse.status === 401) {
                    setIsAuthenticated(false);
                    return;
                }
                alert(`Failed to ban IP: ${banData.error || 'Unknown error'}`);
                return;
            }

            // Delete all confessions from that IP
            const delResponse = await fetch('/api/admin/confessions/by-ip', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ ip: ipAddress }),
            });

            const delData = await delResponse.json();

            if (!delResponse.ok) {
                alert(`Failed to delete confessions: ${delData.error || 'Unknown error'}`);
                return;
            }

            alert(`IP ${ipAddress} banned and ${delData.deletedCount} confession(s) deleted successfully.`);

            // Refresh the confessions list to reflect deletions
            fetchConfessions();

        } catch (error) {
            alert('Network error: Failed to ban IP or delete confessions.');
        }
    };

    const filteredConfessions = confessions.filter(confession => {
        if (filter === 'unread') return !confession.isRead;
        if (filter === 'read') return confession.isRead;
        return true;
    });

    const renderConfessionCard = (confession, isArchived = false) => {
        const currentSize = getConfessionSize(confession._id);
        return (
            <div
                key={confession._id}
                style={{
                    width: `${currentSize.width}px`,
                    margin: '0 auto 30px auto',
                    position: 'relative',
                }}
            >
                {/* Size Controls for individual confession */}
                <div style={{
                    marginBottom: '10px',
                    padding: '10px',
                    background: '#f8f9fa',
                    borderRadius: '6px',
                    border: '1px solid #e9ecef',
                    display: 'flex',
                    gap: '15px',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    fontSize: '12px'
                }}>
                    <span style={{ fontWeight: '500', color: '#666' }}>
                        Size Controls:
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <label style={{ color: '#555' }}>W:</label>
                        <input
                            type="number"
                            min="200"
                            max="800"
                            value={currentSize.width}
                            onChange={(e) => updateConfessionSize(confession._id, 'width', e.target.value)}
                            style={{
                                width: '60px',
                                padding: '4px',
                                border: '1px solid #ddd',
                                borderRadius: '3px',
                                fontSize: '11px'
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <label style={{ color: '#555' }}>H:</label>
                        <input
                            type="number"
                            min="150"
                            max="600"
                            value={currentSize.height}
                            onChange={(e) => updateConfessionSize(confession._id, 'height', e.target.value)}
                            style={{
                                width: '60px',
                                padding: '4px',
                                border: '1px solid #ddd',
                                borderRadius: '3px',
                                fontSize: '11px'
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '5px' }}>
                        <button
                            onClick={() => setConfessionSizes(prev => ({
                                ...prev,
                                [confession._id]: { width: 350, height: 250 }
                            }))}
                            style={{
                                background: '#6c757d',
                                color: 'white',
                                border: 'none',
                                padding: '4px 8px',
                                borderRadius: '3px',
                                fontSize: '10px',
                                cursor: 'pointer'
                            }}
                        >
                            Reset
                        </button>
                        <button
                            onClick={() => setConfessionSizes(prev => ({
                                ...prev,
                                [confession._id]: { width: 300, height: 150 }
                            }))}
                            style={{
                                background: '#28a745',
                                color: 'white',
                                border: 'none',
                                padding: '4px 8px',
                                borderRadius: '3px',
                                fontSize: '10px',
                                cursor: 'pointer'
                            }}
                        >
                            Small
                        </button>
                        <button
                            onClick={() => setConfessionSizes(prev => ({
                                ...prev,
                                [confession._id]: { width: 600, height: 300 }
                            }))}
                            style={{
                                background: '#dc3545',
                                color: 'white',
                                border: 'none',
                                padding: '4px 8px',
                                borderRadius: '3px',
                                fontSize: '10px',
                                cursor: 'pointer'
                            }}
                        >
                            Large
                        </button>

                        <button
                            onClick={() => setConfessionSizes(prev => ({
                                ...prev,
                                [confession._id]: { width: 400, height: 200 }
                            }))}
                            style={{
                                background: '#dc3545',
                                color: 'white',
                                border: 'none',
                                padding: '4px 8px',
                                borderRadius: '3px',
                                fontSize: '10px',
                                cursor: 'pointer'
                            }}
                        >
                            Mid
                        </button>
                    </div>
                </div>
                
                {/* Confession Box */}
                <div
                    className="card"
                    id={`confession-${confession._id}`}
                    style={{
                        border: confession.isRead ? 'none' : '2px solid #ff6b6b',
                        opacity: confession.isRead ? 0.8 : 1,
                        borderRadius: '12px',
                        padding: '20px',
                        backgroundColor: isArchived ? '#f8f9fa' : 'white',
                        color: '#333',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        position: 'relative',
                        resize: 'both',
                        overflow: 'auto',
                        minWidth: '250px',
                        minHeight: '100px',
                        maxWidth: '100%',
                        width: `${currentSize.width}px`,
                        height: `${currentSize.height}px`,
                        boxSizing: 'border-box',
                    }}
                >
                    {/* Header: Anonymous + Date */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '14px',
                        color: '#888',
                        flexShrink: 0
                    }}>
                        <span>Anonymous</span>
                        <span>{new Date(confession.createdAt).toLocaleDateString()}</span>
                    </div>

                    {/* Confession Text */}
                    <div style={{
                        fontWeight: 'bold',
                        fontSize: '16px',
                        lineHeight: '1.6',
                        flex: 1,
                        overflow: 'auto',
                        fontFamily: '"Roboto", monospace'
                    }}>
                        {confession.content}
                    </div>
                    
                    <div style={{
                        color: '#007bff',
                        fontSize: '12px',
                        position: 'absolute',
                        bottom: '10px',
                        left: '20px',
                        fontWeight: '600',
                        opacity: 0.8,
                        pointerEvents: 'none',
                        fontFamily: '"Roboto", monospace'
                    }}>
                        GSS Confession
                    </div>
                    
                    {isArchived && (
                        <div style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            background: '#ffc107',
                            color: '#212529',
                            padding: '2px 6px',
                            borderRadius: '3px',
                            fontSize: '10px',
                            fontWeight: 'bold'
                        }}>
                            ARCHIVED
                        </div>
                    )}
                </div>

                {/* Buttons outside the box */}
                <div style={{
                    display: 'flex',
                    gap: '10px',
                    justifyContent: 'flex-end',
                    marginTop: '8px'
                }}>
                    {!confession.isRead && !isArchived && (
                        <button
                            onClick={() => markAsRead(confession._id)}
                            style={{
                                background: '#34c759',
                                color: 'white',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                cursor: 'pointer'
                            }}
                        >
                            Mark as Read
                        </button>
                    )}
                    
                    <button
                        onClick={() => shareConfessionAsImage(confession._id)}
                        style={{
                            background: '#007aff',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            cursor: 'pointer'
                        }}
                    >
                        Save as Image
                    </button>

                    {isArchived ? (
                        <button
                            onClick={() => handleUnarchive(confession._id)}
                            style={{
                                background: '#28a745',
                                color: 'white',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                cursor: 'pointer'
                            }}
                        >
                            Unarchive
                        </button>
                    ) : (
                        <button
                            onClick={() => handleArchive(confession._id)}
                            style={{
                                background: '#ffc107',
                                color: '#212529',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                cursor: 'pointer'
                            }}
                        >
                            Archive
                        </button>
                    )}

                    <button
                        onClick={() => deleteConfession(confession._id, isArchived)}
                        style={{
                            background: '#ff3b30',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            cursor: 'pointer'
                        }}
                    >
                        Delete
                    </button>

                    {/* Ban User Button - only show for non-archived */}
                    {!isArchived && (
                        <button
                            onClick={() => banUser(confession.ipAddress)}
                            style={{
                                background: '#ff9500',
                                color: 'white',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                cursor: 'pointer'
                            }}
                        >
                            Ban User
                        </button>
                    )}
                </div>
            </div>
        );
    };

    // Login Form
    if (!isAuthenticated) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}>
                <div style={{
                    background: 'white',
                    padding: '40px',
                    borderRadius: '12px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                    width: '100%',
                    maxWidth: '400px',
                    margin: '20px'
                }}>
                    <h1 style={{
                        textAlign: 'center',
                        marginBottom: '30px',
                        color: '#333',
                        fontSize: '24px'
                    }}>
                        Admin Login
                    </h1>

                    <form onSubmit={handleLogin}>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                color: '#555',
                                fontWeight: '500'
                            }}>
                                Username
                            </label>
                            <input
                                type="text"
                                value={loginForm.username}
                                onChange={(e) => setLoginForm(prev => ({
                                    ...prev,
                                    username: e.target.value
                                }))}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    border: '2px solid #ddd',
                                    borderRadius: '8px',
                                    fontSize: '16px',
                                    boxSizing: 'border-box',
                                    transition: 'border-color 0.3s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                                onBlur={(e) => e.target.style.borderColor = '#ddd'}
                                required
                                disabled={isLoggingIn}
                            />
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                color: '#555',
                                fontWeight: '500'
                            }}>
                                Password
                            </label>
                            <input
                                type="password"
                                value={loginForm.password}
                                onChange={(e) => setLoginForm(prev => ({
                                    ...prev,
                                    password: e.target.value
                                }))}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    border: '2px solid #ddd',
                                    borderRadius: '8px',
                                    fontSize: '16px',
                                    boxSizing: 'border-box',
                                    transition: 'border-color 0.3s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                                onBlur={(e) => e.target.style.borderColor = '#ddd'}
                                required
                                disabled={isLoggingIn}
                            />
                        </div>

                        {loginError && (
                            <div style={{
                                background: '#fee',
                                color: '#c33',
                                padding: '10px',
                                borderRadius: '6px',
                                marginBottom: '20px',
                                textAlign: 'center',
                                fontSize: '14px'
                            }}>
                                {loginError}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoggingIn}
                            style={{
                                width: '100%',
                                padding: '12px',
                                background: isLoggingIn
                                    ? '#ccc'
                                    : 'linear-gradient(135deg, #667eea, #764ba2)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '16px',
                                fontWeight: '600',
                                cursor: isLoggingIn ? 'not-allowed' : 'pointer',
                                transition: 'transform 0.2s',
                                opacity: isLoggingIn ? 0.7 : 1
                            }}
                            onMouseDown={(e) => !isLoggingIn && (e.target.style.transform = 'scale(0.98)')}
                            onMouseUp={(e) => !isLoggingIn && (e.target.style.transform = 'scale(1)')}
                            onMouseLeave={(e) => !isLoggingIn && (e.target.style.transform = 'scale(1)')}
                        >
                            {isLoggingIn ? 'Logging in...' : 'Login'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // Loading state
    if (isLoading) {
        return <div className="loading">Loading admin panel...</div>;
    }

    // Main Admin Dashboard (after login)
    return (
        <div style={{ minHeight: '100vh', paddingBottom: '40px' }}>
            <div className="admin-header">
                <div className="container">
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '20px'
                    }}>
                        <h1 style={{
                            fontSize: '2.5rem',
                            color: 'white',
                            textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                            margin: 0
                        }}>
                            Admin Dashboard
                        </h1>
                        <button
                            onClick={handleLogout}
                            style={{
                                background: 'rgba(255,255,255,0.2)',
                                color: 'white',
                                border: '1px solid rgba(255,255,255,0.3)',
                                padding: '8px 16px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                transition: 'all 0.3s'
                            }}
                            onMouseOver={(e) => {
                                e.target.style.background = 'rgba(255,255,255,0.3)';
                            }}
                            onMouseOut={(e) => {
                                e.target.style.background = 'rgba(255,255,255,0.2)';
                            }}
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            <div className="container">
                {error && <div className="error">{error}</div>}

                {/* View Toggle Buttons */}
                <div style={{ marginBottom: '30px' }}>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
                        <button
                            className={`btn ${currentView === 'main' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setCurrentView('main')}
                            style={{
                                background: currentView === 'main' ? '#007bff' : '#6c757d',
                                color: 'white',
                                border: 'none',
                                padding: '10px 20px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            Main Confessions ({confessions.length})
                        </button>
                        <button
                            className={`btn ${currentView === 'archive' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setCurrentView('archive')}
                            style={{
                                background: currentView === 'archive' ? '#007bff' : '#6c757d',
                                color: 'white',
                                border: 'none',
                                padding: '10px 20px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            Archive ({archivedConfessions.length})
                        </button>
                    </div>
                </div>

                {currentView === 'main' && (
                    <>
                        <div className="admin-stats">
                            <div className="stat-card">
                                <div className="stat-number">{stats.total}</div>
                                <div className="stat-label">Total Confessions</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-number">{stats.unread}</div>
                                <div className="stat-label">Unread</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-number">{stats.today}</div>
                                <div className="stat-label">Today</div>
                            </div>
                        </div>

                        <div style={{ marginBottom: '30px' }}>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                <button
                                    className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => setFilter('all')}
                                    style={{
                                        background: filter === 'all' ? '#007bff' : '#6c757d',
                                        color: 'white',
                                        border: 'none',
                                        padding: '8px 16px',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '14px'
                                    }}
                                >
                                    All ({confessions.length})
                                </button>
                                <button
                                    className={`btn ${filter === 'unread' ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => setFilter('unread')}
                                    style={{
                                        background: filter === 'unread' ? '#007bff' : '#6c757d',
                                        color: 'white',
                                        border: 'none',
                                        padding: '8px 16px',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '14px'
                                    }}
                                >
                                    Unread ({confessions.filter(c => !c.isRead).length})
                                </button>
                                <button
                                    className={`btn ${filter === 'read' ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => setFilter('read')}
                                    style={{
                                        background: filter === 'read' ? '#007bff' : '#6c757d',
                                        color: 'white',
                                        border: 'none',
                                        padding: '8px 16px',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '14px'
                                    }}
                                >
                                    Read ({confessions.filter(c => c.isRead).length})
                                </button>
                            </div>
                        </div>

                        <div>
                            {filteredConfessions.length === 0 ? (
                                <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                                    <p style={{ color: '#666', fontSize: '18px' }}>
                                        {filter === 'all' ? 'No confessions yet' : `No ${filter} confessions`}
                                    </p>
                                </div>
                            ) : (
                                filteredConfessions.map((confession) => renderConfessionCard(confession, false))
                            )}
                        </div>
                    </>
                )}

                {currentView === 'archive' && (
                    <div>
                        <h2 style={{ 
                            color: '#333', 
                            marginBottom: '20px',
                            fontSize: '1.5rem'
                        }}>
                            Archived Confessions
                        </h2>
                        {archivedConfessions.length === 0 ? (
                            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                                <p style={{ color: '#666', fontSize: '18px' }}>
                                    No archived confessions yet
                                </p>
                            </div>
                        ) : (
                            archivedConfessions.map((confession) => renderConfessionCard(confession, true))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}