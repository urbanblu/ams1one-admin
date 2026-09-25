"use client";

import React from "react";
import GeneralSettings from "./_components/general-settings";
import TeamMembers from "./_components/team-members";
import ActivityLogsTab from "./_components/activity-logs-tab";
import { usePageAccess } from "@/hooks/use-page-access";
import { PageHeader, PageShell, SegmentedControl } from "@/components/ui";
import { LuHistory, LuSettings, LuUsers } from "react-icons/lu";

type Tab = "generalSettings" | "teamMembers" | "activityLogs";

function SettingsView() {
  const { hasPage } = usePageAccess();
  const canSeeTeamMembers = hasPage("admin.users");
  const canSeeActivityLogs = hasPage("admin.activity_logs");

  const [selectedTab, setSelectedTab] = React.useState<Tab>(() => {
    if (canSeeTeamMembers) return "teamMembers";
    if (canSeeActivityLogs) return "activityLogs";
    return "generalSettings";
  });

  const segments = [
    {
      key: "generalSettings" as const,
      label: "General",
      icon: <LuSettings />,
    },
    canSeeTeamMembers && {
      key: "teamMembers" as const,
      label: "Team members",
      icon: <LuUsers />,
    },
    canSeeActivityLogs && {
      key: "activityLogs" as const,
      label: "Activity logs",
      icon: <LuHistory />,
    },
  ].filter(Boolean) as { key: Tab; label: string; icon: React.ReactNode }[];

  return (
    <PageShell fill className="overflow-x-hidden">
      <PageHeader
        className="shrink-0"
        title="Settings"
        description="Organisation profile, team access and activity history."
        actions={
          <SegmentedControl
            segments={segments}
            value={selectedTab}
            onChange={setSelectedTab}
          />
        }
      />

      {/* RightSegment rendered an empty <div/>, so a quarter of the widest page
          in the app was permanently blank. Settings is a single column. */}
      <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-x-hidden">
        {selectedTab === "generalSettings" && <GeneralSettings />}
        {selectedTab === "teamMembers" && canSeeTeamMembers && <TeamMembers />}
        {selectedTab === "activityLogs" && canSeeActivityLogs && (
          <ActivityLogsTab />
        )}
      </div>
    </PageShell>
  );
}

export default SettingsView;
