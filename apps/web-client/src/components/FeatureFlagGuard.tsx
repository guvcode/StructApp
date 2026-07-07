import type { FeatureFlagId } from '../types/index';
import { isFeatureEnabled } from '../lib/featureFlags';
import NotFoundPage from '../pages/NotFoundPage';
import { Outlet } from 'react-router-dom';

interface Props {
  flagId: FeatureFlagId;
}

export default function FeatureFlagGuard({ flagId }: Props) {
  if (!isFeatureEnabled(flagId)) {
    return <NotFoundPage />;
  }
  return <Outlet />;
}