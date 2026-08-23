const EmptyState = ({ icon: Icon, title, subtitle, actionLabel, onAction }) => (
  <div className="flex flex-col items-center justify-center text-center py-16 px-4">
    <div className="w-20 h-20 rounded-full bg-primary-50 flex items-center justify-center mb-4">
      {Icon && <Icon size={36} className="text-primary-400" />}
    </div>
    <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
    {subtitle && <p className="text-sm text-gray-400 mt-1 max-w-sm">{subtitle}</p>}
    {actionLabel && (
      <button onClick={onAction} className="btn-primary mt-5">
        {actionLabel}
      </button>
    )}
  </div>
);

export default EmptyState;
