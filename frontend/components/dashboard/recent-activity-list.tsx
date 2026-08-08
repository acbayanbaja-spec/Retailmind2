import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";
import { DashboardActivityItem } from "@/types";
import { Activity } from "lucide-react";

interface RecentActivityListProps {
  activity: DashboardActivityItem[];
}

function formatAction(action: string): string {
  return action
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

export function RecentActivityList({ activity }: RecentActivityListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Recent Activity
        </CardTitle>
        <CardDescription>Latest system events</CardDescription>
      </CardHeader>
      {activity.length === 0 ? (
        <p className="text-sm text-muted-foreground">No recent activity</p>
      ) : (
        <ul className="space-y-3">
          {activity.map((item) => (
            <li key={item.id} className="flex gap-3">
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
              <div className="min-w-0">
                <p className="text-sm text-foreground">{item.description}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatAction(item.action)}
                  {item.userName ? ` · ${item.userName}` : ""}
                  {" · "}
                  {formatDateTime(item.createdAt)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
