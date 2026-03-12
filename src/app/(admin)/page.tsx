import {
  Users,
  UserCheck,
  UserX,
  Layers,
  Library,
  BookMarked,
  FileText,
} from "lucide-react";
import { getDashboardStats, getRecentActivity } from "@/lib/actions";
import StatsCard from "@/components/ui/StatsCard";
import PageHeader from "@/components/ui/PageHeader";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [stats, activity] = await Promise.all([
    getDashboardStats(),
    getRecentActivity(),
  ]);

  const statCards = [
    {
      label: "Total Users",
      value: stats.total_users,
      icon: Users,
      iconClass: "bg-primary",
    },
    {
      label: "Active Users",
      value: stats.active_users,
      icon: UserCheck,
      iconClass: "bg-success",
    },
    {
      label: "Disabled Users",
      value: stats.disabled_users,
      icon: UserX,
      iconClass: "bg-danger",
    },
    {
      label: "Total Blocks",
      value: stats.total_blocks,
      icon: Layers,
      iconClass: "bg-purple-500",
    },
    {
      label: "Total Subjects",
      value: stats.total_subjects,
      icon: Library,
      iconClass: "bg-info",
    },
    {
      label: "Total Chapters",
      value: stats.total_chapters,
      icon: BookMarked,
      iconClass: "bg-warning",
    },
    {
      label: "PDF Notes",
      value: stats.total_notes,
      icon: FileText,
      iconClass: "bg-teal-500",
    },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of your Medical Notes platform"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((s) => (
          <StatsCard
            key={s.label}
            label={s.label}
            value={s.value}
            icon={s.icon}
            iconClass={s.iconClass}
          />
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">
            Recent Activity
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Latest actions taken on the platform
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                {["User Name", "Action", "Course / Block", "Date"].map((h) => (
                  <th
                    key={h}
                    className="text-left text-xs font-semibold text-muted-foreground px-6 py-3 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {activity.map(
                (a: {
                  id: string;
                  user_name: string;
                  action: string;
                  course_block: string;
                  created_at: string;
                }) => (
                  <tr
                    key={a.id}
                    className="hover:bg-muted-hover transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-foreground">
                      {a.user_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted text-xs font-medium">
                        {a.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {a.course_block}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {formatDate(a.created_at)}
                    </td>
                  </tr>
                ),
              )}
              {activity.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-10 text-center text-sm text-muted-foreground"
                  >
                    No recent activity.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
