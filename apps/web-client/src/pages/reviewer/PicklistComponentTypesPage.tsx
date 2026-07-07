import GenericPicklistPage from '../../components/GenericPicklistPage';

export default function PicklistComponentTypesPage() {
  return (
    <GenericPicklistPage
      picklistKey="component_type"
      entityLabel="Component Type"
      emptyTitle="No Component Types"
      emptyDescription="Add a component type to get started."
    />
  );
}