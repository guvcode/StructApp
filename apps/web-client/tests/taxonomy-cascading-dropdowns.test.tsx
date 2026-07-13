import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const testQueryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

function wrap(ui: React.ReactElement) {
  return <QueryClientProvider client={testQueryClient}>{ui}</QueryClientProvider>;
}

const taxonomyNodes = [
  { node_id: 'cat-1', parent_id: null, level: 'category', category: 'Steel', label: 'Steel', display_order: 1, is_active: true },
  { node_id: 'cat-2', parent_id: null, level: 'category', category: 'Concrete', label: 'Concrete', display_order: 2, is_active: true },
  { node_id: 'et-1', parent_id: 'cat-1', level: 'equipment_type', category: 'Steel', label: 'Girder', display_order: 1, is_active: true },
  { node_id: 'et-2', parent_id: 'cat-1', level: 'equipment_type', category: 'Steel', label: 'Column', display_order: 2, is_active: true },
  { node_id: 'et-3', parent_id: 'cat-2', level: 'equipment_type', category: 'Concrete', label: 'Beam', display_order: 1, is_active: true },
  { node_id: 'comp-1', parent_id: 'et-1', level: 'component', category: 'Steel', label: 'Flange', display_order: 1, is_active: true },
  { node_id: 'comp-2', parent_id: 'et-1', level: 'component', category: 'Steel', label: 'Web', display_order: 2, is_active: true },
  { node_id: 'comp-3', parent_id: 'et-2', level: 'component', category: 'Steel', label: 'Base Plate', display_order: 1, is_active: true },
  // Rogue node — component-level node incorrectly parented to a category (not equipment type)
  { node_id: 'comp-rogue', parent_id: 'cat-1', level: 'component', category: 'Steel', label: 'Rogue Component', display_order: 99, is_active: true },
  { node_id: 'sub-1', parent_id: 'comp-1', level: 'sub_component', category: 'Steel', label: 'Top Flange', display_order: 1, is_active: true },
  { node_id: 'sub-2', parent_id: 'comp-1', level: 'sub_component', category: 'Steel', label: 'Bottom Flange', display_order: 2, is_active: true },
  { node_id: 'sub-3', parent_id: 'comp-3', level: 'sub_component', category: 'Steel', label: 'Anchor Bolt', display_order: 1, is_active: true },
];

beforeEach(() => {
  vi.restoreAllMocks();
  vi.mock('../src/services/api/apiClient', () => ({
    apiClient: () => Promise.resolve(taxonomyNodes),
  }));
});

// @ts-expect-error — dynamic import for initial render test
const importPage = () => import('../src/components/TaxonomyLevelPage');

describe('TaxonomyLevelPage — Cascading Ancestor Dropdowns', () => {
  it('shows a single dropdown for root level (category)', async () => {
    const { TaxonomyLevelPage } = await import('../src/components/TaxonomyLevelPage');
    render(wrap(<MemoryRouter><TaxonomyLevelPage level="category" /></MemoryRouter>));
    await waitFor(() => {
      expect(screen.getByText('Steel')).toBeInTheDocument();
      expect(screen.getByText('Concrete')).toBeInTheDocument();
    });
  });

  it('shows all ancestor dropdowns for a deep level', async () => {
    const { TaxonomyLevelPage } = await import('../src/components/TaxonomyLevelPage');
    render(wrap(<MemoryRouter><TaxonomyLevelPage level="sub_component" /></MemoryRouter>));
    await waitFor(() => {
      expect(screen.getByLabelText(/Category/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Equipment Type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Component/i)).toBeInTheDocument();
    });
  });

  it('cascades filtering across ancestor dropdowns', async () => {
    const { TaxonomyLevelPage } = await import('../src/components/TaxonomyLevelPage');
    render(wrap(<MemoryRouter><TaxonomyLevelPage level="sub_component" /></MemoryRouter>));

    await waitFor(() => {
      expect(screen.getByLabelText(/Category/i)).toBeInTheDocument();
    });

    const categorySelect = screen.getByLabelText(/Category/i);
    fireEvent.change(categorySelect, { target: { value: 'cat-1' } });

    await waitFor(() => {
      const equipmentTypeSelect = screen.getByLabelText(/Equipment Type/i);
      const options = Array.from(equipmentTypeSelect.querySelectorAll('option'));
      const optionLabels = options.map(o => o.textContent);
      expect(optionLabels).toContain('Girder');
      expect(optionLabels).toContain('Column');
      expect(optionLabels).not.toContain('Beam');
    });
  });

  it('shows entries only when immediate parent is selected', async () => {
    const { TaxonomyLevelPage } = await import('../src/components/TaxonomyLevelPage');
    render(wrap(<MemoryRouter><TaxonomyLevelPage level="sub_component" /></MemoryRouter>));

    await waitFor(() => {
      expect(screen.getByLabelText(/Category/i)).toBeInTheDocument();
    });

    expect(screen.queryByText('Top Flange')).not.toBeInTheDocument();
    expect(screen.queryByText('Bottom Flange')).not.toBeInTheDocument();

    const categorySelect = screen.getByLabelText(/Category/i);
    fireEvent.change(categorySelect, { target: { value: 'cat-1' } });

    const equipmentTypeSelect = screen.getByLabelText(/Equipment Type/i);
    fireEvent.change(equipmentTypeSelect, { target: { value: 'et-1' } });

    const componentSelect = screen.getByLabelText(/Component/i);
    fireEvent.change(componentSelect, { target: { value: 'comp-1' } });

    await waitFor(() => {
      expect(screen.getByText('Top Flange')).toBeInTheDocument();
      expect(screen.getByText('Bottom Flange')).toBeInTheDocument();
      expect(screen.queryByText('Anchor Bolt')).not.toBeInTheDocument();
    });
  });

  it('filters ancestor dropdown options by level — excludes wrong-level children', async () => {
    const { TaxonomyLevelPage } = await import('../src/components/TaxonomyLevelPage');
    render(wrap(<MemoryRouter><TaxonomyLevelPage level="sub_component" /></MemoryRouter>));

    await waitFor(() => {
      expect(screen.getByLabelText(/Category/i)).toBeInTheDocument();
    });

    const categorySelect = screen.getByLabelText(/Category/i);
    fireEvent.change(categorySelect, { target: { value: 'cat-1' } });

    await waitFor(() => {
      const equipmentTypeSelect = screen.getByLabelText(/Equipment Type/i);
      const options = Array.from(equipmentTypeSelect.querySelectorAll('option'));
      const optionLabels = options.map(o => o.textContent);
      // Should show equipment_type-level children
      expect(optionLabels).toContain('Girder');
      expect(optionLabels).toContain('Column');
      // Should NOT show component-level children even if parented to the same category
      expect(optionLabels).not.toContain('Rogue Component');
    });
  });

  it('resets child selections when a parent dropdown changes', async () => {
    const { TaxonomyLevelPage } = await import('../src/components/TaxonomyLevelPage');
    render(wrap(<MemoryRouter><TaxonomyLevelPage level="sub_component" /></MemoryRouter>));

    await waitFor(() => {
      expect(screen.getByLabelText(/Category/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Category/i), { target: { value: 'cat-1' } });
    fireEvent.change(screen.getByLabelText(/Equipment Type/i), { target: { value: 'et-1' } });
    fireEvent.change(screen.getByLabelText(/Component/i), { target: { value: 'comp-1' } });

    await waitFor(() => {
      expect(screen.getByText('Top Flange')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Category/i), { target: { value: '' } });

    await waitFor(() => {
      expect(screen.getByLabelText(/Equipment Type/i)).toHaveValue('');
      expect(screen.getByLabelText(/Component/i)).toHaveValue('');
      expect(screen.queryByText('Top Flange')).not.toBeInTheDocument();
    });
  });
});