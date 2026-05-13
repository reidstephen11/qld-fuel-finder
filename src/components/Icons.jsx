// Shared icon set — thin stroke, modern minimalist
const Icon = ({ children, size = 20, sw = 1.6, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth={sw}
       strokeLinecap="round" strokeLinejoin="round" style={style}>
    {children}
  </svg>
);

export const IconPin = (p) => <Icon {...p}><path d="M12 22s7-7 7-12a7 7 0 0 0-14 0c0 5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></Icon>;
export const IconNav = (p) => <Icon {...p}><path d="M3 11l18-8-8 18-2-8-8-2z"/></Icon>;
export const IconSearch = (p) => <Icon {...p}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></Icon>;
export const IconClose = (p) => <Icon {...p}><path d="M18 6L6 18M6 6l12 12"/></Icon>;
export const IconChevL = (p) => <Icon {...p}><path d="M15 6l-6 6 6 6"/></Icon>;
export const IconArrowR = (p) => <Icon {...p}><path d="M5 12h14M13 5l7 7-7 7"/></Icon>;
export const IconFuel = (p) => <Icon {...p}><path d="M3 22V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v17"/><path d="M3 14h11"/><path d="M14 8l3 0a2 2 0 0 1 2 2v8a2 2 0 0 0 2 2"/><path d="M19 6V4"/></Icon>;
export const IconCrosshair = (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/><circle cx="12" cy="12" r="2"/></Icon>;
export const IconSliders = (p) => <Icon {...p}><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3"/><path d="M1 14h6M9 8h6M17 16h6"/></Icon>;
export const IconStar = (p) => <Icon {...p}><path d="M12 2l3 7 7 .6-5.3 4.6 1.7 7-6.4-4-6.4 4 1.7-7L2 9.6 9 9z"/></Icon>;
export const IconShare = (p) => <Icon {...p}><circle cx="6" cy="12" r="3"/><circle cx="18" cy="6" r="3"/><circle cx="18" cy="18" r="3"/><path d="M8.6 10.5l6.8-3M8.6 13.5l6.8 3"/></Icon>;

// Brand-coloured badge for station rows
const BRAND_COLORS = {
  '7-Eleven':  ['#008c44', '#fff'],
  'BP':        ['#0d7c2c', '#fff'],
  'Shell':     ['#fcc200', '#000'],
  'Caltex':    ['#0c2e69', '#fff'],
  'Ampol':     ['#0033a0', '#fff'],
  'United':    ['#e21a23', '#fff'],
  'Liberty':   ['#1a1a1a', '#fff'],
  'Metro':     ['#ed1c24', '#fff'],
  'Coles Express': ['#e01a22', '#fff'],
  'Woolworths': ['#178a3b', '#fff'],
  'Mobil':     ['#003594', '#fff'],
  'EG':        ['#0066b2', '#fff'],
};

export function BrandBadge({ brand, size = 36 }) {
  const [bg, fg] = BRAND_COLORS[brand] || ['var(--surface-2)', 'var(--text)'];
  const initials = brand === '7-Eleven' ? '7E'
                 : brand && brand.length <= 2 ? brand
                 : (brand || '?').slice(0, 1);
  return (
    <div className="brand-badge" style={{
      width: size, height: size,
      borderRadius: size * 0.30,
      background: bg, color: fg,
      fontSize: size * 0.40,
    }}>
      {initials}
    </div>
  );
}

// Big tabular price display: e.g. 178.9¢/L
export function BigPrice({ price, size = 'lg', accent = false, unit = '¢/L' }) {
  // `price` is cents/L (e.g. 178.9). If it's in tenths-of-cents (data),
  // caller should convert first.
  const safe = price == null || isNaN(price) ? 0 : price;
  const whole = Math.floor(safe);
  const dec = Math.round((safe - whole) * 10);
  return (
    <span className={`bigprice sz-${size} ${accent ? 'accent' : ''}`}>
      <span className="whole">{whole}</span>
      <span className="dec">.{dec}</span>
      <span className="unit">{unit}</span>
    </span>
  );
}

export function TierDot({ tier }) {
  return <div className={`tier-dot ${tier || 'yellow'}`} />;
}
