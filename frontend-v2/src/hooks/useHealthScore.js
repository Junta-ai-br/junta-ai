import { useEffect, useState } from "react";
import { getSessionSnapshot } from "@/services/auth/session";
import { currentCivilMonth } from "@/services/finance/finance-provider-store";
import { loadOfficialHealthScore } from "@/services/finance/financeHealth";

export default function useHealthScore(finance, blocked = false) {
  const [read, setRead] = useState(null);
  const { summary, period, status, coverage, refreshRequired } = finance;
  const owner = getSessionSnapshot()?.generation;
  const month = currentCivilMonth();
  const eligible = !blocked && !refreshRequired && coverage?.complete === true && !!summary
    && ["success", "empty"].includes(status) && period.from === month.from && period.to === month.to;
  useEffect(() => {
    if (!eligible) return;
    const controller = new AbortController();
    let active = true;
    loadOfficialHealthScore(period, summary, { signal: controller.signal, sessionGeneration: owner })
      .then((value) => {
        if (active && getSessionSnapshot()?.generation === owner) setRead({ summary, owner, value, status: "ready" });
      }).catch(() => {
        if (active && getSessionSnapshot()?.generation === owner) setRead({ summary, owner, status: "error" });
      });
    return () => { active = false; controller.abort(); };
  }, [eligible, summary, period, owner]);
  if (!eligible) return { status: !blocked && ["idle", "loading"].includes(status) ? "loading" : "unavailable" };
  if (read?.summary !== summary || read?.owner !== owner) return { status: "loading" };
  return read;
}
