// The signature system: every module keeps one color everywhere it appears
// (sidebar icon, card border, badges) so users build spatial memory of the hub.
export const MODULE_COLORS = {
  feed: 'var(--color-mod-feed)',
  complaints: 'var(--color-mod-complaints)',
  events: 'var(--color-mod-events)',
  clubs: 'var(--color-mod-clubs)',
  marketplace: 'var(--color-mod-marketplace)',
  lostfound: 'var(--color-mod-lostfound)',
  resources: 'var(--color-mod-resources)',
  opportunities: 'var(--color-mod-opportunities)',
};

export const STATUS_COLORS = {
  // Complaints
  Submitted: '#94a3b8',
  'Under Review': '#f5a623',
  Assigned: '#2f80ed',
  'In Progress': '#9b51e0',
  Resolved: '#0f9d8c',
  Closed: '#475569',
  // Lost & found / marketplace
  Lost: '#e6533c',
  Found: '#0f9d8c',
  Claimed: '#f5a623',
  Available: '#0f9d8c',
  Reserved: '#f5a623',
  Sold: '#94a3b8',
  // Priority
  Low: '#94a3b8',
  Medium: '#f5a623',
  High: '#e6533c',
  Critical: '#b91c1c',
};
