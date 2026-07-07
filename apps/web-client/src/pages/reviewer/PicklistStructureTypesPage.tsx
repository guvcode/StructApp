import GenericPicklistPage from '../../components/GenericPicklistPage';

export default function PicklistStructureTypesPage() {
  return (
    <GenericPicklistPage
      picklistKey="structure_type"
      entityLabel="Structure Type"
      emptyTitle="No Structure Types"
      emptyDescription="Add a structure type to get started."
    />
  );
}