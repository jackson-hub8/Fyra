/// file: UnmatchedIndex.tsx
/// Jackson Hurley, Kaitlyn Maes, Cam Horine
/// Unmatched default view: profile card.

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProfileCard from '../components/ProfileCard';

export default function UnmatchedIndex() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.email) {
      navigate('/');
      return;
    }
  }, [user, navigate]);

  if (!user?.email) return null;

  return <ProfileCard email={user.email} />;
}
