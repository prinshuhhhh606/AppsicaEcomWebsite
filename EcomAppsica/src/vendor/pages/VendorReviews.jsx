import React, { useState, useEffect } from 'react';
import {
  Star,
  MessageSquare,
  ThumbsUp,
  CornerDownRight,
  Send,
  RefreshCw,
  CheckCircle,
  ExternalLink,
  Package
} from 'lucide-react';
import { vendorService } from '../../services/vendorService';

export default function VendorReviews() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [replyInput, setReplyInput] = useState({});
  const [submittingReply, setSubmittingReply] = useState({});
  const [successMsg, setSuccessMsg] = useState('');

  const loadReviews = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await vendorService.getReviews();
      setData(res);
    } catch (err) {
      setError(err?.message || 'Failed to load customer reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const reviews = data?.reviews || [];
  const totalReviews = data?.totalReviews || 0;
  const avgRating = data?.averageRating || 5.0;
  const distribution = data?.ratingsDistribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

  const handleReplySubmit = async (reviewId) => {
    const text = replyInput[reviewId];
    if (!text || !text.trim()) return;

    setSubmittingReply((prev) => ({ ...prev, [reviewId]: true }));
    try {
      await vendorService.replyReview(reviewId, text.trim());
      setSuccessMsg('Your reply has been published to the review!');
      setReplyInput((prev) => ({ ...prev, [reviewId]: '' }));
      loadReviews();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err?.message || 'Failed to publish review reply');
    } finally {
      setSubmittingReply((prev) => ({ ...prev, [reviewId]: false }));
    }
  };

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: '0 0 0.25rem 0' }}>
            Customer Reviews & Ratings
          </h2>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.9rem' }}>
            Read customer feedback on your products, respond to inquiries, and build store trust.
          </p>
        </div>

        <button className="vp-btn vp-btn-secondary" onClick={loadReviews} disabled={loading}>
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Reviews</span>
        </button>
      </div>

      {successMsg && (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            color: '#6ee7b7',
            padding: '0.85rem 1rem',
            borderRadius: '10px',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <CheckCircle size={18} /> {successMsg}
        </div>
      )}

      {error && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#f87171',
            padding: '0.85rem 1rem',
            borderRadius: '10px',
            marginBottom: '1.5rem',
          }}
        >
          {error}
        </div>
      )}

      {/* RATING BREAKDOWN CARD */}
      <div className="vendor-card" style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '2rem', alignItems: 'center' }}>
          {/* Left score */}
          <div
            style={{
              textAlign: 'center',
              padding: '1.5rem',
              background: 'rgba(10, 15, 29, 0.8)',
              borderRadius: '14px',
              border: '1px solid rgba(148, 163, 184, 0.12)',
            }}
          >
            <div style={{ fontSize: '3.2rem', fontWeight: 900, color: '#fff', lineHeight: 1 }}>
              {avgRating}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', color: '#fbbf24', margin: '0.5rem 0' }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={18}
                  fill={s <= Math.round(avgRating) ? '#fbbf24' : 'transparent'}
                  style={{ opacity: s <= Math.round(avgRating) ? 1 : 0.4 }}
                />
              ))}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
              Based on <strong>{totalReviews}</strong> customer reviews
            </div>
          </div>

          {/* Right star bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[5, 4, 3, 2, 1].map((star) => {
              const count = distribution[star] || 0;
              const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
              return (
                <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ width: '45px', fontSize: '0.82rem', color: '#cbd5e1', fontWeight: 600 }}>
                    {star} Star
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: '8px',
                      background: '#1e293b',
                      borderRadius: '999px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${pct}%`,
                        height: '100%',
                        background: star >= 4 ? '#fbbf24' : star === 3 ? '#60a5fa' : '#f87171',
                        borderRadius: '999px',
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                  <span style={{ width: '35px', textAlign: 'right', fontSize: '0.78rem', color: '#94a3b8' }}>
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* REVIEWS LIST */}
      <div className="vendor-card" style={{ padding: 0 }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(148, 163, 184, 0.12)' }}>
          <h3 className="vendor-card-title">
            <MessageSquare size={18} style={{ color: '#818cf8' }} /> Customer Feedback Stream
          </h3>
        </div>

        {reviews.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem', color: '#94a3b8' }}>
            <MessageSquare size={40} style={{ margin: '0 auto 0.5rem', color: '#475569' }} />
            <p style={{ margin: 0 }}>No customer reviews written yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {reviews.map((r) => (
              <div
                key={r._id}
                style={{
                  padding: '1.5rem',
                  borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
                }}
              >
                {/* Product row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <img
                    src={
                      r.product?.image ||
                      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=60&q=80'
                    }
                    alt={r.product?.name}
                    style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover' }}
                  />
                  <div>
                    <span style={{ fontWeight: 600, color: '#fff', fontSize: '0.88rem' }}>
                      {r.product?.name}
                    </span>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>
                      Reviewed by <strong>{r.userName}</strong> on{' '}
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Stars and Title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                  <div style={{ display: 'flex', color: '#fbbf24' }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={15}
                        fill={s <= r.rating ? '#fbbf24' : 'transparent'}
                        style={{ opacity: s <= r.rating ? 1 : 0.3 }}
                      />
                    ))}
                  </div>
                  {r.title && (
                    <strong style={{ color: '#fff', fontSize: '0.92rem' }}>
                      {r.title}
                    </strong>
                  )}
                </div>

                {/* Comment */}
                <p style={{ margin: '0 0 0.85rem 0', color: '#cbd5e1', fontSize: '0.88rem', lineHeight: '1.5' }}>
                  "{r.comment}"
                </p>

                {/* Helpful count */}
                <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <ThumbsUp size={13} /> {r.helpful || 0} customers found this review helpful
                </div>

                {/* Existing Vendor Reply */}
                {r.vendorReply && r.vendorReply.text && (
                  <div
                    style={{
                      marginTop: '1rem',
                      marginLeft: '1.5rem',
                      padding: '0.85rem 1rem',
                      background: 'rgba(99, 102, 241, 0.08)',
                      borderLeft: '3px solid #6366f1',
                      borderRadius: '0 8px 8px 0',
                    }}
                  >
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#818cf8', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <CornerDownRight size={14} /> Official Store Response:
                    </div>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#e2e8f0', lineHeight: 1.4 }}>
                      {r.vendorReply.text}
                    </p>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginTop: '0.25rem' }}>
                      Replied on {new Date(r.vendorReply.repliedAt || Date.now()).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {/* Reply Form */}
                <div style={{ marginTop: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', maxWidth: '650px' }}>
                    <input
                      type="text"
                      className="vp-input"
                      placeholder={r.vendorReply?.text ? 'Update your reply...' : 'Write an official store reply to this customer...'}
                      value={replyInput[r._id] || ''}
                      onChange={(e) => setReplyInput({ ...replyInput, [r._id]: e.target.value })}
                      style={{ padding: '0.55rem 0.85rem', fontSize: '0.84rem' }}
                    />
                    <button
                      className="vp-btn vp-btn-primary vp-btn-sm"
                      onClick={() => handleReplySubmit(r._id)}
                      disabled={submittingReply[r._id] || !replyInput[r._id]?.trim()}
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      <Send size={14} /> {r.vendorReply?.text ? 'Update' : 'Reply'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
