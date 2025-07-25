'use client';
import { useState } from 'react';

export default function HomePage() {
  const [confession, setConfession] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!confession.trim()) {
      setMessage('Please enter your confession');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      const response = await fetch('/api/confessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: confession }), // no category
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Your confession has been submitted anonymously!');
        setConfession('');
      } else {
        setMessage(data.error || 'Something went wrong');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', padding: '40px 20px' }}>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ 
            fontSize: '3rem', 
            fontWeight: 'bold', 
            color: 'white', 
            marginBottom: '16px',
            textShadow: '0 2px 10px rgba(0,0,0,0.3)'
          }}>
            Anonymous Confessions
          </h1>
          <p style={{ 
            fontSize: '1.2rem', 
            color: 'rgba(255,255,255,0.9)',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            Share your thoughts, feelings, and secrets in a safe, anonymous space. 
            Your identity will never be revealed.
          </p>
        </div>

        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div className="glass-effect" style={{ padding: '40px' }}>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Your Confession</label>
                <textarea
                  className="form-input form-textarea"
                  placeholder="Share what's on your mind... (max 2000 characters)"
                  value={confession}
                  onChange={(e) => setConfession(e.target.value)}
                  maxLength={2000}
                  required
                />
                <div style={{ 
                  textAlign: 'right', 
                  fontSize: '14px', 
                  color: 'rgba(255,255,255,0.6)',
                  marginTop: '8px'
                }}>
                  {confession.length}/2000 characters
                </div>
              </div>

              {message && (
                <div className={message.includes('submitted') ? 'success' : 'error'}>
                  {message}
                </div>
              )}

              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={isSubmitting}
                style={{ width: '100%', fontSize: '18px' }}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Anonymously'}
              </button>
            </form>
          </div>

          <div style={{ 
            textAlign: 'center', 
            marginTop: '30px',
            color: 'rgba(255,255,255,0.7)',
            fontSize: '14px'
          }}>
            <p>🔒 Completely anonymous • No registration required • Safe space</p>
          </div>
        </div>
      </div>
    </div>
  );
}
