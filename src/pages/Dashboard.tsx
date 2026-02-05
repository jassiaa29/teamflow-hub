import { useState } from "react";
import { useTasks } from "@/hooks/useTasks";
import { useOrganization } from "@/hooks/useOrganization";
import AppLayout from "@/components/layout/AppLayout";
import CreateTaskDialog from "@/components/tasks/CreateTaskDialog";
import TaskCard from "@/components/tasks/TaskCard";
import TaskDetailSheet from "@/components/tasks/TaskDetailSheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import {
  ListTodo,
  PlayCircle,
  Eye,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Task = Tables<"tasks">;

const statCards = [
  { label: "Por hacer", key: "todo" as const, icon: ListTodo, color: "text-muted-foreground" },
  { label: "En progreso", key: "inProgress" as const, icon: PlayCircle, color: "text-info" },
  { label: "En revisión", key: "inReview" as const, icon: Eye, color: "text-warning" },
  { label: "Completadas", key: "done" as const, icon: CheckCircle2, color: "text-success" },
];

export default function Dashboard() {
  const { tasks, todoTasks, inProgressTasks, inReviewTasks, doneTasks, loading, refetch } = useTasks();
  const { currentOrg } = useOrganization();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const counts = {
    todo: todoTasks.length,
    inProgress: inProgressTasks.length,
    inReview: inReviewTasks.length,
    done: doneTasks.length,
  };

  const totalTasks = tasks.length;
  const progressPercent = totalTasks > 0 ? Math.round((doneTasks.length / totalTasks) * 100) : 0;

  const recentTasks = tasks.slice(0, 8);

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {currentOrg ? `Resumen de ${currentOrg.name}` : "Selecciona una organización"}
            </p>
          </div>
          <CreateTaskDialog onCreated={refetch} />
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-28 rounded-lg" />
            ))}
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4 mb-8">
              {statCards.map((stat, idx) => (
                <motion.div
                  key={stat.key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card>
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-muted-foreground">{stat.label}</span>
                        <stat.icon className={`w-4 h-4 ${stat.color}`} />
                      </div>
                      <p className="text-3xl font-bold">{counts[stat.key]}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Progress */}
            <Card className="mb-8">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Progreso del equipo</span>
                  </div>
                  <span className="text-sm font-semibold text-primary">{progressPercent}%</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  {doneTasks.length} de {totalTasks} tareas completadas
                </p>
              </CardContent>
            </Card>

            {/* Recent Tasks */}
            <div>
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-lg">Tareas recientes</CardTitle>
              </CardHeader>
              {recentTasks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ListTodo className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">No hay tareas aún. ¡Crea tu primera tarea!</p>
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {recentTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onClick={() => setSelectedTask(task)}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <TaskDetailSheet
        task={selectedTask}
        open={!!selectedTask}
        onOpenChange={(open) => !open && setSelectedTask(null)}
        onUpdated={refetch}
      />
    </AppLayout>
  );
}
