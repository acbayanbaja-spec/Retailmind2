import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ModulePlaceholderProps {
  title: string;
  phase: string;
  description: string;
}

export function ModulePlaceholder({
  title,
  phase,
  description,
}: ModulePlaceholderProps) {
  return (
    <DashboardLayout title={title} description={description}>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <p className="text-sm text-muted-foreground">
          This module will be implemented in{" "}
          <span className="font-medium text-foreground">{phase}</span>. The navigation
          and layout shell are ready.
        </p>
      </Card>
    </DashboardLayout>
  );
}
