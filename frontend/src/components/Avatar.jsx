import { api } from '../services/api';

export default function Avatar({ name = 'User', src, size = 42 }) {
  // Support both Supabase URLs (start with 'http') and local URLs
  const photoUrl = src?.startsWith('http')
    ? src
    : src
      ? `${api.baseUrl}${src}`
      : null;

  return photoUrl
    ? <img src={photoUrl} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} />
    : <div style={{ width: size, height: size, borderRadius: '50%', background: '#ccfbf1', color: '#115e59', display: 'grid', placeItems: 'center', fontWeight: 800 }}>
        {name.slice(0, 1).toUpperCase()}
      </div>;
}