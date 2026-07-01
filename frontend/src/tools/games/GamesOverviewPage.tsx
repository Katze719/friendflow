import { Disc3, Trophy } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { ApiError } from "../../api/client";
import { groupsApi } from "../../api/groups";
import type { GroupDetail } from "../../api/types";
import GroupToolSwitcher from "../../components/GroupToolSwitcher";
import LoadingState from "../../components/LoadingState";
import PageHeader from "../../components/PageHeader";
import TournamentsPanel from "./TournamentsPanel";
import WheelPanel from "./WheelPanel";

type Tab = "wheel" | "tournaments";

export default function GamesOverviewPage() {
  const { t } = useTranslation();
  const { groupId } = useParams<{ groupId: string }>();
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("wheel");

  const reload = useCallback(() => {
    if (!groupId) return;
    groupsApi
      .get(groupId)
      .then(setGroup)
      .catch((e) =>
        setError(e instanceof ApiError ? e.message : t("common.error")),
      );
  }, [groupId, t]);

  useEffect(() => {
    reload();
  }, [reload]);

  if (error && !group) return <p className="alert-error">{error}</p>;
  if (!group) return <LoadingState />;

  return (
    <div className="space-y-6">
      <PageHeader
        backLink={{
          to: `/groups/${group.id}`,
          label: t("games.backToGroup"),
        }}
        title={t("games.title")}
        subtitle={`${group.name} - ${t("games.subtitle")}`}
      />
      <GroupToolSwitcher groupId={group.id} groupName={group.name} />

      <div className="segmented w-full text-sm sm:w-auto">
        <TabButton
          active={tab === "wheel"}
          onClick={() => setTab("wheel")}
          icon={<Disc3 className="h-4 w-4" />}
          label={t("games.tabs.wheel")}
        />
        <TabButton
          active={tab === "tournaments"}
          onClick={() => setTab("tournaments")}
          icon={<Trophy className="h-4 w-4" />}
          label={t("games.tabs.tournaments")}
        />
      </div>

      {tab === "wheel" ? (
        <WheelPanel members={group.members} />
      ) : (
        <TournamentsPanel groupId={group.id} />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`segmented-item flex flex-1 items-center justify-center gap-1.5 py-2 sm:flex-none ${
        active ? "segmented-item-active" : "segmented-item-idle"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
