'use client';
import { useState } from 'react';

export default function HomePage() {
  const [confession, setConfession] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(''); // State to hold the submission message

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
    <div className="min-h-screen p-10 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
            Anonymous Confessions
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Share your thoughts, feelings, and secrets in a safe, anonymous space. 
            Your identity will never be revealed.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-10 shadow-2xl border border-white/20">
            <div onSubmit={handleSubmit}>
              <div className="mb-6">
                <label className="block text-white text-lg font-semibold mb-3">Your Confession</label>
                <textarea
                  className="w-full h-40 p-4 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/60 focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none resize-none"
                  placeholder="Share what's on your mind... (max 2000 characters)"
                  value={confession}
                  onChange={(e) => setConfession(e.target.value)}
                  maxLength={2000}
                  required
                />
                <div className="text-right text-sm text-white/60 mt-2">
                  {confession.length}/2000 characters
                </div>
              </div>

              {message && (
                <div className={`p-4 rounded-lg mb-6 ${
                  message.includes('submitted') 
                    ? 'bg-green-500/20 text-green-300 border border-green-400/30' 
                    : 'bg-red-500/20 text-red-300 border border-red-400/30'
                }`}>
                  {message}
                </div>
              )}

              <button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full py-4 text-lg font-semibold rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Anonymously'}
              </button>
            </div>
          </div>

          <div className="text-center mt-8 text-white/70 text-sm">
            <p>🔒 Completely anonymous • No registration required • Safe space</p>
          </div>

          {/* Hamro eShop Attribution */}
          <div className="text-center mt-10 pt-6 border-t border-white/20">
            <p className="text-white/80 text-lg mb-3">
              Powered by{' '}
              <a 
                href="https://www.hamroeshop.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-green-400 hover:text-green-300 font-bold underline transition-colors"
              >
                Hamro eShop
              </a>
            </p>
            <p className="text-white/60 text-sm mb-2">
              <span className="text-white/40">www.hamroeshop.com</span>
            </p>
            <p className="text-white/60 text-sm">
              <a 
                href="https://hamroeshop.com/about-us" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white/60 hover:text-white/80 underline transition-colors"
              >
                About Hamro eShop - ecommerce
              </a>
            </p>
            <p className="text-white/40 text-xs mt-1">
              hamroeshop.com/about-us
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
