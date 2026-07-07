import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '../../services/api/apiClient';
import { ENDPOINTS } from '../../services/api/endpoints';
import { calculateGlencoreRisk } from '../../utils/riskCalculator';
import Skeleton from '../../components/Skeleton';

const TAXONOMY: Record<string, Array<{ label: string; children: Array<{ label: string; children: Array<{ label: string; children: Array<{ label: string; children: Array<{ label: string }> }> }> }> }>> = {
  'Building Envelope': [
    { label: 'Roofing', children: [{ label: 'Membrane', children: [{ label: 'Waterproofing', children: [{ label: 'Blistering', children: [{ label: 'Localized blistering on roof membrane' }] }, { label: 'Tears/Punctures', children: [{ label: 'Mechanical damage to membrane' }] }] }] }, { label: 'Drainage', children: [{ label: 'Ponding Water', children: [{ label: 'Standing water > 48hrs', children: [{ label: 'Ponding water on low-slope roof' }] }] }] }] },
    { label: 'Cladding', children: [{ label: 'Panel Seals', children: [{ label: 'Joint Sealant Failure', children: [{ label: 'Cracked/separated sealant', children: [{ label: 'Sealant失效 at panel joints' }] }] }] }] },
    { label: 'Coating', children: [{ label: 'Paint System', children: [{ label: 'Coating Failure', children: [{ label: 'Peeling/Delamination', children: [{ label: 'Paint peeling on exposed steel' }] }] }] }] },
  ],
  'Structural Support': [
    { label: 'Steel Framing', children: [{ label: 'Columns', children: [{ label: 'Welded Connections', children: [{ label: 'Fatigue Crack', children: [{ label: 'Hairline crack at weld toe' }] }, { label: 'Corrosion at Base', children: [{ label: 'Section loss at column base plate' }] }] }] }, { label: 'Bolted Connections', children: [{ label: 'Loose Bolts', children: [{ label: 'Multiple loose anchor bolts', children: [{ label: 'Anchor bolts below specified torque' }] }] }] }] },
    { label: 'Cable System', children: [{ label: 'Suspension Cables', children: [{ label: 'Corrosion Protection', children: [{ label: 'Corrosion', children: [{ label: 'Active corrosion on main cables' }] }] }] }] },
    { label: 'Expansion Joints', children: [{ label: 'Deck Joints', children: [{ label: 'Excessive Gap', children: [{ label: 'Joint gap exceeds specification', children: [{ label: 'Measured gap > max allowable' }] }] }] }] },
    { label: 'Guardrails', children: [{ label: 'Handrails', children: [{ label: 'Loose Connection', children: [{ label: 'Loose railing connection', children: [{ label: 'Handrail bolts require tightening' }] }] }] }] },
  ],
  'Foundations & Geotechnical': [
    { label: 'Concrete Foundation', children: [{ label: 'Footings', children: [{ label: 'Settlement', children: [{ label: 'Settlement Crack', children: [{ label: 'Minor settling crack in foundation wall' }] }] }] }] },
    { label: 'Retaining Walls', children: [{ label: 'Wall Panels', children: [{ label: 'Structural Cracks', children: [{ label: 'Hairline Crack', children: [{ label: 'Crack in retaining wall < 2mm' }] }] }] }] },
  ],
  'Process Equipment': [
    { label: 'Pressure Vessels', children: [{ label: 'Vessel Shell', children: [{ label: 'Inspection Status', children: [{ label: 'Inspection Overdue', children: [{ label: 'Annual inspection sticker expired' }] }] }] }] },
    { label: 'Pipe Supports', children: [{ label: 'Brackets', children: [{ label: 'Corrosion Protection', children: [{ label: 'Corrosion', children: [{ label: 'Section loss on pipe support bracket' }] }] }] }] },
    { label: 'Piping', children: [{ label: 'Pipe Wall', children: [{ label: 'Wall Thickness', children: [{ label: 'General Corrosion', children: [{ label: 'Uniform wall thinning detected' }] }] }] }] },
  ],
};

const LIKELIHOOD_OPTIONS = ['A', 'B', 'C', 'D', 'E'] as const;
const PRIORITY_OPTIONS = ['P1', 'P2', 'P3', 'P4', 'P5'] as const;

export default function DeficiencyDetailPage() {
  const { localId } = useParams<{ localId: string }>();
  const [searchParams] = useSearchParams();
  const inspectionId = searchParams.get('inspection_id') ?? '';
  const isNew = localId === 'new';
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [error, setError] = useState('');

  const [category, setCategory] = useState('');
  const [component, setComponent] = useState('');
  const [subComponent, setSubComponent] = useState('');
  const [focusArea, setFocusArea] = useState('');
  const [deficiencyCategory, setDeficiencyCategory] = useState('');
  const [detailedDescription, setDetailedDescription] = useState('');
  const [description, setDescription] = useState('');
  const [mechanisms, setMechanisms] = useState('');
  const [vibrationPresent, setVibrationPresent] = useState<boolean | undefined>(undefined);
  const [ndtRequired, setNdtRequired] = useState<boolean | undefined>(undefined);
  const [furtherInvestigationRequired, setFurtherInvestigationRequired] = useState<boolean | undefined>(undefined);
  const [recommendedAction, setRecommendedAction] = useState('');
  const [consequenceSeverity, setConsequenceSeverity] = useState<number>(3);
  const [likelihood, setLikelihood] = useState<string>('C');
  const [priorityRating, setPriorityRating] = useState<string>('P3');
  const [componentNote, setComponentNote] = useState('');
  const [locationDesc, setLocationDesc] = useState('');

  useQuery({
    queryKey: ['deficiency', localId],
    queryFn: () => apiClient(ENDPOINTS.deficiencies.byId(localId!)),
    enabled: !!localId && !isNew,
    retry: false,
  });

  const categories = Object.keys(TAXONOMY);
  const components = category ? TAXONOMY[category].map(c => c.label) : [];
  const subComponents = category && component ? TAXONOMY[category].find(c => c.label === component)?.children.map(sc => sc.label) ?? [] : [];
  const focusAreas = category && component && subComponent ? TAXONOMY[category].find(c => c.label === component)?.children.find(sc => sc.label === subComponent)?.children.map(fa => fa.label) ?? [] : [];
  const deficiencyCategories = category && component && subComponent && focusArea ? TAXONOMY[category].find(c => c.label === component)?.children.find(sc => sc.label === subComponent)?.children.find(fa => fa.label === focusArea)?.children.map(dc => dc.label) ?? [] : [];
  const detailedDescriptions = category && component && subComponent && focusArea && deficiencyCategory ? TAXONOMY[category].find(c => c.label === component)?.children.find(sc => sc.label === subComponent)?.children.find(fa => fa.label === focusArea)?.children.find(dc => dc.label === deficiencyCategory)?.children.map(dd => dd.label) ?? [] : [];

  const glencoreResult = consequenceSeverity && likelihood
    ? calculateGlencoreRisk(consequenceSeverity as 1|2|3|4|5, likelihood as 'A'|'B'|'C'|'D'|'E')
    : null;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const data: Record<string, unknown> = {
        description: description || detailedDescription,
        category,
        sub_component: component,
        focus_area: focusArea,
        deficiency_category: deficiencyCategory,
        detailed_description: detailedDescription,
        mechanisms,
        vibration_present: vibrationPresent,
        ndt_required: ndtRequired,
        further_investigation_required: furtherInvestigationRequired,
        recommended_action: recommendedAction,
        consequence_severity: consequenceSeverity,
        likelihood,
        priority_tier: priorityRating,
        risk_rank: glencoreResult?.riskRank,
        risk_rating: glencoreResult?.riskRating,
      };
      if (componentNote) data.component_note = componentNote;
      if (locationDesc) data.location_desc = locationDesc;
      if (isNew && inspectionId) {
        await apiClient(ENDPOINTS.deficiencies.create(inspectionId), { method: 'POST', body: JSON.stringify(data) });
      } else if (localId) {
        await apiClient(ENDPOINTS.deficiencies.update(localId), { method: 'PATCH', body: JSON.stringify(data) });
      }
    },
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
    onError: () => setError('Failed to save deficiency.'),
  });

  const saving = saveMutation.isPending;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-text-primary">{isNew ? 'New Deficiency' : 'Edit Deficiency'}</h2>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">Category</label>
        <select value={category} onChange={e => { setCategory(e.target.value); setComponent(''); setSubComponent(''); setFocusArea(''); setDeficiencyCategory(''); setDetailedDescription(''); }} className="w-full px-3 py-2 bg-surface-primary border border-border rounded-lg text-text-primary">
          <option value="">Select category...</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {category && (
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Component</label>
          <select value={component} onChange={e => { setComponent(e.target.value); setSubComponent(''); setFocusArea(''); setDeficiencyCategory(''); setDetailedDescription(''); }} className="w-full px-3 py-2 bg-surface-primary border border-border rounded-lg text-text-primary">
            <option value="">Select component...</option>
            {components.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      )}

      {component && (
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Sub-Component</label>
          <select value={subComponent} onChange={e => { setSubComponent(e.target.value); setFocusArea(''); setDeficiencyCategory(''); setDetailedDescription(''); }} className="w-full px-3 py-2 bg-surface-primary border border-border rounded-lg text-text-primary">
            <option value="">Select sub-component...</option>
            {subComponents.map(sc => <option key={sc} value={sc}>{sc}</option>)}
          </select>
        </div>
      )}

      {subComponent && (
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Focus Area</label>
          <select value={focusArea} onChange={e => { setFocusArea(e.target.value); setDeficiencyCategory(''); setDetailedDescription(''); }} className="w-full px-3 py-2 bg-surface-primary border border-border rounded-lg text-text-primary">
            <option value="">Select focus area...</option>
            {focusAreas.map(fa => <option key={fa} value={fa}>{fa}</option>)}
          </select>
        </div>
      )}

      {focusArea && (
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Deficiency Category</label>
          <select value={deficiencyCategory} onChange={e => { setDeficiencyCategory(e.target.value); setDetailedDescription(''); }} className="w-full px-3 py-2 bg-surface-primary border border-border rounded-lg text-text-primary">
            <option value="">Select deficiency category...</option>
            {deficiencyCategories.map(dc => <option key={dc} value={dc}>{dc}</option>)}
          </select>
        </div>
      )}

      {deficiencyCategory && (
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Detailed Description</label>
          <select value={detailedDescription} onChange={e => setDetailedDescription(e.target.value)} className="w-full px-3 py-2 bg-surface-primary border border-border rounded-lg text-text-primary">
            <option value="">Select detailed description...</option>
            {detailedDescriptions.map(dd => <option key={dd} value={dd}>{dd}</option>)}
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">Inspector Notes</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full px-3 py-2 bg-surface-primary border border-border rounded-lg text-text-primary" placeholder="Additional observations, measurements, or context..." />
      </div>

      <div className="border-t border-border pt-4">
        <p className="text-sm font-semibold text-text-primary mb-3">Indication Details</p>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Potential Failure Mechanism</label>
          <input value={mechanisms} onChange={e => setMechanisms(e.target.value)} className="w-full px-3 py-2 bg-surface-primary border border-border rounded-lg text-text-primary" placeholder="e.g., Atmospheric corrosion, fatigue loading..." />
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3">
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">Vibration Present</label>
            <select value={vibrationPresent === undefined ? '' : vibrationPresent ? 'yes' : 'no'} onChange={e => setVibrationPresent(e.target.value === '' ? undefined : e.target.value === 'yes')} className="w-full px-2 py-2 bg-surface-primary border border-border rounded-lg text-text-primary text-sm">
              <option value="">—</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">NDT Required</label>
            <select value={ndtRequired === undefined ? '' : ndtRequired ? 'yes' : 'no'} onChange={e => setNdtRequired(e.target.value === '' ? undefined : e.target.value === 'yes')} className="w-full px-2 py-2 bg-surface-primary border border-border rounded-lg text-text-primary text-sm">
              <option value="">—</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">Further Investigation</label>
            <select value={furtherInvestigationRequired === undefined ? '' : furtherInvestigationRequired ? 'yes' : 'no'} onChange={e => setFurtherInvestigationRequired(e.target.value === '' ? undefined : e.target.value === 'yes')} className="w-full px-2 py-2 bg-surface-primary border border-border rounded-lg text-text-primary text-sm">
              <option value="">—</option>
              <option value="yes">Required</option>
              <option value="no">Not Required</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">Recommended Action</label>
        <textarea value={recommendedAction} onChange={e => setRecommendedAction(e.target.value)} rows={2} className="w-full px-3 py-2 bg-surface-primary border border-border rounded-lg text-text-primary" placeholder="Describe the recommended repair or action..." />
      </div>

      <div className="border-t border-border pt-4">
        <p className="text-sm font-semibold text-text-primary mb-3">Risk Assessment</p>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">Consequence (1-5)</label>
            <select value={consequenceSeverity} onChange={e => setConsequenceSeverity(Number(e.target.value))} className="w-full px-2 py-2 bg-surface-primary border border-border rounded-lg text-text-primary text-sm">
              {[1,2,3,4,5].map(v => <option key={v} value={v}>{v} — {['Negligible','Minor','Moderate','Major','Catastrophic'][v-1]}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">Likelihood</label>
            <select value={likelihood} onChange={e => setLikelihood(e.target.value)} className="w-full px-2 py-2 bg-surface-primary border border-border rounded-lg text-text-primary text-sm">
              {LIKELIHOOD_OPTIONS.map(v => <option key={v} value={v}>{v} — {['Rare','Unlikely','Possible','Likely','Almost Certain']['ABCDE'.indexOf(v)]}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">Priority</label>
            <select value={priorityRating} onChange={e => setPriorityRating(e.target.value)} className="w-full px-2 py-2 bg-surface-primary border border-border rounded-lg text-text-primary text-sm">
              {PRIORITY_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        </div>
        {glencoreResult && (
          <div className="mt-3 bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-xs text-text-secondary">Risk Rank: {glencoreResult.riskRank}/25</p>
            <p className={`text-lg font-bold ${glencoreResult.riskRating === 'High' ? 'text-red-600' : glencoreResult.riskRating === 'Medium' ? 'text-yellow-600' : 'text-green-600'}`}>
              {glencoreResult.riskRating}
            </p>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">Location</label>
        <input value={locationDesc} onChange={e => setLocationDesc(e.target.value)} className="w-full px-3 py-2 bg-surface-primary border border-border rounded-lg text-text-primary" placeholder="e.g., Floor 12, column grid C-4" />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">Component Notes</label>
        <input value={componentNote} onChange={e => setComponentNote(e.target.value)} className="w-full px-3 py-2 bg-surface-primary border border-border rounded-lg text-text-primary" />
      </div>

      <button
        onClick={() => saveMutation.mutate()}
        disabled={saving || !category}
        className="w-full px-4 py-2 bg-accent text-white rounded-lg disabled:opacity-50"
        aria-label="Save deficiency"
      >
        {saving ? 'Saving...' : 'Save Deficiency'}
      </button>

      {saved && (
        <div className="bg-green-100 text-green-800 p-2 rounded text-sm text-center">Saved locally.</div>
      )}
    </div>
  );
}