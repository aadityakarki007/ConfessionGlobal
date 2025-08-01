// app/admin/page.jsx
'use client';
import { useState, useEffect } from 'react';
import html2canvas from 'html2canvas';

export default function AdminPage() {
    const shareConfessionAsImage = async (confessionId, isInstagram = false) => {
        const confessionElement = document.getElementById(`confession-${confessionId}`);
        if (!confessionElement) return;

        try {
            // Clone element into a new wrapper with Instagram-optimized styling if needed
            const wrapper = document.createElement('div');

            if (isInstagram) {
                // Instagram optimal styling
                wrapper.style.backgroundColor = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                wrapper.style.padding = '40px';
                wrapper.style.display = 'flex';
                wrapper.style.alignItems = 'center';
                wrapper.style.justifyContent = 'center';
                wrapper.style.width = '1080px';
                wrapper.style.height = '1080px';
                wrapper.style.boxSizing = 'border-box';
            } else {
                wrapper.style.backgroundColor = 'white';
                wrapper.style.padding = '20px';
                wrapper.style.display = 'inline-block';
            }

            const clonedElement = confessionElement.cloneNode(true);
            if (isInstagram) {
                clonedElement.style.maxWidth = '800px';
                clonedElement.style.maxHeight = '800px';
                clonedElement.style.margin = 'auto';
            }

            // Fix gradient text issues for image generation
            // Find all elements with gradient text styling and convert to solid color
            const allElements = clonedElement.querySelectorAll('*');
            allElements.forEach(element => {
                const computedStyle = window.getComputedStyle(element);
                // Check if element has WebkitBackgroundClip: text
                if (element.style.WebkitBackgroundClip === 'text' ||
                    element.style.webkitBackgroundClip === 'text' ||
                    computedStyle.webkitBackgroundClip === 'text') {

                    // Remove gradient and set solid color
                    element.style.background = 'none';
                    element.style.WebkitBackgroundClip = 'unset';
                    element.style.webkitBackgroundClip = 'unset';
                    element.style.WebkitTextFillColor = '#667eea';
                    element.style.webkitTextFillColor = '#667eea';
                    element.style.color = '#667eea';
                }

                // Also check for background gradient and transparent text
                if ((element.style.background && element.style.background.includes('gradient')) &&
                    (element.style.WebkitTextFillColor === 'transparent' ||
                        element.style.webkitTextFillColor === 'transparent')) {
                    element.style.background = 'none';
                    element.style.WebkitTextFillColor = '#667eea';
                    element.style.webkitTextFillColor = '#667eea';
                    element.style.color = '#667eea';
                }
            });

            wrapper.appendChild(clonedElement);
            document.body.appendChild(wrapper);

            const canvas = await html2canvas(wrapper, {
                backgroundColor: isInstagram ? '#667eea' : '#ffffff',
                useCORS: true,
                allowTaint: true,
                scale: window.devicePixelRatio || 1,
                width: isInstagram ? 1080 : undefined,
                height: isInstagram ? 1080 : undefined,
                logging: false,
                removeContainer: true
            });

            // Clean up wrapper first
            if (document.body.contains(wrapper)) {
                document.body.removeChild(wrapper);
            }

            // Add this check for iOS
            if (canvas.width === 0 || canvas.height === 0) {
                throw new Error('Canvas rendering failed - invalid dimensions');
            }

            if (isInstagram) {
                let shareSuccess = false;

                // Method 1: Try Web Share API (works best on mobile)
                if (navigator.share && 'canShare' in navigator) {
                    try {
                        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
                        const file = new File([blob], `confession-${confessionId}-instagram.png`, { type: 'image/png' });

                        if (navigator.canShare({ files: [file] })) {
                            await navigator.share({
                                files: [file],
                                title: 'Global Confession',
                                text: 'Check out this confession!'
                            });
                            shareSuccess = true;
                        }
                    } catch (shareError) {
                        console.log('Web Share API failed:', shareError.message);
                    }
                }

                // Method 2: Try clipboard (only if Web Share failed and user grants permission)
                if (!shareSuccess && navigator.clipboard && window.ClipboardItem) {
                    try {
                        // First check if we can write to clipboard
                        const permissionStatus = await navigator.permissions.query({ name: 'clipboard-write' });

                        if (permissionStatus.state === 'granted' || permissionStatus.state === 'prompt') {
                            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
                            const item = new ClipboardItem({ 'image/png': blob });
                            await navigator.clipboard.write([item]);

                            alert('✅ Image copied to clipboard!\n\nNow you can:\n1. Open Instagram\n2. Create a new post\n3. Paste the image (Ctrl+V or Cmd+V)');

                            // Open Instagram in new tab
                            window.open('https://www.instagram.com/', '_blank');
                            shareSuccess = true;
                        }
                    } catch (clipboardError) {
                        console.log('Clipboard write failed:', clipboardError.message);
                    }
                }

                // Method 3: Fallback - Show image with instructions
                if (!shareSuccess) {
                    const image = canvas.toDataURL('image/png');

                    // Create a better sharing interface
                    const shareWindow = window.open('', '_blank', 'width=600,height=700,scrollbars=yes');
                    shareWindow.document.write(`
                <!DOCTYPE html>
                <html>
                    <head>
                        <title>Share to Instagram - GSS Confession</title>
                        <meta name="viewport" content="width=device-width, initial-scale=1">
                        <style>
                            body { 
                                margin: 0; 
                                padding: 20px; 
                                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                                background: #f8f9fa;
                                text-align: center;
                            }
                            .container { max-width: 500px; margin: 0 auto; }
                            .header { 
                                background: linear-gradient(45deg, #E4405F, #C13584);
                                color: white;
                                padding: 20px;
                                border-radius: 12px;
                                margin-bottom: 20px;
                            }
                            .image-container {
                                background: white;
                                padding: 15px;
                                border-radius: 12px;
                                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                                margin-bottom: 20px;
                            }
                            .confession-image {
                                max-width: 100%;
                                height: auto;
                                border-radius: 8px;
                                cursor: pointer;
                                transition: transform 0.2s;
                            }
                            .confession-image:hover {
                                transform: scale(1.02);
                            }
                            .instructions {
                                background: white;
                                padding: 20px;
                                border-radius: 12px;
                                box-shadow: 0 2px 8px rgba(0,0,0,0.05);
                                margin-bottom: 20px;
                                text-align: left;
                            }
                            .step {
                                display: flex;
                                align-items: center;
                                margin-bottom: 15px;
                                padding: 10px;
                                background: #f8f9fa;
                                border-radius: 8px;
                            }
                            .step-number {
                                background: #E4405F;
                                color: white;
                                width: 24px;
                                height: 24px;
                                border-radius: 50%;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-weight: bold;
                                font-size: 12px;
                                margin-right: 12px;
                                flex-shrink: 0;
                            }
                            .buttons {
                                display: flex;
                                gap: 10px;
                                justify-content: center;
                                flex-wrap: wrap;
                            }
                            .btn {
                                padding: 12px 24px;
                                border: none;
                                border-radius: 8px;
                                font-weight: 600;
                                cursor: pointer;
                                text-decoration: none;
                                display: inline-block;
                                transition: transform 0.2s;
                            }
                            .btn:hover { transform: translateY(-1px); }
                            .btn-instagram {
                                background: linear-gradient(45deg, #E4405F, #C13584);
                                color: white;
                            }
                            .btn-download {
                                background: #28a745;
                                color: white;
                            }
                            .btn-close {
                                background: #6c757d;
                                color: white;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h2 style="margin: 0; margin-bottom: 5px;">📸 Ready for Instagram!</h2>
                                <p style="margin: 0; opacity: 0.9; font-size: 14px;">Your confession is perfectly sized for Instagram</p>
                            </div>
                            
                            <div class="image-container">
                                <img src="${image}" class="confession-image" alt="Confession for Instagram" 
                                     onclick="this.style.transform='scale(1.1)'; setTimeout(() => this.style.transform='scale(1)', 200);" />
                            </div>
                            
                            <div class="instructions">
                                <h3 style="margin-top: 0; color: #333;">📋 How to share:</h3>
                                <div class="step">
                                    <div class="step-number">1</div>
                                    <div>Right-click the image above and select <strong>"Save image as..."</strong> or <strong>"Copy image"</strong></div>
                                </div>
                                <div class="step">
                                    <div class="step-number">2</div>
                                    <div>Open Instagram (web or app) and create a new post</div>
                                </div>
                                <div class="step">
                                    <div class="step-number">3</div>
                                    <div>Upload the saved image or paste it directly (Ctrl+V / Cmd+V)</div>
                                </div>
                            </div>
                            
                            <div class="buttons">
                                <a href="https://www.instagram.com/" target="_blank" class="btn btn-instagram">
                                    Open Instagram
                                </a>
                                <button onclick="downloadImage()" class="btn btn-download">
                                    Download Image
                                </button>
                                <button onclick="window.close()" class="btn btn-close">
                                    Close
                                </button>
                            </div>
                        </div>
                        
                        <script>
                            function downloadImage() {
                                const link = document.createElement('a');
                                link.href = '${image}';
                                link.download = 'confession-${confessionId}-instagram.png';
                                link.click();
                            }
                        </script>
                    </body>
                </html>
            `);
                }
            } else {
                // Regular save for non-Instagram shares
                const image = canvas.toDataURL('image/png');
                const link = document.createElement('a');
                link.href = image;
                link.download = `confession-${confessionId}.png`;
                link.click();
            }
        } catch (error) {
            // Clean up wrapper if it still exists
            const wrapper = document.querySelector('div');
            if (wrapper && document.body.contains(wrapper)) {
                try {
                    document.body.removeChild(wrapper);
                } catch (cleanupError) {
                    console.log('Cleanup error:', cleanupError);
                }
            }

            console.error('Image generation failed:', error);
            alert('Image generation failed on this device. Please try using a desktop browser or different device.');
        }
    };

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
        checkAuthStatus();
    }, []);

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
                        <button
                            onClick={() => setConfessionSizes(prev => ({
                                ...prev,
                                [confession._id]: { width: 500, height: 300 }
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
                            Proper
                        </button>
                        <button
                            onClick={() => setConfessionSizes(prev => ({
                                ...prev,
                                [confession._id]: { width: 600, height: 800 }
                            }))}
                            style={{
                                background: '#dc3545',
                                color: 'white',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                cursor: 'pointer'
                            }}
                        >
                            Long Text
                        </button>



                    </div>
                </div>

                {/* Enhanced Confession Box */}
                <div
                    className="card"
                    id={`confession-${confession._id}`}
                    style={{
                        border: confession.isRead ? 'none' : '3px solid #ff6b6b',
                        opacity: confession.isRead ? 0.85 : 1,
                        borderRadius: '16px',
                        padding: '25px',
                        background: isArchived
                            ? '#f8f9fa'
                            : '#ffffff',
                        color: '#2c3e50',
                        boxShadow: confession.isRead
                            ? '0 8px 25px rgba(0,0,0,0.1)'
                            : '0 12px 35px rgba(255,107,107,0.2), 0 4px 15px rgba(0,0,0,0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '15px',
                        position: 'relative',
                        resize: 'both',
                        overflow: 'auto',
                        minWidth: '250px',
                        minHeight: '100px',
                        maxWidth: '100%',
                        width: `${currentSize.width}px`,
                        height: `${currentSize.height}px`,
                        boxSizing: 'border-box',
                        transition: 'all 0.3s ease',
                        transform: confession.isRead ? 'scale(0.98)' : 'scale(1)',
                        backgroundImage: 'none',
                    }}
                >
                    {/* Header: Anonymous + Date */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '13px',
                        color: '#7f8c8d',
                        flexShrink: 0,
                        fontWeight: '500',
                        letterSpacing: '0.5px'
                    }}>
                        <span style={{
                            background: 'linear-gradient(45deg, #667eea, #764ba2)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            fontWeight: '600'
                        }}>
                            Anonymous
                        </span>
                        <span style={{
                            background: '#ecf0f1',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontSize: '11px',
                            color: '#5d6d7e'
                        }}>
                            {new Date(confession.createdAt).toLocaleDateString()}
                        </span>
                    </div>

                    {/* Confession Text with dot */}
                    <div style={{
                        fontWeight: '500',
                        fontSize: '17px',
                        lineHeight: '1.7',
                        flex: 1,
                        overflow: 'auto',
                        fontFamily: '"Inter", "Segoe UI", "Roboto", sans-serif',
                        color: '#34495e',
                        textAlign: 'left',
                        letterSpacing: '0.3px',
                        textShadow: '0 1px 2px rgba(0,0,0,0.02)'
                    }}>
                        <span style={{
                            color: '#e74c3c',
                            fontSize: '20px',
                            fontWeight: 'bold',
                            marginRight: '8px',
                            display: 'inline-block',
                            transform: 'translateY(2px)'
                        }}>
                            •
                        </span>
                        {confession.content}
                    </div>

                    <div style={{
                        background: 'linear-gradient(45deg, #667eea, #764ba2)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        fontSize: '13px',
                        position: 'absolute',
                        bottom: '15px',
                        left: '25px',
                        fontWeight: '700',
                        opacity: 0.9,
                        pointerEvents: 'none',
                        fontFamily: '"Inter", "Segoe UI", "Roboto", sans-serif',
                        letterSpacing: '1px',
                        textShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}>
                        GSS Confession
                    </div>

                    {isArchived && (
                        <div style={{
                            position: 'absolute',
                            top: '15px',
                            right: '15px',
                            background: 'linear-gradient(45deg, #f39c12, #e67e22)',
                            color: 'white',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '10px',
                            fontWeight: '700',
                            letterSpacing: '0.5px',
                            boxShadow: '0 2px 8px rgba(243, 156, 18, 0.3)'
                        }}>
                            ARCHIVED
                        </div>
                    )}
                </div>

                {/* Buttons outside the box */}
                <div style={{
                    display: 'flex',
                    gap: '8px',
                    justifyContent: 'flex-end',
                    marginTop: '10px',
                    flexWrap: 'wrap'
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

                    <button
                        onClick={() => shareConfessionAsImage(confession._id, true)}
                        style={{
                            background: 'linear-gradient(45deg, #E4405F, #C13584, #833AB4)',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            fontWeight: '600'
                        }}
                    >
                        Share to Instagram
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