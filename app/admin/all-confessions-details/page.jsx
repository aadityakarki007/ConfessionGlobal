// app/admin/all-confessions-details/page.jsx
'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function AllConfessionsDetails() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const userRoles = user?.publicMetadata?.roles || [];
  const hasConfessRole = userRoles.includes('confess');

  const [confessions, setConfessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState(null);
  const [searchIP, setSearchIP] = useState('');

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      setError('Please sign in to access this page.');
      setLoading(false);
      return;
    }

    if (!hasConfessRole) {
      setError('Access denied. Only confess users can access the database.');
      setLoading(false);
      return;
    }

    fetchConfessions();
  }, [isLoaded, isSignedIn, hasConfessRole]);

  const fetchConfessions = async () => {
    try {
      const res = await fetch('/api/admin/confessions/all-details');
      const data = await res.json();
      if (data.success) {
        setConfessions(data.confessions);
        setSummary(data.summary);
      } else {
        setError(data.error || 'Failed to fetch confessions');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredConfessions = confessions.filter((confession) => {
    if (!searchIP.trim()) return true;
    return confession.ipAddress?.toLowerCase().includes(searchIP.trim().toLowerCase());
  });

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;
  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '40px 20px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ background: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 15px 40px rgba(0,0,0,0.08)' }}>
            <h1 style={{ fontSize: '2rem', color: '#333', marginBottom: '16px' }}>Access Denied</h1>
            <p style={{ fontSize: '16px', color: '#555', marginBottom: '24px' }}>{error}</p>
            <button
              onClick={() => router.push('/admin')}
              style={{
                background: '#007bff',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Return to Admin Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '40px 20px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '2.5rem', color: '#1a1a1a', marginBottom: '10px' }}>
            📊 All Confessions Database Details
          </h1>
          <p style={{ fontSize: '16px', color: '#666' }}>Complete view of all data stored in the database</p>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginBottom: '40px'
          }}>
            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Total Confessions</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#008cba' }}>{summary.read + summary.unread}</div>
            </div>
            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Read</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#4caf50' }}>{summary.read}</div>
            </div>
            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Unread</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ff6b6b' }}>{summary.unread}</div>
            </div>
          </div>
        )}

        {/* Categories */}
        {summary && (
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            marginBottom: '40px'
          }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#333' }}>By Category</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '15px' }}>
              {Object.entries(summary.byCategory).map(([cat, count]) => (
                <div key={cat} style={{
                  background: '#f8f9fa',
                  padding: '12px',
                  borderRadius: '8px',
                  textAlign: 'center',
                  borderLeft: '4px solid #008cba'
                }}>
                  <div style={{ fontSize: '12px', color: '#666', textTransform: 'capitalize', marginBottom: '5px' }}>{cat}</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>{count}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Confessions Table */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #eee' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '15px', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '20px', color: '#333' }}>
                  Detailed Records ({filteredConfessions.length})
                </h2>
                {searchIP.trim() && (
                  <div style={{ marginTop: '6px', color: '#555', fontSize: '13px' }}>
                    Showing results for <strong>{searchIP.trim()}</strong>
                  </div>
                )}
              </div>
              <div style={{ flex: '1 1 320px', minWidth: '220px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '6px' }}>Search by IP address</label>
                <input
                  value={searchIP}
                  onChange={(e) => setSearchIP(e.target.value)}
                  placeholder="Enter IP address or partial match"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1px solid #d1d5db',
                    outline: 'none',
                    fontSize: '14px',
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.06)'
                  }}
                />
              </div>
            </div>
          </div>

          {confessions.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>No confessions found</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              {confessions.map((confession, idx) => (
                <div
                  key={confession._id}
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '18px',
                    padding: '20px',
                    background: '#fff',
                    margin: '0 16px 16px',
                    boxShadow: '0 10px 20px rgba(0, 0, 0, 0.04)',
                    transition: 'transform 0.2s, box-shadow 0.2s, background 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#f8fbff';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 14px 30px rgba(0, 0, 0, 0.06)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = '#fff';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.04)';
                  }}
                >
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                      #{confession.position} | {confession.createdAt}
                    </div>
                    <div style={{
                      display: 'inline-block',
                      background: confession.isRead ? '#d1fae5' : '#fee2e2',
                      color: confession.isRead ? '#065f46' : '#991b1b',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {confession.isRead ? '✓ Read' : '◐ Unread'}
                    </div>
                  </div>

                  {/* Content */}
                  <div style={{
                    background: '#f5f5f5',
                    padding: '15px',
                    borderRadius: '8px',
                    marginBottom: '15px',
                    borderLeft: '4px solid #008cba',
                    maxHeight: '150px',
                    overflow: 'auto'
                  }}>
                    <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#333', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {confession.content}
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '15px'
                  }}>
                    {/* Basic Info */}
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: '#666', textTransform: 'uppercase', marginBottom: '8px' }}>Category</div>
                      <div style={{ fontSize: '13px', color: '#333', textTransform: 'capitalize' }}>{confession.category}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: '#666', textTransform: 'uppercase', marginBottom: '8px' }}>Content Length</div>
                      <div style={{ fontSize: '13px', color: '#333' }}>{confession.contentLength} characters</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: '#666', textTransform: 'uppercase', marginBottom: '8px' }}>LocalStorage Available</div>
                      <div style={{ fontSize: '13px', color: '#333' }}>{confession.hasLocalStorage ? '✓ Yes' : '✗ No'}</div>
                    </div>

                    {/* IP Address */}
                    <div style={{ gridColumn: '1 / -1' }}>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: '#666', textTransform: 'uppercase', marginBottom: '8px' }}>IP Address</div>
                      <code style={{
                        display: 'block',
                        background: '#f0f0f0',
                        padding: '8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        color: '#333',
                        fontFamily: 'Monaco, monospace',
                        wordBreak: 'break-all'
                      }}>
                        {confession.ipAddress}
                      </code>
                    </div>

                    {/* User Agent */}
                    <div style={{ gridColumn: '1 / -1' }}>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: '#666', textTransform: 'uppercase', marginBottom: '8px' }}>User Agent</div>
                      <code style={{
                        display: 'block',
                        background: '#f0f0f0',
                        padding: '8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        color: '#333',
                        fontFamily: 'Monaco, monospace',
                        wordBreak: 'break-all',
                        maxHeight: '60px',
                        overflow: 'auto',
                        lineHeight: '1.3'
                      }}>
                        {confession.userAgent}
                      </code>
                    </div>

                    {/* Fingerprint */}
                    <div style={{ gridColumn: '1 / -1' }}>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: '#666', textTransform: 'uppercase', marginBottom: '8px' }}>Browser Fingerprint</div>
                      <code style={{
                        display: 'block',
                        background: '#f0f0f0',
                        padding: '8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        color: '#333',
                        fontFamily: 'Monaco, monospace',
                        wordBreak: 'break-all'
                      }}>
                        {confession.fingerprintFull || 'N/A'}
                      </code>
                    </div>

                    {/* Tracking ID */}
                    <div style={{ gridColumn: '1 / -1' }}>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: '#666', textTransform: 'uppercase', marginBottom: '8px' }}>Tracking ID (Cookie)</div>
                      <code style={{
                        display: 'block',
                        background: '#f0f0f0',
                        padding: '8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        color: '#333',
                        fontFamily: 'Monaco, monospace',
                        wordBreak: 'break-all'
                      }}>
                        {confession.trackingIdFull || 'N/A'}
                      </code>
                    </div>

                    {/* LocalStorage ID */}
                    <div style={{ gridColumn: '1 / -1' }}>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: '#666', textTransform: 'uppercase', marginBottom: '8px' }}>LocalStorage ID</div>
                      <code style={{
                        display: 'block',
                        background: '#f0f0f0',
                        padding: '8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        color: '#333',
                        fontFamily: 'Monaco, monospace',
                        wordBreak: 'break-all'
                      }}>
                        {confession.localStorageIdFull || 'N/A'}
                      </code>
                    </div>

                    {/* MongoDB ID */}
                    <div style={{ gridColumn: '1 / -1' }}>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: '#666', textTransform: 'uppercase', marginBottom: '8px' }}>MongoDB ID</div>
                      <code style={{
                        display: 'block',
                        background: '#f0f0f0',
                        padding: '8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        color: '#333',
                        fontFamily: 'Monaco, monospace',
                        wordBreak: 'break-all'
                      }}>
                        {confession._id}
                      </code>
                    </div>

                    {/* Timestamps */}
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: '#666', textTransform: 'uppercase', marginBottom: '8px' }}>Created</div>
                      <div style={{ fontSize: '12px', color: '#333' }}>{confession.createdAt}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: '#666', textTransform: 'uppercase', marginBottom: '8px' }}>Last Updated</div>
                      <div style={{ fontSize: '12px', color: '#333' }}>{confession.updatedAt}</div>
                    </div>
                    {confession.trackingTimestamp && (
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#666', textTransform: 'uppercase', marginBottom: '8px' }}>Tracking Timestamp</div>
                        <div style={{ fontSize: '12px', color: '#333' }}>{new Date(confession.trackingTimestamp).toLocaleString()}</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
