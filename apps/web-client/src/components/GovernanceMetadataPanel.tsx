import type { Inspection, Deficiency } from '../types/index';
import { InspectionStatus } from '../types/index';

interface Props {
  inspection?: Inspection | null;
  deficiency?: Deficiency | null;
}

export function GovernanceMetadataPanel({ inspection, deficiency }: Props) {
  const hasReturn = inspection?.status === InspectionStatus.Returned && inspection.return_reason;
  const hasApproved = inspection?.approved_by && inspection.approved_at;
  const hasReopen = inspection?.reopened_by && inspection.reopened_at;
  const hasOverrideDeficiency = deficiency?.override_priority_tier;

  return (
    <div className="space-y-3">
      {hasApproved && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-xs text-green-700 uppercase tracking-wide font-semibold">Approved</p>
          <p className="text-sm text-green-800 mt-1">By: {inspection.approved_by}</p>
          <p className="text-sm text-green-700">At: {new Date(inspection.approved_at!).toLocaleString()}</p>
        </div>
      )}

      {hasReturn && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-xs text-red-700 uppercase tracking-wide font-semibold">Returned</p>
          <p className="text-sm text-red-800 mt-1">Reason: {inspection.return_reason}</p>
        </div>
      )}

      {hasReopen && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-700 uppercase tracking-wide font-semibold">Reopened</p>
          <p className="text-sm text-blue-800 mt-1">By: {inspection.reopened_by}</p>
          <p className="text-sm text-blue-700">Reason: {inspection.reopen_reason}</p>
          <p className="text-sm text-blue-700">At: {new Date(inspection.reopened_at!).toLocaleString()}</p>
        </div>
      )}

      {hasOverrideDeficiency && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
          <p className="text-xs text-purple-700 uppercase tracking-wide font-semibold">Priority Override</p>
          <p className="text-sm text-purple-800 mt-1">Overridden to: {deficiency!.override_priority_tier}</p>
          {deficiency!.override_justification && <p className="text-sm text-purple-700">Justification: {deficiency!.override_justification}</p>}
          {deficiency!.override_by && <p className="text-sm text-purple-700">By: {deficiency!.override_by}</p>}
          {deficiency!.override_at && <p className="text-sm text-purple-700">At: {new Date(deficiency!.override_at).toLocaleString()}</p>}
        </div>
      )}

      {!hasApproved && !hasReturn && !hasReopen && !hasOverrideDeficiency && (
        <p className="text-sm text-text-secondary italic">No governance actions recorded.</p>
      )}
    </div>
  );
}