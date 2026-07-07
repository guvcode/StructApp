import GenericPicklistPage from '../../components/GenericPicklistPage';

export default function PicklistWorkTypesPage() {
  return (
    <GenericPicklistPage
      picklistKey="work_type"
      entityLabel="Work Type"
      emptyTitle="No Work Types"
      emptyDescription="Add a work type to get started."
    />
  );
}