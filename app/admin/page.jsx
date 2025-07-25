// app/admin/page.jsx
'use client';
import { useState, useEffect } from 'react';

export default function AdminPage() {
    const [confessions, setConfessions] = useState([]);
    const [stats, setStats] = useState({ total: 0, unread: 0, today: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchConfessions();
        fetchStats();
    }, []);

    const fetchConfessions = async () => {
        try {
            const response = await fetch('/api/admin/confessions');
            const data = await response.json();

            if (response.ok) {
                setConfessions(data);
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
            const response = await fetch('/api/admin/stats');
            const data = await response.json();

            if (response.ok) {
                setStats(data);
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
                body: JSON.stringify({ isRead: true }),
            });

            if (response.ok) {
                setConfessions(prev =>
                    prev.map(conf =>
                        conf._id === id ? { ...conf, isRead: true } : conf
                    )
                );
                setStats(prev => ({ ...prev, unread: prev.unread - 1 }));
            }
        } catch (error) {
            console.error('Failed to mark as read');
        }
    };

    const deleteConfession = async (id) => {
        if (!confirm('Are you sure you want to delete this confession?')) return;

        try {
            const response = await fetch(`/api/admin/confessions/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setConfessions(prev => prev.filter(conf => conf._id !== id));
                setStats(prev => ({ ...prev, total: prev.total - 1 }));
            }
        } catch (error) {
            console.error('Failed to delete confession');
        }
    };

    const filteredConfessions = confessions.filter(confession => {
        if (filter === 'unread') return !confession.isRead;
        if (filter === 'read') return confession.isRead;
        return true;
    });

    if (isLoading) {
        return <div className="loading">Loading admin panel...</div>;
    }

    return (
        <div style={{ minHeight: '100vh', paddingBottom: '40px' }}>
            <div className="admin-header">
                <div className="container">
                    <h1 style={{
                        fontSize: '2.5rem',
                        color: 'white',
                        textAlign: 'center',
                        textShadow: '0 2px 10px rgba(0,0,0,0.3)'
                    }}>
                        Admin Dashboard
                    </h1>
                </div>
            </div>

            <div className="container">
                {error && <div className="error">{error}</div>}

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
                        >
                            All ({confessions.length})
                        </button>
                        <button
                            className={`btn ${filter === 'unread' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setFilter('unread')}
                        >
                            Unread ({confessions.filter(c => !c.isRead).length})
                        </button>
                        <button
                            className={`btn ${filter === 'read' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setFilter('read')}
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
                        filteredConfessions.map((confession) => (
                            <div
                                key={confession._id}
                                style={{
                                    maxWidth: '600px',
                                    margin: '0 auto 30px auto',  // margin bottom for spacing
                                    position: 'relative',
                                }}
                            >
                                {/* Confession Box */}
                                <div
                                    className="card"
                                    style={{
                                        border: confession.isRead ? 'none' : '2px solid #ff6b6b',
                                        opacity: confession.isRead ? 0.8 : 1,
                                        borderRadius: '12px',
                                        padding: '20px',
                                        backgroundColor: 'white',
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
                                        padding: '20px 40px 40px 20px',  // extra padding bottom-right for handle space
                                        boxSizing: 'border-box',

                                     
                                    }}
                                >
                                    {/* Header: Anonymous + Date */}
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        fontSize: '14px',
                                        color: '#888'
                                    }}>
                                        <span>Anonymous</span>
                                        <span>{new Date(confession.createdAt).toLocaleDateString()}</span>
                                    </div>

                                    {/* Confession Text */}
                                    <div style={{
                                        fontWeight: 'bold',
                                        fontSize: '16px',
                                        lineHeight: '1.6'
                                    }}>
                                        {confession.content}
                                    </div>
                                </div>

                                {/* Buttons outside the box */}
                                <div style={{
                                    display: 'flex',
                                    gap: '10px',
                                    justifyContent: 'flex-end',
                                    marginTop: '8px'
                                }}>
                                    {!confession.isRead && (
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
                                        onClick={() => deleteConfession(confession._id)}
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

                                    {/* Ban User Button */}
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
                                </div>
                            </div>
                        ))

                    )}
                </div>
                
            </div>
        </div>
    );
}