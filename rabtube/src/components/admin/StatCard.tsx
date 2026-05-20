interface Props {
  label: string;
  value: string;
  sub?: string;
  color?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
}

export default function StatCard({ label, value, sub, color = '#1a9e75', icon, trend }: Props) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">{label}</p>
        {icon && <div className="text-slate-300 text-sm">{icon}</div>}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-medium" style={{ color }}>{value}</span>
      </div>
      {sub && <p className="text-[11px] text-slate-400 mt-1.5">{sub}</p>}
    </div>
  );
}
