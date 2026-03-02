interface EmptyStateProps {
  onAdd: () => void;
}

export default function EmptyState({ onAdd }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">&#x1F4C5;</div>
      <h2>No D-Days yet</h2>
      <p>Create your first countdown and start tracking!</p>
      <button className="btn-primary" onClick={onAdd}>
        Create D-Day
      </button>
    </div>
  );
}
