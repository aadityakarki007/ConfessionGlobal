// app/admin/page.jsx
'use client';
'use client';
import { useState, useEffect } from 'react';
import { useUser, useAuth, SignIn } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { toPng } from 'html-to-image';
import { decodeHtmlEntities } from '@/utils/htmlDecoder';


export default function AdminPage() {

    const shareConfessionAsImage = async (confessionId) => {
    const confessionElement = document.getElementById(`confession-${confessionId}`);
    if (!confessionElement) return;

    const wrapper = document.createElement('div');
    wrapper.style.display = 'inline-block';
    wrapper.style.padding = '20px';
    wrapper.style.backgroundColor = '#ffffff';
    wrapper.style.boxSizing = 'border-box';
    wrapper.style.borderRadius = '24px';
    wrapper.style.position = 'relative';

    const clone = confessionElement.cloneNode(true);
    if (clone instanceof HTMLElement) {
        clone.id = '';
        clone.style.margin = '0';
    }
    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);

    try {
        const dataUrl = await toPng(wrapper, {
            backgroundColor: '#ffffff',
            quality: 1,
            pixelRatio: 2,
        });

        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `confession-${confessionId}.png`;
        link.click();
    } catch (error) {
        console.error('Image generation failed:', error);
        alert('Image generation failed. Please try again.');
    } finally {
        document.body.removeChild(wrapper);
    }
};

    // Parse User Agent to extract device info
    const parseUserAgent = (userAgent) => {
        if (!userAgent) return null;

        let browser = 'Unknown';
        let os = 'Unknown';
        let deviceType = 'Unknown';

        // Browser detection
        if (userAgent.includes('Chrome') && !userAgent.includes('Chromium')) browser = 'Chrome';
        else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
        else if (userAgent.includes('Firefox')) browser = 'Firefox';
        else if (userAgent.includes('Edge')) browser = 'Edge';
        else if (userAgent.includes('Opera') || userAgent.includes('OPR')) browser = 'Opera';

        // OS detection
        if (userAgent.includes('Windows')) os = 'Windows';
        else if (userAgent.includes('Mac')) os = 'macOS';
        else if (userAgent.includes('Linux')) os = 'Linux';
        else if (userAgent.includes('Android')) os = 'Android';
        else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';

        // Device Type detection
        if (userAgent.includes('Mobile') || userAgent.includes('Android')) deviceType = 'Mobile';
        else if (userAgent.includes('iPad') || userAgent.includes('Tablet')) deviceType = 'Tablet';
        else deviceType = 'Desktop';

        return { browser, os, deviceType };
    };

    // ADD THESE LINES
    const { isLoaded, isSignedIn, user } = useUser();
    const { signOut } = useAuth();
    const router = useRouter();

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [archivedConfessions, setArchivedConfessions] = useState([]);
    const [loginForm, setLoginForm] = useState({ username: '', password: '' });
    const [loginError, setLoginError] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [confessions, setConfessions] = useState([]);
    const [stats, setStats] = useState({ total: 0, unread: 0, today: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all');
    const [currentView, setCurrentView] = useState('main');

    const [confessionSizes, setConfessionSizes] = useState({});
    const [selectedConfessionInfo, setSelectedConfessionInfo] = useState(null);

    const userRoles = user?.publicMetadata?.roles || [];
    const hasConfessRole = userRoles.includes('confess');
    const hasNoConfessRole = userRoles.includes('noconfess');
    const isReadOnly = hasNoConfessRole;

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
    useEffect(() => {
        if (isLoaded && isSignedIn && user) {
            const userRoles = user.publicMetadata?.roles || [];
            if (!userRoles.includes('confess') && !userRoles.includes('noconfess')) {
                console.log('Access denied - no matching Clerk role');
            }
        }
    }, [isLoaded, isSignedIn, user, router]);


    useEffect(() => {
        if (isLoaded && isSignedIn && user) {
            const userRoles = user.publicMetadata?.roles || [];
            if (!userRoles.includes('confess') && !userRoles.includes('noconfess')) {
                router.push('/');
                return;
            }
        }
    }, [isLoaded, isSignedIn, user, router]);

    useEffect(() => {
        checkAuthStatus();
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            fetchConfessions();
            if (hasConfessRole) {
                fetchStats();
            }
        }
    }, [isAuthenticated, hasConfessRole]);

    const checkAuthStatus = async () => {
        try {
            const response = await fetch('/api/admin/auth/verify', {
                method: 'GET',
                credentials: 'include',
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
                credentials: 'include',
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
            // Decode entities for display (if not done server-side)
            const decodedData = data.map(confession => ({
                ...confession,
                content: decodeHtmlEntities(confession.content)
            }));
            setConfessions(decodedData);
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

   const banUser = async (confession) => {
    if (!confession) {
        alert("Confession data missing, can't ban user.");
        return;
    }

    const ipAddress = confession.ipAddress;
    
    // Count how many identifiers we have
    const identifierCount = [
        ipAddress,
        confession.fingerprint,
        confession.trackingId,
        confession.localStorageId
    ].filter(Boolean).length;

    const confirmMessage = `⚠️ BAN THIS USER?\n\n` +
        `This will ban across ${identifierCount} identifier(s):\n` +
        `• IP: ${ipAddress}\n` +
        `${confession.fingerprint ? '• Browser Fingerprint: ✓\n' : '• Browser Fingerprint: ✗\n'}` +
        `${confession.trackingId ? '• Cookie Tracking: ✓\n' : '• Cookie Tracking: ✗\n'}` +
        `${confession.localStorageId ? '• LocalStorage: ✓\n' : '• LocalStorage: ✗\n'}` +
        `\nEven if they use VPN (change IP), they'll still be blocked!\n\n` +
        `This will also delete ALL their confessions.`;

    if (!confirm(confirmMessage)) return;

    try {
        // Ban with all identifiers
        const banResponse = await fetch('/api/admin/ban', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ 
                confessionId: confession._id,
                reason: 'Spam/Abuse',
                notes: `Banned from admin panel - ${identifierCount} identifiers blocked`
            }),
        });

        const banData = await banResponse.json();

        if (!banResponse.ok) {
            if (banResponse.status === 401) {
                setIsAuthenticated(false);
                return;
            }
            alert(`Failed to ban user: ${banData.error || 'Unknown error'}`);
            return;
        }

        // Delete confessions by IP (your existing deletion)
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

        alert(`✅ SUCCESS!\n\n` +
              `User banned across ${identifierCount} identifier(s)\n` +
              `${delData.deletedCount} confession(s) deleted\n\n` +
              `Protection Level: ${banData.banned?.hasFingerprint ? '🟢' : '⚪'} Fingerprint | ` +
              `${banData.banned?.hasTrackingId ? '🟢' : '⚪'} Cookie | ` +
              `${banData.banned?.hasLocalStorageId ? '🟢' : '⚪'} LocalStorage`);
        
        fetchConfessions();
        fetchStats();

    } catch (error) {
        alert('Network error: Failed to ban user or delete confessions.');
    }
};
    const sortedConfessions = [...confessions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const visibleConfessions = isReadOnly
        ? [
            ...sortedConfessions.filter(confession => !confession.isRead),
            ...sortedConfessions.filter(confession => confession.isRead).slice(0, 50)
          ]
        : sortedConfessions.filter(confession => {
            const isRead = confession.isRead === true;
            if (filter === 'unread') return !isRead;
            if (filter === 'read') return isRead;
            return true;
        });





  const renderConfessionCard = (confession, isArchived = false, readonly = false) => {
    const currentSize = getConfessionSize(confession._id);

    // ✅ Only ONE definition, no duplicate
    const handleResizeMouseDown = (e) => {
        e.preventDefault();
        const startX = e.clientX;
        const startY = e.clientY;
        const startW = currentSize.width;
        const startH = currentSize.height;

        const onMouseMove = (moveEvent) => {
            const newW = Math.min(800, Math.max(250, startW + (moveEvent.clientX - startX)));
            const newH = Math.min(900, Math.max(120, startH + (moveEvent.clientY - startY)));
            setConfessionSizes(prev => ({
                ...prev,
                [confession._id]: { width: Math.round(newW), height: Math.round(newH) }
            }));
        };

        const onMouseUp = () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    };

    return (
        <div
            key={confession._id}
            style={{
                width: `${currentSize.width}px`,
                margin: '0 auto 30px auto',
                position: 'relative',
            }}
        >
            {/* Size Controls */}
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
                fontSize: '12px',
                width: '100%',
                maxWidth: '100%'
            }}>
                <span style={{ fontWeight: '500', color: '#666' }}>Size Controls:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <label style={{ color: '#555' }}>W:</label>
                    <input
                        type="number" min="200" max="800"
                        value={currentSize.width}
                        onChange={(e) => updateConfessionSize(confession._id, 'width', e.target.value)}
                        style={{ width: '60px', padding: '4px', border: '1px solid #ddd', borderRadius: '3px', fontSize: '11px' }}
                    />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <label style={{ color: '#555' }}>H:</label>
                    <input
                        type="number" min="150" max="900"
                        value={currentSize.height}
                        onChange={(e) => updateConfessionSize(confession._id, 'height', e.target.value)}
                        style={{ width: '60px', padding: '4px', border: '1px solid #ddd', borderRadius: '3px', fontSize: '11px' }}
                    />
                </div>
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                    {[
                        { label: 'Reset',     w: 350, h: 250, bg: '#6c757d' },
                        { label: 'Small',     w: 300, h: 150, bg: '#28a745' },
                        { label: 'Mid',       w: 400, h: 200, bg: '#dc3545' },
                        { label: 'Large',     w: 600, h: 300, bg: '#dc3545' },
                        { label: 'Proper-2',  w: 400, h: 250, bg: '#dc3545' },
                        { label: 'Proper',    w: 500, h: 300, bg: '#dc3545' },
                        { label: 'Long Text', w: 600, h: 800, bg: '#dc3545' },
                    ].map(({ label, w, h, bg }) => (
                        <button
                            key={label}
                            onClick={() => setConfessionSizes(prev => ({
                                ...prev,
                                [confession._id]: { width: w, height: h }
                            }))}
                            style={{
                                background: bg, color: 'white', border: 'none',
                                padding: '4px 8px', borderRadius: '3px',
                                fontSize: '10px', cursor: 'pointer'
                            }}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Confession Card Box */}
            <div
                className="card"
                id={`confession-${confession._id}`}
                style={{
                    border: confession.isRead ? '1px solid #e5e7eb' : '3px solid #ff6b6b',
                    opacity: confession.isRead ? 0.9 : 1,
                    borderRadius: '18px',
                    padding: '25px',
                    background: '#ffffff',
                    color: '#1c1c1c',
                    boxShadow: confession.isRead
                        ? '0 8px 20px rgba(0,0,0,0.08)'
                        : '0 12px 28px rgba(255,107,107,0.25), 0 6px 18px rgba(0,0,0,0.12)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '15px',
                    position: 'relative',
                    overflow: 'hidden',          // ✅ hidden so drag handle sits flush
                    minWidth: '250px',
                    minHeight: '120px',
                    maxWidth: '100%',
                    width: `${currentSize.width}px`,
                    height: `${currentSize.height}px`,
                    boxSizing: 'border-box',
                    transition: 'box-shadow 0.2s ease',
                    transform: confession.isRead ? 'scale(0.98)' : 'scale(1)',
                    fontFamily: 'var(--font-poppins), var(--font-noto-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                    fontSize: '17px',
                    fontWeight: '500',
                    lineHeight: '1.6',
                    letterSpacing: '0.3px',
                    WebkitFontSmoothing: 'antialiased',
                    MozOsxFontSmoothing: 'grayscale',
                    textRendering: 'optimizeLegibility',
                    userSelect: 'none',
                }}
            >
                {/* Header: Anonymous + Date */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '13px',
                    color: '#7f8c8d',
                    fontWeight: '500',
                    letterSpacing: '0.4px',
                }}>
                    <span style={{
                        background: 'linear-gradient(45deg, #6366f1, #8b5cf6)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        fontWeight: '600',
                        fontSize: '14px',
                    }}>
                        Anonymous
                    </span>
                    <span style={{
                        background: '#f5f7fa',
                        padding: '3px 10px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        color: '#5d6d7e',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                    }}>
                        {new Date(confession.createdAt).toLocaleDateString()}
                    </span>
                </div>

                {/* Confession Text */}
                <div style={{
                    fontWeight: '400',
                    fontSize: '16px',
                    lineHeight: '1.7',
                    flex: 1,
                    overflow: 'auto',
                    color: '#1f2937',
                    textAlign: 'left',
                    letterSpacing: '0.2px',//ok
                }}>
                    {confession.content.split('\n').map((paragraph, index) => (
                        <div key={index} style={{ marginBottom: paragraph.trim() === '' ? '6px' : '2px' }}>
                            {index === 0 && (
                                <span style={{
                                    color: '#dc2626',
                                    fontSize: '22px',
                                    fontWeight: 'bold',
                                    marginRight: '10px',
                                    display: 'inline-block',
                                    transform: 'translateY(3px)',
                                }}>•</span>
                            )}
                            {paragraph}
                        </div>
                    ))}
                </div>

                {/* Footer Label */}
                <div style={{
                    background: 'linear-gradient(45deg, #6366f1, #8b5cf6)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontSize: '12px',
                    position: 'absolute',
                    bottom: '16px',
                    left: '28px',
                    fontWeight: '700',
                    opacity: 0.9,
                    pointerEvents: 'none',
                    letterSpacing: '1px',
                }}>
                    Global Gss Confession
                </div>

                {/* Archived Label */}
                {isArchived && (
                    <div style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        background: 'linear-gradient(45deg, #f39c12, #e67e22)',
                        color: 'white',
                        padding: '5px 12px',
                        borderRadius: '14px',
                        fontSize: '10px',
                        fontWeight: '700',
                        letterSpacing: '0.5px',
                        boxShadow: '0 2px 8px rgba(243, 156, 18, 0.3)',
                    }}>
                        ARCHIVED
                    </div>
                )}

                {/* ✅ Drag Resize Handle — sits inside card, bottom-right */}
                <div
                    onMouseDown={handleResizeMouseDown}
                    title="Drag to resize"
                    style={{
                        position: 'absolute',
                        bottom: '0px',
                        right: '0px',
                        width: '24px',
                        height: '24px',
                        cursor: 'nwse-resize',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '0 0 18px 0',
                        
                        zIndex: 10,
                        transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99,102,241,0.25)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(99,102,241,0.08)'}
                >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <circle cx="10" cy="10" r="1.2" fill="#6366f1" opacity="0.7"/>
                        <circle cx="6.5" cy="10" r="1.2" fill="#6366f1" opacity="0.5"/>
                        <circle cx="10" cy="6.5" r="1.2" fill="#6366f1" opacity="0.5"/>
                        <circle cx="3"   cy="10" r="1.2" fill="#6366f1" opacity="0.3"/>
                        <circle cx="10" cy="3"   r="1.2" fill="#6366f1" opacity="0.3"/>
                    </svg>
                </div>

            </div>{/* ✅ Card closes here — nothing inside the isArchived block */}

            {/* Action Buttons */}
            {!readonly && (
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '10px', flexWrap: 'wrap' }}>
                    {!confession.isRead && !isArchived && (
                        <button onClick={() => markAsRead(confession._id)}
                            style={{ background: '#34c759', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
                            Mark as Read
                        </button>
                    )}
                    <button onClick={() => shareConfessionAsImage(confession._id)}
                        style={{ background: '#007aff', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
                        Save as Image
                    </button>
                    {isArchived ? (
                        <button onClick={() => handleUnarchive(confession._id)}
                            style={{ background: '#28a745', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
                            Unarchive
                        </button>
                    ) : (
                        <button onClick={() => handleArchive(confession._id)}
                            style={{ background: '#ffc107', color: '#212529', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
                            Archive
                        </button>
                    )}
                    <button onClick={() => deleteConfession(confession._id, isArchived)}
                        style={{ background: '#ff3b30', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
                        Delete
                    </button>
                    <button onClick={() => setSelectedConfessionInfo(confession)}
                        style={{ background: '#17a2b8', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
                        ℹ️ Info
                    </button>
                    {!isArchived && (
                        <button onClick={() => banUser(confession)}
                            style={{ background: '#ff9500', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
                            Ban User
                        </button>
                    )}
                </div>
            )}

            {/* Read-only buttons */}
            {readonly && (
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '10px', flexWrap: 'wrap' }}>
                    {[
                        { label: 'Save as Image', bg: '#007aff', color: 'white' },
                        { label: 'Archive', bg: '#ffc107', color: '#212529' },
                        { label: 'Ban User', bg: '#ff9500', color: 'white' },
                    ].map(({ label, bg, color }) => (
                        <button key={label} disabled
                            style={{ background: bg, color, border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'not-allowed', opacity: 0.6 }}>
                            {label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
    // Login Form
    // ADD CLERK CHECKS FIRST
    // FIRST: Check if user is signed into Clerk but doesn't have role
    if (isLoaded && isSignedIn) {
        const userRoles = user?.publicMetadata?.roles || [];
        if (!userRoles.includes('confess') && !userRoles.includes('noconfess')) {
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
                        textAlign: 'center'
                    }}>
                        <h2>Access Denied</h2>
                        <p>You don't have permission to access this page.</p>
                        <button
                            onClick={() => signOut()}
                            style={{
                                background: '#667eea',
                                color: 'white',
                                border: 'none',
                                padding: '10px 20px',
                                borderRadius: '6px',
                                cursor: 'pointer'
                            }}
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            );
        }
    }

    // SECOND: Show Clerk sign-in if not signed in at all
    if (isLoaded && !isSignedIn) {
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
                }}>
                    <SignIn routing="hash" />
                </div>
            </div>
        );
    }

    // THIRD: Your existing admin login form
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

    if (isReadOnly) {
        return (
            <div style={{ minHeight: '100vh' }}>
                <div className="admin-header">
                    <div className="container">
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '20px'
                        }}>
                            <h1 className="readonly-header-title" style={{
                                color: 'white',
                                textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                                margin: 0
                            }}>
                                 Global Gss Confession
                            </h1>
                            <div style={{
                                color: 'rgba(255,255,255,0.9)',
                                fontSize: '16px',
                                fontWeight: '400',
                                textAlign: 'right',
                                marginTop: '8px',
                                fontStyle: 'italic',
                                opacity: 0.8
                            }}>
                               Read-Only Access Mode
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    onClick={() => signOut()}
                                    className="readonly-signout-btn"
                                    style={{
                                        background: 'rgba(255,255,255,0.15)',
                                        color: 'white',
                                        border: '1px solid rgba(255,255,255,0.3)',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s',
                                        fontWeight: '500'
                                    }}
                                    onMouseOver={(e) => {
                                        e.target.style.background = 'rgba(255,255,255,0.25)';
                                    }}
                                    onMouseOut={(e) => {
                                        e.target.style.background = 'rgba(255,255,255,0.15)';
                                    }}
                                >
                                    Sign Out {user?.firstName}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="container readonly-container">
                    {/* Welcome Section */}
                   

                    {visibleConfessions.length === 0 ? (
                        <div className="card readonly-empty-card" style={{
                            textAlign: 'center',
                            background: 'white',
                            borderRadius: '18px',
                            boxShadow: '0 12px 32px rgba(0,0,0,0.08)',
                            border: '2px solid #f0f2f5'
                        }}>
                            <div className="readonly-empty-icon">
                                �
                            </div>
                            <h3 style={{
                                color: '#4b5563',
                                margin: '0 0 10px 0'
                            }} className="readonly-empty-title">
                                All Caught Up!
                            </h3>
                            <p style={{
                                color: '#6b7280',
                                margin: 0
                            }} className="readonly-empty-text">
                                All pending confessions have been reviewed. New submissions will appear here automatically.
                            </p>
                            <div style={{
                                background: '#f8fafc',
                                padding: '16px',
                                borderRadius: '12px',
                                border: '1px solid #e5e7eb',
                                marginTop: '20px'
                            }}>
                                <p style={{
                                    margin: 0,
                                    color: '#374151',
                                    fontSize: '14px',
                                    fontWeight: '500'
                                }}>
                                    💡 <strong>Pro Tip:</strong> Check back periodically or refresh the page to see new confessions as they arrive.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div className="readonly-status-card" style={{
                                background: 'white',
                                borderRadius: '16px',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                                border: '1px solid #e5e7eb',
                                padding: '20px',
                                marginBottom: '30px'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px',
                                    color: '#374151',
                                    fontWeight: '500'
                                }} className="readonly-status-text">
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        background: 'linear-gradient(45deg, #10b981, #059669)',
                                        color: 'white',
                                        borderRadius: '20px',
                                        padding: '8px 16px',
                                        fontWeight: '600',
                                        fontSize: '14px'
                                    }} className="readonly-status-badge">
                                        <span>📋</span>
                                        {visibleConfessions.length} Showing
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        color: '#6b7280',
                                        fontSize: '14px',
                                        fontWeight: '400'
                                    }}>
                                        <span>🔒</span>
                                        <span className="readonly-status-full">Confessions cannot be saved. Confessions will be hidden once read by Admins.</span>
                                        <span className="readonly-status-mobile" style={{ display: 'none' }}>Read-Only Mode</span><br></br>
                                    </div>
                                </div>
                            </div>

                            <div className="readonly-confessions-container">
                                {visibleConfessions.map(confession => renderConfessionCard(confession, false, true))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Info Modal for Confession Details - Responsive Layout
    if (selectedConfessionInfo) {
        const deviceInfo = parseUserAgent(selectedConfessionInfo.userAgent);
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

        if (isMobile) {
            // Mobile: Full-screen modal
            return (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.7)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 9999,
                    padding: '20px'
                }} onClick={() => setSelectedConfessionInfo(null)}>
                    <div style={{
                        background: 'white',
                        borderRadius: '16px',
                        padding: '30px',
                        maxWidth: '600px',
                        width: '100%',
                        maxHeight: '80vh',
                        overflow: 'auto',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                        position: 'relative'
                    }} onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => setSelectedConfessionInfo(null)}
                            style={{
                                position: 'absolute',
                                top: '16px',
                                right: '16px',
                                background: '#f0f0f0',
                                border: 'none',
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                fontSize: '20px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            ✕
                        </button>

                        <h2 style={{ margin: '0 0 25px 0', color: '#1f2937', fontSize: '24px', fontWeight: '700' }}>
                            ℹ️ Details
                        </h2>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
                            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Device Type</label>
                                <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: '600' }}>{deviceInfo?.deviceType || '—'}</div>
                            </div>
                            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Browser</label>
                                <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: '600' }}>{deviceInfo?.browser || '—'}</div>
                            </div>
                            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>OS</label>
                                <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: '600' }}>{deviceInfo?.os || '—'}</div>
                            </div>
                            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>IP</label>
                                <code style={{ display: 'block', fontSize: '12px', color: '#0f172a', wordBreak: 'break-all', fontFamily: 'Monaco, monospace' }}>{selectedConfessionInfo.ipAddress || '—'}</code>
                            </div>
                            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0',gridColumn: '1 / -1' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Fingerprint</label>
                                <code style={{ display: 'block', fontSize: '11px', color: '#0f172a', wordBreak: 'break-all', fontFamily: 'Monaco, monospace' }}>{selectedConfessionInfo.fingerprint ? selectedConfessionInfo.fingerprint.substring(0, 20) + '...' : '—'}</code>
                            </div>
                            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', gridColumn: '1 / -1' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Status</label>
                                <div style={{ display: 'inline-block', background: selectedConfessionInfo.isRead ? '#d1fae5' : '#fee2e2', color: selectedConfessionInfo.isRead ? '#065f46' : '#991b1b', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '600' }}>
                                    {selectedConfessionInfo.isRead ? '✓ Read' : '◐ Unread'}
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
                            <button
                                onClick={() => setSelectedConfessionInfo(null)}
                                style={{
                                    width: '100%',
                                    background: '#6b7280',
                                    color: 'white',
                                    border: 'none',
                                    padding: '10px 20px',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '600'
                                }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        // Desktop: Sidebar layout
        return (
            <div style={{ minHeight: '100vh', paddingBottom: '40px', display: 'grid', gridTemplateColumns: '1fr 420px', gap: '30px', alignItems: 'start' }}>
                <div>
                    <div className="admin-header">
                        <div className="container">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                                <h1 style={{ fontSize: '2.5rem', color: 'white', textShadow: '0 2px 10px rgba(0,0,0,0.3)', margin: 0 }}>Admin Dashboard</h1>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        onClick={handleLogout}
                                        style={{
                                            background: 'rgba(255,255,255,0.2)',
                                            color: 'white',
                                            border: '1px solid rgba(255,255,255,0.3)',
                                            padding: '8px 16px',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '14px'
                                        }}
                                    >
                                        Admin Logout
                                    </button>
                                    <button
                                        onClick={() => signOut()}
                                        style={{
                                            background: 'rgba(255,0,0,0.2)',
                                            color: 'white',
                                            border: '1px solid rgba(255,255,255,0.3)',
                                            padding: '8px 16px',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '14px'
                                        }}
                                    >
                                        Sign Out ({user?.firstName})
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>


                    

                    <div className="container" style={{ marginTop: '30px', textAlign: 'center' }}>
                        <p style={{ fontSize: '18px', color: '#666' }}>Viewing confession details. Close to return to list.</p>
                        <button
                            onClick={() => setSelectedConfessionInfo(null)}
                            style={{
                                background: '#ef4444',
                                color: 'white',
                                border: 'none',
                                padding: '10px 20px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '600',
                                marginTop: '10px'
                            }}
                        >
                            Close Details
                        </button>
                    </div>
                </div>

                {/* Sidebar Info Box */}
                <div style={{
                    position: 'fixed',
                    right: '30px',
                    top: '100px',
                    width: '420px',
                    background: 'white',
                    borderRadius: '16px',
                    padding: '25px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                    border: '1px solid #e5e7eb',
                    maxHeight: 'calc(100vh - 140px)',
                    overflow: 'auto'
                }}>
                    <h2 style={{ margin: '0 0 25px 0', color: '#1f2937', fontSize: '20px', fontWeight: '700' }}>ℹ️ Details</h2>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px', marginBottom: '25px' }}>
                        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Device Type</label>
                            <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: '600' }}>{deviceInfo?.deviceType || '—'}</div>
                        </div>
                        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Browser</label>
                            <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: '600' }}>{deviceInfo?.browser || '—'}</div>
                        </div>
                        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>OS</label>
                            <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: '600' }}>{deviceInfo?.os || '—'}</div>
                        </div>
                        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>IP Address</label>
                            <code style={{ display: 'block', fontSize: '12px', color: '#0f172a', wordBreak: 'break-all', fontFamily: 'Monaco, monospace' }}>{selectedConfessionInfo.ipAddress || '—'}</code>
                        </div>
                        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Fingerprint</label>
                            <code style={{ display: 'block', fontSize: '11px', color: '#0f172a', wordBreak: 'break-all', fontFamily: 'Monaco, monospace' }}>{selectedConfessionInfo.fingerprint ? selectedConfessionInfo.fingerprint.substring(0, 20) + '...' : '—'}</code>
                        </div>
                        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Tracking ID</label>
                            <code style={{ display: 'block', fontSize: '11px', color: '#0f172a', wordBreak: 'break-all', fontFamily: 'Monaco, monospace' }}>{selectedConfessionInfo.trackingId ? selectedConfessionInfo.trackingId.substring(0, 20) + '...' : '—'}</code>
                        </div>
                        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>LocalStorage</label>
                            <code style={{ display: 'block', fontSize: '11px', color: '#0f172a', wordBreak: 'break-all', fontFamily: 'Monaco, monospace' }}>{selectedConfessionInfo.localStorageId ? selectedConfessionInfo.localStorageId.substring(0, 20) + '...' : '—'}</code>
                        </div>
                        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Status</label>
                            <div style={{ display: 'inline-block', background: selectedConfessionInfo.isRead ? '#d1fae5' : '#fee2e2', color: selectedConfessionInfo.isRead ? '#065f46' : '#991b1b', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '600' }}>
                                {selectedConfessionInfo.isRead ? '✓ Read' : '◐ Unread'}
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
                        <button
                            onClick={() => setSelectedConfessionInfo(null)}
                            style={{
                                width: '100%',
                                background: '#6b7280',
                                color: 'white',
                                border: 'none',
                                padding: '10px 20px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '600'
                            }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
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
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            {hasConfessRole && (
                                <button
                                    onClick={() => router.push('/admin/all-confessions-details')}
                                    style={{
                                        background: 'rgba(0,123,255,0.2)',
                                        color: 'white',
                                        border: '1px solid rgba(255,255,255,0.3)',
                                        padding: '8px 16px',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        transition: 'all 0.3s'
                                    }}
                                    onMouseOver={(e) => {
                                        e.target.style.background = 'rgba(0,123,255,0.3)';
                                    }}
                                    onMouseOut={(e) => {
                                        e.target.style.background = 'rgba(0,123,255,0.2)';
                                    }}
                                >
                                    Database
                                </button>
                            )}
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
                                Admin Logout
                            </button>
                            <button
                                onClick={() => signOut()}
                                style={{
                                    background: 'rgba(255,0,0,0.2)',
                                    color: 'white',
                                    border: '1px solid rgba(255,255,255,0.3)',
                                    padding: '8px 16px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    transition: 'all 0.3s'
                                }}
                                onMouseOver={(e) => {
                                    e.target.style.background = 'rgba(255,0,0,0.3)';
                                }}
                                onMouseOut={(e) => {
                                    e.target.style.background = 'rgba(255,0,0,0.2)';
                                }}
                            >
                                Sign Out ({user?.firstName})
                            </button>
                        </div>
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
                            {visibleConfessions.length === 0 ? (
                                <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                                    <p style={{ color: '#666', fontSize: '18px' }}>
                                        {filter === 'all' ? 'No confessions yet' : `No ${filter} confessions`}
                                    </p>
                                </div>
                            ) : (
                                visibleConfessions.map((confession) => renderConfessionCard(confession, false))
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
