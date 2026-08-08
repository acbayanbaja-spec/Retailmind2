"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettings, useSettingsMutations } from "@/hooks/use-settings";
import { ApiError } from "@/lib/api-client";
import { SettingsFormValues, settingsFormSchema } from "@/schemas/setting.schema";

function formatSettingLabel(key: string) {
  return key
    .split(".")
    .map((part) => part.replace(/_/g, " "))
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" — ");
}

export function SettingsPanel() {
  const { data, isLoading, isError, refetch } = useSettings();
  const { saveAll } = useSettingsMutations();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: { settings: [] },
  });

  useEffect(() => {
    if (data) {
      reset({ settings: data });
    }
  }, [data, reset]);

  async function onSubmit(values: SettingsFormValues) {
    try {
      await saveAll.mutateAsync(
        values.settings.map((setting) => ({
          key: setting.key,
          value: setting.value,
        }))
      );
      toast.success("Settings saved");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Save failed");
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Card className="py-10 text-center">
        <p className="text-sm text-muted-foreground">Could not load settings.</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-2 text-sm font-medium text-primary hover:underline"
        >
          Retry
        </button>
      </Card>
    );
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">System settings</h2>
          <p className="text-sm text-muted-foreground">
            Configure store details, tax rate, currency, and loyalty rules.
          </p>
        </div>
        <Button type="submit" isLoading={saveAll.isPending} disabled={!isDirty}>
          Save changes
        </Button>
      </div>

      <div className="space-y-4">
        {data.map((setting, index) => (
          <Card key={setting.key} className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-foreground">{formatSettingLabel(setting.key)}</p>
                {setting.description ? (
                  <p className="text-sm text-muted-foreground">{setting.description}</p>
                ) : null}
                <p className="mt-1 text-xs text-muted-foreground">
                  Key: {setting.key}
                  {setting.isPublic ? " · Public" : " · Internal"}
                </p>
              </div>
              <Settings2 className="h-5 w-5 shrink-0 text-muted-foreground" />
            </div>
            <input type="hidden" {...register(`settings.${index}.key`)} />
            <Input
              label="Value"
              error={errors.settings?.[index]?.value?.message}
              {...register(`settings.${index}.value`)}
            />
          </Card>
        ))}
      </div>
    </form>
  );
}
