import { useEffect, useState } from "react";
import {
  getEntitySyncMeta,
  subscribeOfflineStore,
  type OfflineEntityMeta,
} from "./storage";

export function useLocalEntityMeta(
  entityId: string | undefined,
  initial: OfflineEntityMeta = {},
): OfflineEntityMeta {
  const [meta, setMeta] = useState<OfflineEntityMeta>(initial);

  useEffect(() => {
    if (!entityId) return;
    let active = true;
    const refresh = () => {
      void getEntitySyncMeta(entityId).then((next) => {
        if (active) setMeta(next);
      });
    };
    refresh();
    const unsubscribe = subscribeOfflineStore(refresh);
    return () => {
      active = false;
      unsubscribe();
    };
  }, [entityId]);

  return meta;
}

