'use client';
import { useState, useEffect } from 'react';

export default function HomePage() {
  const [confession, setConfession] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const [isXSSDetected, setIsXSSDetected] = useState(false);
  const forbiddenNames = [];

  // XSS Detection patterns - Enhanced
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<img[^>]+src[^>]*onerror/gi,
    /<embed\b[^>]*>/gi,
    /<object\b[^>]*>/gi,
    /<link\b[^>]*>/gi,
    /<meta\b[^>]*>/gi,
    /data:\s*text\/html/gi,
    /vbscript:/gi,
    /expression\s*\(/gi,
    /<svg\b[^>]*onload/gi,
    /alert\s*\(/gi,
    /document\.cookie/gi,
    /window\.location/gi,
    /eval\s*\(/gi,
    /innerHTML/gi,
    /outerHTML/gi,
    /<style.*?<\/style>/gi
  ];

  const detectXSS = (text) => {
    return xssPatterns.some(pattern => pattern.test(text));
  };

  const sanitizeInput = (text) => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .replace(/\(/g, '&#40;')
      .replace(/\)/g, '&#41;');
  };

  useEffect(() => {
    // Real-time XSS detection
    const isXSS = detectXSS(confession);
    setIsXSSDetected(isXSS);
  }, [confession]);

  useEffect(() => {
    const handleScroll = () => {
      const position = window.pageYOffset;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercentage = (position / maxScroll) * 100;

      setScrollPosition(scrollPercentage);
      setShowScrollIndicator(maxScroll > 100);
    };

    const handleResize = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      setShowScrollIndicator(maxScroll > 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    handleScroll();
    handleResize();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!confession.trim()) {
      setMessage('Please enter your confession');
      setShowErrorPopup(true);
      setTimeout(() => {
        setShowErrorPopup(false);
        setMessage('');
      }, 3000);
      return;
    }

    // Enhanced XSS Check
    if (isXSSDetected) {
      setMessage("🚨 Security Alert: Potentially harmful content detected! Please remove scripts, HTML tags, or suspicious code.");
      setShowErrorPopup(true);
      setTimeout(() => {
        setShowErrorPopup(false);
        setMessage('');
      }, 4000);
      return;
    }

    // Additional security checks
    if (confession.length > 1500) {
      setMessage("Confession is too long. Please keep it under 1500 characters.");
      setShowErrorPopup(true);
      setTimeout(() => {
        setShowErrorPopup(false);
        setMessage('');
      }, 3000);
      return;
    }

    // Name filter check (case insensitive)
    const lowerConfession = confession.toLowerCase();
    for (let name of forbiddenNames) {
      if (lowerConfession.includes(name)) {
        setMessage("Sorry, you can't confess this. Invalid confession!");
        setShowErrorPopup(true);
        setTimeout(() => {
          setShowErrorPopup(false);
          setMessage('');
        }, 3000);
        return;
      }
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      // Double sanitization for extra security
      const sanitizedConfession = sanitizeInput(confession);

      const response = await fetch('/api/confessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: sanitizedConfession }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('✅ Confession submitted successfully! Thank you for sharing.');
        setShowSuccessPopup(true);
        setConfession('');

        setTimeout(() => {
          setShowSuccessPopup(false);
          setMessage('');
        }, 3000);
      } else {
        setMessage(data.error || 'Something went wrong. Please try again.');
        setShowErrorPopup(true);
        setTimeout(() => {
          setShowErrorPopup(false);
          setMessage('');
        }, 3000);
      }
    } catch (error) {
      setMessage('Network error. Please check your connection and try again.');
      setShowErrorPopup(true);
      setTimeout(() => {
        setShowErrorPopup(false);
        setMessage('');
      }, 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
  };

  return (
    <>
      <style jsx>{`
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }

        /* Mobile container adjustments - MINIMIZE SIDE PADDING */
        @media (max-width: 768px) {
          .container {
            padding: 0 5px; /* Minimal side padding */
          }
        }

        @media (max-width: 480px) {
          .container {
            padding: 0 3px; /* Almost no side padding */
          }
        }

        .glass-effect {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.25);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3);
          transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
        }

        .glass-effect:hover {
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 16px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.4);
          transform: translateY(-2px);
        }

        /* Mobile glass effect adjustments - REMOVE SIDE MARGINS */
        @media (max-width: 768px) {
          .glass-effect {
            border-radius: 20px;
            margin: 0 2px; /* Almost no side margins */
          }
          
          .glass-effect:hover {
            transform: none;
          }
        }

        @media (max-width: 480px) {
          .glass-effect {
            border-radius: 16px;
            margin: 0 1px; /* Minimal side margins */
          }
        }

        .form-group {
          margin-bottom: 24px;
        }

        /* Mobile form group - REDUCED SPACING */
        @media (max-width: 768px) {
          .form-group {
            margin-bottom: 16px; /* Bring button closer */
          }
        }

        @media (max-width: 480px) {
          .form-group {
            margin-bottom: 12px; /* Even closer on small screens */
          }
        }

        .form-label {
          display: block;
          margin-bottom: 12px;
          color: white;
          font-weight: 700;
          font-size: 18px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.3);
          letter-spacing: 0.5px;
        }

        @media (max-width: 768px) {
          .form-label {
            font-size: 16px;
            margin-bottom: 10px;
          }
        }

        @media (max-width: 480px) {
          .form-label {
            font-size: 15px;
            margin-bottom: 8px;
          }
        }

        .form-input {
          width: 100%;
          padding: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.1);
          color: white;
          font-size: 16px;
          font-weight: 400;
          line-height: 1.6;
          transition: all 0.4s cubic-bezier(0.4, 0.0, 0.2, 1);
          box-sizing: border-box;
          backdrop-filter: blur(10px);
        }

        .form-input:focus {
          outline: none;
          border-color: #00d4aa;
          background: rgba(255, 255, 255, 0.2);
          box-shadow: 0 0 30px rgba(0, 212, 170, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2);
          transform: scale(1.01);
        }

        .form-input.xss-detected {
          border-color: #ff4757;
          background: rgba(255, 71, 87, 0.1);
          animation: shake 0.5s ease-in-out;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        .form-input::placeholder {
          color: rgba(255, 255, 255, 0.6);
          font-style: italic;
        }

        .form-textarea {
          width: 100%;
          min-height: 180px;
          resize: vertical;
          font-family: inherit;
          box-sizing: border-box;
        }

        /* Mobile textarea optimizations - LARGER AND MORE RECTANGULAR */
        @media (max-width: 768px) {
          .form-input {
            padding: 20px; /* More generous padding */
            font-size: 16px;
            border-radius: 18px; /* More rounded for better look */
          }
          
          .form-textarea {
            min-height: 220px; /* Larger rectangle */
            max-height: 280px; /* More space */
            resize: none;
            overflow-y: auto;
            line-height: 1.5;
          }
          
          .form-input:focus {
            transform: none;
          }
        }

        @media (max-width: 480px) {
          .form-input {
            padding: 18px; /* More comfortable padding */
            border-radius: 16px; /* Better rounded corners */
            font-size: 16px;
          }
          
          .form-textarea {
            min-height: 200px; /* Larger mobile rectangle */
            max-height: 250px; /* More generous space */
            line-height: 1.4;
          }
        }

        /* Very small screens - still larger */
        @media (max-width: 360px) {
          .form-textarea {
            min-height: 180px; /* Larger even on small screens */
            max-height: 220px;
          }
        }

        .character-count {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 12px;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.7);
        }

        /* Mobile character count - KEEP HORIZONTAL */
        @media (max-width: 768px) {
          .character-count {
            flex-direction: row; /* Keep horizontal layout */
            gap: 8px;
            align-items: center;
            font-size: 13px;
            flex-wrap: wrap; /* Allow wrapping if needed */
          }
          
          .character-count > div {
            flex-direction: row;
            gap: 15px !important; /* Reduced gap for mobile */
            align-items: center;
          }
        }

        @media (max-width: 480px) {
          .character-count {
            font-size: 12px;
            gap: 6px;
          }
          
          .character-count > div {
            gap: 10px !important; /* Even smaller gap */
          }
        }

        .security-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        @media (max-width: 768px) {
          .security-indicator {
            align-self: flex-end;
            margin-top: 4px;
          }
        }

        .security-safe {
          background: rgba(46, 213, 115, 0.2);
          color: #2ed573;
          border: 1px solid rgba(46, 213, 115, 0.3);
        }

        .security-unsafe {
          background: rgba(255, 71, 87, 0.2);
          color: #ff4757;
          border: 1px solid rgba(255, 71, 87, 0.3);
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          100% { opacity: 1; }
        }

        .btn {
          padding: 18px 36px;
          border: none;
          border-radius: 16px;
          font-size: 18px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.4, 0.0, 0.2, 1);
          text-transform: uppercase;
          letter-spacing: 1.2px;
          position: relative;
          overflow: hidden;
        }

        .btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.5s;
        }

        .btn:hover::before {
          left: 100%;
        }

        /* Mobile button optimizations */
        @media (max-width: 768px) {
          .btn {
            padding: 16px 28px;
            font-size: 16px;
            border-radius: 14px;
            letter-spacing: 0.8px;
          }
        }

        @media (max-width: 480px) {
          .btn {
            padding: 15px 24px;
            font-size: 15px;
            border-radius: 12px;
            letter-spacing: 0.5px;
          }
        }

        .btn-primary {
          background: linear-gradient(135deg, #00d4aa 0%, #00a085 50%, #007965 100%);
          color: white;
          box-shadow: 0 8px 25px rgba(0, 212, 170, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .btn-primary:hover:not(:disabled) {
          background: linear-gradient(135deg, #00a085 0%, #007965 50%, #005a4a 100%);
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 15px 40px rgba(0, 212, 170, 0.6);
        }

        /* Disable hover effects on mobile */
        @media (max-width: 768px) {
          .btn-primary:hover:not(:disabled) {
            transform: none;
            background: linear-gradient(135deg, #00d4aa 0%, #00a085 50%, #007965 100%);
            box-shadow: 0 8px 25px rgba(0, 212, 170, 0.4);
          }
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
          background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
          box-shadow: 0 4px 15px rgba(108, 117, 125, 0.3);
        }

        .success-popup, .error-popup {
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 16px 24px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          z-index: 2000;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          animation: slideInRight 0.4s cubic-bezier(0.4, 0.0, 0.2, 1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          max-width: 400px;
        }

        .success-popup {
          background: rgba(46, 213, 115, 0.95);
          color: white;
        }

        .error-popup {
          background: rgba(255, 71, 87, 0.95);
          color: white;
        }

        @media (max-width: 480px) {
          .success-popup, .error-popup {
            top: 15px;
            right: 15px;
            left: 15px;
            padding: 14px 18px;
            font-size: 14px;
            text-align: center;
            max-width: none;
          }
        }

        @keyframes slideInRight {
          0% {
            opacity: 0;
            transform: translateX(100%) scale(0.8);
          }
          100% {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }

        .scroll-indicator {
          position: fixed;
          right: 20px;
          top: 50%;
          transform: translateY(-50%);
          z-index: 1000;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        /* Hide scroll buttons on mobile - they're irritating */
        @media (max-width: 768px) {
          .scroll-indicator {
            display: none !important; /* Completely hide on tablets and mobile */
          }
        }

        /* Keep only for desktop users */
        @media (min-width: 769px) {
          .scroll-indicator {
            display: flex;
          }
        }

        .scroll-btn {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: rgba(0, 212, 170, 0.9);
          border: 2px solid rgba(255, 255, 255, 0.3);
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          transition: all 0.4s cubic-bezier(0.4, 0.0, 0.2, 1);
          backdrop-filter: blur(15px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
        }

        .scroll-btn:hover {
          background: rgba(0, 212, 170, 1);
          transform: scale(1.15);
          box-shadow: 0 10px 30px rgba(0, 212, 170, 0.5);
        }

        .scroll-btn.pulse {
          animation: pulseGlow 2.5s infinite;
        }

        @keyframes pulseGlow {
          0% {
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3), 0 0 0 0 rgba(0, 212, 170, 0.8);
          }
          70% {
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3), 0 0 0 25px rgba(0, 212, 170, 0);
          }
          100% {
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3), 0 0 0 0 rgba(0, 212, 170, 0);
          }
        }

        .scroll-progress {
          width: 6px;
          height: 120px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
          margin: 15px auto;
          position: relative;
          overflow: hidden;
        }

        .scroll-progress-bar {
          width: 100%;
          background: linear-gradient(to bottom, #00d4aa, #007965);
          border-radius: 3px;
          transition: height 0.2s ease;
          position: absolute;
          bottom: 0;
        }

        body {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
          font-family: 'Segoe UI', 'San Francisco', -apple-system, BlinkMacSystemFont, Tahoma, Geneva, Verdana, sans-serif;
          margin: 0;
          min-height: 100vh;
        }

        .header-title {
          background: linear-gradient(135deg, #fff 0%, #f0f0f0 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
        }

        .security-warning {
          background: rgba(255, 71, 87, 0.15);
          border: 1px solid rgba(255, 71, 87, 0.3);
          border-radius: 12px;
          padding: 12px 16px;
          margin-bottom: 16px;
          color: #ff4757;
          font-size: 14px;
          font-weight: 500;
          animation: slideInDown 0.3s ease;
        }

        @keyframes slideInDown {
          0% {
            opacity: 0;
            transform: translateY(-20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 768px) {
          .scroll-indicator {
            display: none !important; /* Hide completely on mobile */
          }
        }

        @media (max-width: 480px) {
          .scroll-indicator {
            display: none !important; /* Ensure hidden on small mobile */
          }
        }

        /* MOBILE TITLE FIX - Prevent title from wrapping */
        .title-container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          flex-wrap: nowrap;
        }

        @media (max-width: 480px) {
          .title-container {
            gap: 8px;
          }
        }

        /* MOBILE TEXT SIZE FIXES */
        .main-description {
          font-size: clamp(16px, 4vw, 20px);
          color: rgba(255,255,255,0.95);
          max-width: 700px;
          margin: 0 auto 15px;
          padding: 0 10px;
          font-weight: 500;
          line-height: 1.6;
        }

        @media (max-width: 768px) {
          .main-description {
            font-size: 16px;
            line-height: 1.5;
          }
        }

        @media (max-width: 480px) {
          .main-description {
            font-size: 14px;
            padding: 0 5px;
          }
        }

        .sub-description {
          font-size: clamp(14px, 3.5vw, 16px);
          color: rgba(255,255,255,0.8);
          max-width: 600px;
          margin: 0 auto 25px;
          padding: 0 10px;
          font-style: italic;
        }

        @media (max-width: 768px) {
          .sub-description {
            font-size: 14px;
          }
        }

        @media (max-width: 480px) {
          .sub-description {
            font-size: 13px;
            padding: 0 5px;
          }
        }

        .freedom-badge {
          display: inline-flex;
          align-items: center;
          padding: 12px 20px;
          background: rgba(46, 213, 115, 0.2);
          border: 1px solid rgba(46, 213, 115, 0.3);
          border-radius: 25px;
          color: #2ed573;
          font-size: 14px;
          font-weight: 600;
          backdrop-filter: blur(10px);
        }

        @media (max-width: 768px) {
          .freedom-badge {
            font-size: 13px;
            padding: 10px 16px;
          }
        }

        @media (max-width: 480px) {
          .freedom-badge {
            font-size: 12px;
            padding: 8px 14px;
            text-align: center;
          }
        }

        .footer-features {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 30px;
          flex-wrap: wrap;
        }

        @media (max-width: 768px) {
          .footer-features {
            gap: 20px;
            font-size: 14px;
          }
        }

        @media (max-width: 480px) {
          .footer-features {
            gap: 15px;
            font-size: 13px;
          }
          
          .footer-features span {
            flex-basis: calc(50% - 8px);
            text-align: center;
          }
        }

        .footer-quote {
          color: rgba(255,255,255,0.9);
          font-size: clamp(13px, 3vw, 15px);
          margin: 0;
          font-style: italic;
        }

        @media (max-width: 768px) {
          .footer-quote {
            font-size: 13px;
          }
        }

        @media (max-width: 480px) {
          .footer-quote {
            font-size: 12px;
          }
        }
      `}</style>

      <div style={{
        minHeight: '100vh',
        padding: '30px 20px', /* Reduced from 50px to bring content up */
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)'
      }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h1 style={{
              fontSize: 'clamp(1.6rem, 4.5vw, 3rem)', /* Reduced from 1.8rem */
              fontWeight: '900',
              marginBottom: '12px',
              textShadow: '0 4px 15px rgba(0,0,0,0.4)',
              letterSpacing: '-0.5px'
            }}>
              <div className="title-container">
                <span style={{
                  fontSize: 'clamp(1.4rem, 4vw, 2.8rem)', /* Reduced from 1.6rem */
                  color: '#4CAF50'
                }}>🔐</span>
                <span className="header-title" style={{ 
                  color: 'white',
                  whiteSpace: 'nowrap'
                }}>
                  Global Gss Confession
                </span>
              </div>
            </h1>

            <div style={{
              width: '80px',
              height: '4px',
              background: 'linear-gradient(90deg, #00d4aa, #007965)',
              margin: '0 auto 20px',
              borderRadius: '2px'
            }}></div>

            <p className="main-description">
              Share your deepest thoughts, feelings, and secrets in a completely safe and anonymous environment.
            </p>

            <p className="sub-description">
              Your identity will never be revealed. Express yourself freely without fear of judgment.
            </p>

            <div className="freedom-badge">
              <span style={{ marginRight: '8px' }}>⚠️</span>
              No names are banned currently - Full freedom of expression
            </div>
          </div>

          <div style={{
            maxWidth: '700px',
            margin: '0 auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div className="glass-effect" style={{
              padding: 'clamp(20px, 5vw, 35px)',
              marginBottom: '30px'
            }}>
              {/* XSS Warning */}
              {isXSSDetected && (
                <div className="security-warning">
                  🚨 <strong>Security Alert:</strong> Your confession contains potentially harmful content. Please remove any scripts, HTML tags, or suspicious code before submitting.
                </div>
              )}

              <div>
                <div className="form-group">
                  <label className="form-label">✍️ Your Anonymous Confession</label>
                  <textarea
                    className={`form-input form-textarea ${isXSSDetected ? 'xss-detected' : ''}`}
                    placeholder="Share your thoughts, secrets, or confessions in this safe space."
                    value={confession}
                    onChange={(e) => setConfession(e.target.value)}
                    maxLength={1500}
                    required
                  />

                  <div className="character-count">
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                      <span style={{
                        color: confession.length > 1400 ? '#ff4757' : 'rgba(255,255,255,0.7)',
                        fontWeight: '600'
                      }}>
                        📊 {confession.length}/1500 characters
                      </span>
                      <span style={{ color: 'rgba(255,255,255,0.7)' }}>
                        📝 {confession.trim().split(/\s+/).filter(word => word.length > 0).length} words
                      </span>
                    </div>

                    <div className={`security-indicator ${isXSSDetected ? 'security-unsafe' : 'security-safe'}`}>
                      {isXSSDetected ? (
                        <>🔒 UNSAFE</>
                      ) : (
                        <>✅ SECURE</>
                      )}
                    </div>
                  </div>
                </div>

                {message && message.includes('submitted') && (
                  <div style={{
                    background: 'rgba(46, 213, 115, 0.2)',
                    color: '#2ed573',
                    padding: '16px 20px',
                    borderRadius: '12px',
                    margin: '20px 0',
                    border: '1px solid rgba(46, 213, 115, 0.3)',
                    fontWeight: '600',
                    textAlign: 'center'
                  }}>
                    {message}
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  className="btn btn-primary"
                  disabled={isSubmitting || !confession.trim() || isXSSDetected}
                  style={{
                    width: '100%',
                    fontSize: 'clamp(16px, 4vw, 20px)',
                    marginTop: '8px' /* Reduced from 10px for mobile */
                  }}
                >
                  {isSubmitting ? (
                    <>🔄 Submitting Securely...</>
                  ) : (
                    <>🚀 Submit Anonymous Confession</>
                  )}
                </button>
              </div>
            </div>

            <div style={{
              textAlign: 'center',
              marginTop: '40px',
              color: 'rgba(255,255,255,0.8)',
              fontSize: 'clamp(14px, 3.5vw, 16px)',
              padding: '0 10px'
            }}>
              <div className="footer-features">
                <span>🔒 100% Anonymous</span>
                <span>🛡️ XSS Protected</span>
                <span>🚫 No Registration</span>
                <span>💚 Safe Space</span>
              </div>
            </div>

            <div style={{
              textAlign: 'center',
              marginTop: '50px',
              padding: 'clamp(20px, 5vw, 30px)',
              borderTop: '2px solid rgba(255,255,255,0.1)',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '16px',
              backdropFilter: 'blur(10px)'
            }}>
              <p className="footer-quote">
                "Sometimes the most healing thing you can do is speak your truth anonymously."
                <br />
                <strong>- Your thoughts matter, your privacy is protected.</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced Success Popup */}
        {showSuccessPopup && (
          <div className="success-popup">
            ✅ <strong>Success!</strong> Your confession has been submitted anonymously and securely.
          </div>
        )}

        {/* Enhanced Error Popup */}
        {showErrorPopup && (
          <div className="error-popup">
            ❌ <strong>Error:</strong> {message}
          </div>
        )}

        {/* Enhanced Scroll Indicator for All Devices */}
        {showScrollIndicator && (
          <div className="scroll-indicator">
            {scrollPosition > 20 && (
              <div
                className="scroll-btn pulse"
                onClick={scrollToTop}
                title="Scroll to top"
              >
                ↑
              </div>
            )}

            <div className="scroll-progress">
              <div
                className="scroll-progress-bar"
                style={{ height: `${Math.min(scrollPosition, 100)}%` }}
              />
            </div>

            {scrollPosition < 80 && (
              <div
                className="scroll-btn pulse"
                onClick={scrollToBottom}
                title="Scroll to bottom"
              >
                ↓
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}