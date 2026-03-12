import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  iconClass?: string;
}

export default function StatsCard({ label, value, icon: Icon, iconClass = 'bg-primary' }: StatsCardProps) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5 flex items-center justify-between hover:shadow-md transition-shadow duration-200">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-3xl font-bold mt-1 text-foreground">{value}</p>
      </div>
      <div className={cn('h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0', iconClass)}>
        <Icon className="h-5 w-5 text-white" />
      </div>
    </div>
  );
}
