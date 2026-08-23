const Loader = ({ label }) => (
  <div className="flex flex-col items-center justify-center py-16 gap-3">
    <div className="animate-spin h-9 w-9 border-4 border-primary-500 border-t-transparent rounded-full" />
    {label && <p className="text-sm text-gray-400">{label}</p>}
  </div>
);

export const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-purple-100/70 rounded-lg ${className}`} />
);

export default Loader;
