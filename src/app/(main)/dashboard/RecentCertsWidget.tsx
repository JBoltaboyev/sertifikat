"use client";

import { useState } from "react";

type TimeRange = 'all' | '1y' | '6m' | '3m' | '1m';

export default function RecentCertsWidget({ certDates, totalCertificates }: { certDates: string[], totalCertificates: number }) {
  const [range, setRange] = useState<TimeRange>('all');
  
  const getFilteredCount = () => {
    const total = Math.max(totalCertificates, certDates.length);
    if (range === 'all') return total;
    
    const now = new Date();
    let cutoff = new Date();
    if (range === '1y') cutoff.setFullYear(now.getFullYear() - 1);
    else if (range === '6m') cutoff.setMonth(now.getMonth() - 6);
    else if (range === '3m') cutoff.setMonth(now.getMonth() - 3);
    else if (range === '1m') cutoff.setMonth(now.getMonth() - 1);

    const filtered = certDates.filter(d => {
      if (!d) return false;
      const date = new Date(d);
      return date >= cutoff;
    }).length;

    return Math.min(filtered, total);
  };

  const count = getFilteredCount();

  return (
    <div className="card glass" style={{ height: '220px', display: 'flex', flexDirection: 'column' }}>
      <div className="card-body" style={{ display: 'flex', flexDirection: 'column', padding: '1rem', height: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 'auto', gap: '0.5rem' }}>
          <h3 style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600 }}>Jami Sertifikatlar</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', justifyContent: 'center' }}>
            {[
              { value: 'all', label: 'Barchasi' },
              { value: '1y', label: '1 yil' },
              { value: '6m', label: '6 oy' },
              { value: '3m', label: '3 oy' },
              { value: '1m', label: '1 oy' }
            ].map(item => (
              <button
                key={item.value}
                onClick={() => setRange(item.value as TimeRange)}
                style={{
                  fontSize: '0.7rem',
                  padding: '0.25rem 0.6rem',
                  borderRadius: '1rem',
                  border: '1px solid',
                  borderColor: range === item.value ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                  cursor: 'pointer',
                  backgroundColor: range === item.value ? 'var(--primary)' : 'transparent',
                  color: range === item.value ? '#fff' : 'var(--text-muted)',
                  fontWeight: range === item.value ? 600 : 400,
                  transition: 'all 0.2s ease'
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
          <p style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--success)' }}>{count}</p>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {range === 'all' ? 'Umumiy miqdor' : 
             range === '1y' ? 'Oxirgi 1 yilda olingan' : 
             range === '6m' ? 'Oxirgi 6 oyda olingan' : 
             range === '3m' ? 'Oxirgi 3 oyda olingan' : 'Oxirgi 1 oyda olingan'}
          </span>
        </div>
      </div>
    </div>
  );
}
