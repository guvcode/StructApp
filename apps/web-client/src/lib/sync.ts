import { jwtDecode } from 'jwt-decode';
import { db } from '@/lib/db';

export type SyncResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error_code: string; message: string };

export type PendingDeficiencyPayload = {
  client_local_id: string;
  inspection_id: string;
  structure_id: string;
  previous_deficiency_id: string | null;
  component_type_id: string;
  component_notes?: string;
  description: string;
  severity?: number | null;
  probability?: number | null;
  consequences?: number | null;
  category?: string;
  sub_component?: string;
  focus_area?: string;
  deficiency_category?: string;
  detailed_description?: string;
  mechanisms?: string;
  vibration_present?: boolean;
  ndt_required?: boolean;
  further_investigation_required?: boolean;
  recommended_action?: string;
  consequence_severity?: number;
  likelihood?: string;
  most_affected_consequence?: string;
  priority_rating?: string;
  gps_latitude: number | null;
  gps_longitude: number | null;
};

export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwtDecode(token) as { exp?: number } | null;
    if (!decoded?.exp) return true;
    return Date.now() >= decoded.exp * 1000;
  } catch {
    return true;
  }
}

export async function syncWithAutoRefresh(
  accessToken: string,
  refreshToken: string,
): Promise<SyncResult> {
  let currentToken = accessToken;

  if (isTokenExpired(currentToken)) {
    const refreshResult = await refreshAccessToken(refreshToken);

    if (!refreshResult.success) {
      return {
        success: false,
        error_code: 'AUTH_EXPIRED',
        message: 'Both access and refresh tokens have expired. Please log in again.',
      };
    }

    if (refreshResult.data?.access_token) {
      currentToken = refreshResult.data.access_token;
    }

    const authState = await db.authState.get('current');
    if (authState) {
      await db.authState.update('current', { accessToken: currentToken });
    }
  }

  const response = await fetch('/api/v1/sync/push-outbox', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${currentToken}`,
    },
    body: JSON.stringify({
      deficiencies: await getPendingDeficiencies(),
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    return {
      success: false,
      error_code: error.error_code || 'SYNC_FAILED',
      message: error.message || 'Sync failed',
    };
  }

  const data = await response.json();
  return { success: true, data };
}

async function refreshAccessToken(refreshToken: string): Promise<SyncResult<{ access_token: string }>> {
  try {
    const response = await fetch('/api/v1/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      return {
        success: false,
        error_code: 'AUTH_EXPIRED',
        message: 'Unable to refresh token',
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch {
    return {
      success: false,
      error_code: 'AUTH_EXPIRED',
      message: 'Network error during token refresh',
    };
  }
}

export async function getPendingDeficiencies(): Promise<Array<PendingDeficiencyPayload>> {
  return db.deficiencies
    .where('syncState')
    .equals('Pending_Sync')
    .toArray()
    .then((records) =>
      records.map((r) => {
        const payload: PendingDeficiencyPayload = {
          client_local_id: r.localId?.toString() || crypto.randomUUID(),
          inspection_id: r.inspectionId,
          structure_id: r.structureId,
          previous_deficiency_id: r.previousDeficiencyId ?? null,
          component_type_id: r.componentTypeId || '',
          description: r.description,
          gps_latitude: r.gpsLatitude ?? null,
          gps_longitude: r.gpsLongitude ?? null,
        };
        if (r.severity !== undefined) payload.severity = r.severity;
        if (r.probability !== undefined) payload.probability = r.probability;
        if (r.consequences !== undefined) payload.consequences = r.consequences;
        if (r.componentNotes) payload.component_notes = r.componentNotes;
        if (r.category) payload.category = r.category;
        if (r.subComponent) payload.sub_component = r.subComponent;
        if (r.focusArea) payload.focus_area = r.focusArea;
        if (r.deficiencyCategory) payload.deficiency_category = r.deficiencyCategory;
        if (r.detailedDescription) payload.detailed_description = r.detailedDescription;
        if (r.mechanisms) payload.mechanisms = r.mechanisms;
        if (r.vibrationPresent !== undefined) payload.vibration_present = r.vibrationPresent;
        if (r.ndtRequired !== undefined) payload.ndt_required = r.ndtRequired;
        if (r.furtherInvestigationRequired !== undefined) payload.further_investigation_required = r.furtherInvestigationRequired;
        if (r.recommendedAction) payload.recommended_action = r.recommendedAction;
        if (r.consequenceSeverity !== undefined) payload.consequence_severity = r.consequenceSeverity;
        if (r.likelihood) payload.likelihood = r.likelihood;
        if (r.mostAffectedConsequence) payload.most_affected_consequence = r.mostAffectedConsequence;
        if (r.priorityRating) payload.priority_rating = r.priorityRating;
        return payload;
      }),
    );
}