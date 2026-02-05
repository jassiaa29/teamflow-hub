import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useOrganization } from "./useOrganization";
import type { Tables } from "@/integrations/supabase/types";

type Task = Tables<"tasks">;

export function useTasks() {
  const { user } = useAuth();
  const { currentOrg } = useOrganization();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    if (!user || !currentOrg) {
      setTasks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .eq("org_id", currentOrg.id)
      .order("created_at", { ascending: false });

    setTasks(data || []);
    setLoading(false);
  }, [user, currentOrg]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Realtime subscription
  useEffect(() => {
    if (!currentOrg) return;

    const channel = supabase
      .channel("tasks-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          filter: `org_id=eq.${currentOrg.id}`,
        },
        () => {
          fetchTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentOrg, fetchTasks]);

  const myTasks = tasks.filter((t) => t.created_by === user?.id);
  const todoTasks = tasks.filter((t) => t.status === "todo");
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress");
  const inReviewTasks = tasks.filter((t) => t.status === "in_review");
  const doneTasks = tasks.filter((t) => t.status === "done");

  return {
    tasks,
    myTasks,
    todoTasks,
    inProgressTasks,
    inReviewTasks,
    doneTasks,
    loading,
    refetch: fetchTasks,
  };
}
