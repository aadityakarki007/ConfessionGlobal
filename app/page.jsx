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
  const forbiddenNames = [];


  useEffect(() => {
    const handleScroll = () => {
      const position = window.pageYOffset;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercentage = (position / maxScroll) * 100;

      setScrollPosition(scrollPercentage);

      // Show indicator on all devices
      setShowScrollIndicator(maxScroll > 100);
    };

    const handleResize = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      setShowScrollIndicator(maxScroll > 100);
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);

    // Initial check
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
    const response = await fetch('/api/confessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: confession }),
    });

    const data = await response.json();

    if (response.ok) {
      setMessage('Confession submitted successfully!');
      setShowSuccessPopup(true);
      setConfession('');

      setTimeout(() => {
        setShowSuccessPopup(false);
        setMessage('');
      }, 2500);
    } else {
      setMessage(data.error || 'Something went wrong');
    }
  } catch (error) {
    setMessage('Network error. Please try again.');
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

        /* Mobile container adjustments */
        @media (max-width: 768px) {
          .container {
            padding: 0 15px;
          }
        }

        @media (max-width: 480px) {
          .container {
            padding: 0 12px;
          }
        }

        .glass-effect {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        /* Mobile glass effect adjustments */
        @media (max-width: 768px) {
          .glass-effect {
            border-radius: 16px;
            margin: 0 8px;
          }
        }

        @media (max-width: 480px) {
          .glass-effect {
            border-radius: 12px;
            margin: 0 5px;
          }
        }

        .form-group {
          margin-bottom: 20px;
        }

        @media (max-width: 480px) {
          .form-group {
            margin-bottom: 16px;
          }
        }

        .form-label {
          display: block;
          margin-bottom: 8px;
          color: white;
          font-weight: 600;
          font-size: 16px;
        }

        @media (max-width: 480px) {
          .form-label {
            font-size: 14px;
            margin-bottom: 6px;
          }
        }

        .form-input {
          width: 100%;
          padding: 15px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.1);
          color: white;
          font-size: 16px;
          transition: all 0.3s ease;
          box-sizing: border-box;
        }

        .form-input:focus {
          outline: none;
          border-color: #4CAF50;
          background: rgba(255, 255, 255, 0.15);
          box-shadow: 0 0 20px rgba(76, 175, 80, 0.3);
        }

        .form-input::placeholder {
          color: rgba(255, 255, 255, 0.6);
        }

        .form-textarea {
          width: 100%;
          min-height: 150px;
          resize: vertical;
          font-family: inherit;
          box-sizing: border-box;
        }

        /* Mobile textarea optimizations */
        @media (max-width: 768px) {
          .form-input {
            padding: 12px;
            font-size: 16px; /* Prevents zoom on iOS */
            border-radius: 10px;
          }
          
          .form-textarea {
            min-height: 120px;
            height: auto;
            resize: none; /* Disable resize on mobile */
          }
        }

        @media (max-width: 480px) {
          .form-input {
            padding: 10px;
            border-radius: 8px;
          }
          
          .form-textarea {
            min-height: 100px;
          }
        }

        .btn {
          padding: 15px 30px;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        /* Mobile button optimizations */
        @media (max-width: 768px) {
          .btn {
            padding: 14px 25px;
            font-size: 15px;
            border-radius: 10px;
            letter-spacing: 0.5px;
          }
        }

        @media (max-width: 480px) {
          .btn {
            padding: 12px 20px;
            font-size: 14px;
            border-radius: 8px;
            letter-spacing: 0.3px;
          }
        }

        .btn-primary {
          background: linear-gradient(135deg, #4CAF50, #45a049);
          color: white;
          box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
        }

        .btn-primary:hover:not(:disabled) {
          background: linear-gradient(135deg, #45a049, #3d8b40);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(76, 175, 80, 0.4);
        }

        /* Disable hover effects on mobile */
        @media (max-width: 768px) {
          .btn-primary:hover:not(:disabled) {
            transform: none;
            background: linear-gradient(135deg, #4CAF50, #45a049);
            box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
          }
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .success {
          background: rgba(76, 175, 80, 0.2);
          color: #4CAF50;
          padding: 15px;
          border-radius: 8px;
          margin: 15px 0;
          border: 1px solid rgba(76, 175, 80, 0.3);
        }

        @media (max-width: 480px) {
          .success {
            padding: 12px;
            margin: 12px 0;
            font-size: 14px;
          }
        }

        .success-popup {
          position: fixed;
          top: 20px;
          right: 20px;
          background: #4CAF50;
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          z-index: 2000;
          border: 2px solid #45a049;
          box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
          animation: slideInRight 0.3s ease-out;
          white-space: nowrap;
        }

        @media (max-width: 480px) {
          .success-popup {
            top: 15px;
            right: 15px;
            left: 15px;
            right: 15px;
            padding: 10px 15px;
            font-size: 13px;
            white-space: normal;
            text-align: center;
          }
        }

        .success-popup-overlay {
          display: none;
        }

        @keyframes slideInRight {
          0% {
            opacity: 0;
            transform: translateX(100%);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .error-popup {
          position: fixed;
          top: 20px;
          right: 20px;
          background: #f44336;
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          z-index: 2000;
          border: 2px solid #d32f2f;
          box-shadow: 0 4px 12px rgba(244, 67, 54, 0.3);
          animation: slideInRight 0.3s ease-out;
          white-space: nowrap;
        }

        @media (max-width: 480px) {
          .error-popup {
            top: 15px;
            right: 15px;
            left: 15px;
            right: 15px;
            padding: 10px 15px;
            font-size: 13px;
            white-space: normal;
            text-align: center;
          }
        }

        .scroll-indicator {
          position: fixed;
          right: 15px;
          top: 50%;
          transform: translateY(-50%);
          z-index: 1000;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .scroll-btn {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: rgba(76, 175, 80, 0.9);
          border: 2px solid rgba(255, 255, 255, 0.3);
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        }

        .scroll-btn:hover {
          background: rgba(76, 175, 80, 1);
          transform: scale(1.1);
          box-shadow: 0 6px 25px rgba(76, 175, 80, 0.4);
        }

        .scroll-btn.pulse {
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% {
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3), 0 0 0 0 rgba(76, 175, 80, 0.7);
          }
          70% {
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3), 0 0 0 20px rgba(76, 175, 80, 0);
          }
          100% {
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3), 0 0 0 0 rgba(76, 175, 80, 0);
          }
        }

        .scroll-progress {
          width: 4px;
          height: 100px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 2px;
          margin: 10px auto;
          position: relative;
          overflow: hidden;
        }

        .scroll-progress-bar {
          width: 100%;
          background: linear-gradient(to bottom, #4CAF50, #45a049);
          border-radius: 2px;
          transition: height 0.1s ease;
          position: absolute;
          bottom: 0;
        }

        body {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 0;
          min-height: 100vh;
        }

        @media (max-width: 768px) {
          .scroll-indicator {
            right: 10px;
          }
          
          .scroll-btn {
            width: 45px;
            height: 45px;
            font-size: 18px;
          }
          
          .scroll-progress {
            height: 80px;
          }
        }

        @media (max-width: 480px) {
          .scroll-indicator {
            right: 8px;
          }
          
          .scroll-btn {
            width: 40px;
            height: 40px;
            font-size: 16px;
          }
          
          .scroll-progress {
            height: 60px;
          }
        }
      `}</style>

      <div style={{
        minHeight: '100vh',
        padding: '40px 20px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h1 style={{
              fontSize: 'clamp(1.5rem, 4vw, 2rem)',
              fontWeight: 'bold',
              color: 'white',
              marginBottom: '8px',
              textShadow: '0 2px 10px rgba(0,0,0,0.3)'
            }}>
              Global Science Confession 2025
            </h1>

            <p style={{
              fontSize: 'clamp(12px, 3.5vw, 15px)',
              color: 'rgba(255,255,255,0.9)',
              maxWidth: '600px',
              margin: '0 auto',
              padding: '0 10px'
            }}>
              Share your thoughts, feelings, and secrets in a safe, anonymous space.
              Your identity will never be revealed.
            </p>

            <p style={{
              fontSize: 'clamp(12px, 3vw, 14px)',
              color: 'rgba(255,255,255,0.7)',
              maxWidth: '600px',
              margin: '10px auto 0',
              padding: '0 10px',
              fontStyle: 'italic'
            }}>
              ⚠️ Note : No names are banned for now!
            </p>
          </div>

          <div style={{
            maxWidth: '600px',
            margin: '0 auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div className="glass-effect" style={{
              padding: 'clamp(15px, 4vw, 25px)',
              marginBottom: '20px'
            }}>
              <div onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Your Confession</label>
                  <textarea
                    className="form-input form-textarea"
                    placeholder="Share what's on your mind... (max 1500 characters)"
                    value={confession}
                    onChange={(e) => setConfession(e.target.value)}
                    maxLength={1500}
                    required
                  />
                  <div style={{
                    textAlign: 'right',
                    fontSize: 'clamp(12px, 3vw, 14px)',
                    color: 'rgba(255,255,255,0.6)',
                    marginTop: '8px'
                  }}>
                    {confession.length}/1500 characters
                  </div>
                </div>

                {message && message.includes('submitted') && (
                  <div className="success">
                    {message}
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  className="btn btn-primary"
                  disabled={isSubmitting}
                  style={{
                    width: '100%',
                    fontSize: 'clamp(14px, 4vw, 18px)'
                  }}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Anonymously'}
                </button>
              </div>
            </div>

            <div style={{
              textAlign: 'center',
              marginTop: '30px',
              color: 'rgba(255,255,255,0.7)',
              fontSize: 'clamp(12px, 3vw, 14px)',
              padding: '0 10px'
            }}>
              <p>🔒 Completely anonymous • No registration required • Safe space</p>
            </div>

            <div style={{
              textAlign: 'center',
              marginTop: '40px',
              padding: 'clamp(15px, 4vw, 20px)',
              borderTop: '1px solid rgba(255,255,255,0.1)'
            }}>
            </div>
          </div>
        </div>

        {/* Success Popup */}
        {showSuccessPopup && (
          <div className="success-popup">
            ✅ Confession submitted successfully!
          </div>
        )}

        {/* Error Popup */}
        {showErrorPopup && (
          <div className="error-popup">
            Sorry, you can't confess this. Invalid confession!
          </div>
        )}

        {/* Scroll Indicator for All Devices */}
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
                style={{ height: `${scrollPosition}%` }}
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