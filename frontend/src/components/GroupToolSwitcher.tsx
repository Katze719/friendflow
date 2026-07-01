import { ChevronDown } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { toolPath, tools } from "../tools";

export default function GroupToolSwitcher({
  groupId,
  groupName,
}: {
  groupId: string;
  groupName: string;
}) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const activeValue = useMemo(() => {
    const active = tools.find((tool) =>
      location.pathname.startsWith(`/groups/${groupId}/${tool.basePath}`),
    );
    return active?.id ?? "__home";
  }, [groupId, location.pathname]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:hidden">
      <label
        htmlFor="group_tool_switcher"
        className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400"
      >
        {t("group.toolSwitcherLabel", { name: groupName })}
      </label>
      <div className="relative">
        <select
          id="group_tool_switcher"
          className="input appearance-none pr-10"
          value={activeValue}
          onChange={(event) => {
            const value = event.target.value;
            if (value === "__home") {
              navigate(`/groups/${groupId}`);
              return;
            }
            const next = tools.find((tool) => tool.id === value);
            if (next) navigate(toolPath(groupId, next));
          }}
        >
          <option value="__home">{t("group.groupOverview")}</option>
          {tools.map((tool) => (
            <option key={tool.id} value={tool.id}>
              {t(tool.nameKey)}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>
    </div>
  );
}
