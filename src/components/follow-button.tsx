'use client';

import { useState, useTransition } from 'react';
import { followFarmer, unfollowFarmer } from '@/server/actions/follows';

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
  const [isPending, startTransition] = useTransition();

  function toggle() {
    const next = !following;
    setFollowing(next);
    startTransition(async () => {
      try {
        if (next) await followFarmer(farmerUserId, storefrontPath);
        else await unfollowFarmer(farmerUserId, storefrontPath);
      } catch {
        setFollowing(!next);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
      className={`${following ? 'btn-ghost' : 'btn'} transition-colors duration-200 disabled:opacity-70 ${className}`}
    >
      {following ? '✓ Following' : '+ Follow Farm'}
    </button>
  );
}
