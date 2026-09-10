import React, { useEffect, useState } from 'react';
import { getDataMode, subscribeDataMode } from '../../services/dataService';

export function DataBadge() {
  const [mode, setMode] = useState(getDataMode());

  useEffect(() => {
    return subscribeDataMode((m) => setMode(m));
  }, []);

  const isLive = mode === 'LIVE';

  return (
    <div
      className={`d-none d-sm-inline-flex align-items-center gap-1.5 px-2.5 py-1 rounded-pill fs-8 fw-bold border ${
        isLive
          ? 'bg-success-subtle text-success border-success-subtle'
          : 'bg-warning-subtle text-warning-emphasis border-warning-subtle'
      }`}
      title={isLive ? 'Connected to MongoDB API' : 'Using Local Demo & Offline Storage'}
      style={{ cursor: 'help' }}
    >
      <span
        className={`rounded-circle d-inline-block ${isLive ? 'bg-success' : 'bg-warning'}`}
        style={{ width: 7, height: 7 }}
      ></span>
      <span>{isLive ? 'LIVE' : 'DEMO MODE'}</span>
    </div>
  );
}
