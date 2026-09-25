"use client";

import React from "react";
import RightSegment from "./_components/right-segment";
import GeneralSettings from "./_components/general-settings";
import TeamMembers from "./_components/team-members";
import ActivityLogsTab from "./_components/activity-logs-tab";
import { usePageAccess } from "@/hooks/use-page-access";
import { PageHeader, SegmentedControl } from "@/components/ui";
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

  const shouldShowRightSegment =
    selectedTab === "generalSettings" || selectedTab === "teamMembers";

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
    <div className="flex h-full flex-col overflow-x-hidden overflow-y-auto px-5 py-6 lg:px-8 lg:py-7">
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

      <div className="mt-5 flex w-full min-w-0 flex-col gap-5 md:grid md:min-h-0 md:flex-1 md:grid-cols-4">
        <div className="col-span-3 flex min-h-0 w-full max-w-full flex-col overflow-x-hidden">
          {selectedTab === "generalSettings" && <GeneralSettings />}
          {selectedTab === "teamMembers" && canSeeTeamMembers && (
            <TeamMembers />
          )}
          {selectedTab === "activityLogs" && canSeeActivityLogs && (
            <ActivityLogsTab />
          )}
        </div>

        {shouldShowRightSegment ? (
          <div className="col-span-1 h-full min-h-0 w-full basis-full">
            <RightSegment />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default SettingsView;
