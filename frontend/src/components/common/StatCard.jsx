const colorMap = {
  purple: 'bg-primary-50 text-primary-700',
  pink: 'bg-pink-50 text-pink-600',
  orange: 'bg-orange-50 text-orange-600',
  green: 'bg-green-50 text-green-600',
  amber: 'bg-amber-50 text-amber-600',
  red: 'bg-red-50 text-red-600',
};

const StatCard = ({ icon: Icon, label, value, color = 'purple', onClick, sub }) => (
  <button
    onClick={onClick}
    className={`card p-5 text-left w-full ${onClick ? 'cursor-pointer hover:-translate-y-0.5' : 'cursor-default'} transition-transform duration-150`}
  >
    <div className="flex items-center justify-between mb-3">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
        {Icon && <Icon size={22} />}
      </div>
    </div>
    <p className="text-2xl font-bold text-gray-800 leading-tight">{value}</p>
    <p className="text-sm text-gray-500 mt-1">{label}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </button>
);

export default StatCard;
