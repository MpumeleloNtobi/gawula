"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError } from "@/lib/api";

type Options = {
  token?: string | null;
  enabled?: boolean;
  pollMs?: number;
};

export function useApiData<T>(path: string | null, options: Options = {}) {
  const { token, enabled = true, pollMs } = options;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  const load = useCallback(async () => {
    if (!path || !enabled) return;
    try {
      const result = await api<T>(path, { token });
      if (mounted.current) {
        setData(result);
        setError(null);
      }
    } catch (err) {
      if (mounted.current) {
        setError(err instanceof ApiError ? err.message : "Could not load data");
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [path, enabled, token]);

  useEffect(() => {
    mounted.current = true;
    load();
    return () => {
      mounted.current = false;
    };
  }, [load]);

  useEffect(() => {
    if (!pollMs || !path || !enabled) return;
    const t = setInterval(load, pollMs);
    return () => clearInterval(t);
  }, [pollMs, path, enabled, load]);

  return { data, error, loading, refresh: load };
}
