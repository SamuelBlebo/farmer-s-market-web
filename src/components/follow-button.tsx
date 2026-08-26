'use client';

import { useState, useTransition } from 'react';
import { followFarmer, unfollowFarmer } from '@/server/actions/follows';
import { useToast } from './toast-provider';

export function FollowButton({
  farmerUserId,
  storefrontPath,
  initialFollowing,
  className = '',
}: {
  farmerUserId: string;
  storefrontPath: string;
  initialFollowing: boolean;
  className?: string;
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [pulse, setPulse] = useState(false);
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  function toggle() {
    const next = !following;
    setFollowing(next);
    setPulse(true);
    setTimeout(() => setPulse(false), 200);

    startTransition(async () => {
      try {
        if (next) await followFarmer(farmerUserId, storefrontPath);
        else await unfollowFarmer(farmerUserId, storefrontPath);
        toast.success(next ? 'Followed farm' : 'Unfollowed farm');
      } catch {
        setFollowing(!next);
        toast.error('Could not update — try again.');
      }
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
      aria-pressed={following}
      className={`${following ? 'btn-ghost' : 'btn'} transition-colors duration-200 disabled:opacity-70 ${
        pulse ? 'scale-105' : 'scale-100'
      } transition-transform ${className}`}
    >
      {following ? '✓ Following' : '+ Follow Farm'}
    </button>
  );
}
