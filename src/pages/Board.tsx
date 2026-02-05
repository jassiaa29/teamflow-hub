import { useState } from "react";
import { useTasks } from "@/hooks/useTasks";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import CreateTaskDialog from "@/components/tasks/CreateTaskDialog";
import TaskCard from "@/components/tasks/TaskCard";
import TaskDetailSheet from "@/components/tasks/TaskDetailSheet";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import type { Tables, Database } from "@/integrations/supabase/types";

type Task = Tables<"tasks">;
type TaskStatus = Database["public"]["Enums"]["task_status"];

const columns: { status: TaskStatus; label: string; dotColor: string }[] = [
  { status: "todo", label: "Por hacer", dotColor: "bg-muted-foreground" },
  { status: "in_progress", label: "En progreso", dotColor: "bg-info" },
  { status: "in_review", label: "En revisión", dotColor: "bg-warning" },
  { status: "done", label: "Completada", dotColor: "bg-success" },
];

export default function Board() {
  const { tasks, todoTasks, inProgressTasks, inReviewTasks, doneTasks, loading, refetch } = useTasks();
  const { toast } = useToast();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  const tasksByStatus: Record<TaskStatus, Task[]> = {
    todo: todoTasks,
    in_progress: inProgressTasks,
    in_review: inReviewTasks,
    done: doneTasks,
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(status);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: TaskStatus) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (!draggedTaskId) return;

    const task = tasks.find((t) => t.id === draggedTaskId);
    if (!task || task.status === newStatus) {
      setDraggedTaskId(null);
      return;
    }

    const { error } = await supabase
      .from("tasks")
      .update({ status: newStatus })
      .eq("id", draggedTaskId);

    if (error) {
      toast({ title: "Error al mover tarea", description: error.message, variant: "destructive" });
    } else {
      refetch();
    }
    setDraggedTaskId(null);
  };

  return (
    <AppLayout>
      <div className="p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Tablero Kanban</h1>
          <CreateTaskDialog onCreated={refetch} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 min-h-[60vh]">
          {columns.map((col) => (
            <div
              key={col.status}
              className={cn(
                "flex flex-col rounded-xl border border-border bg-muted/30 transition-colors",
                dragOverColumn === col.status && "border-primary/40 bg-accent/30"
              )}
              onDragOver={(e) => handleDragOver(e, col.status)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.status)}
            >
              {/* Column Header */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                <div className={cn("w-2.5 h-2.5 rounded-full", col.dotColor)} />
                <span className="text-sm font-medium">{col.label}</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {tasksByStatus[col.status].length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                <AnimatePresence>
                  {loading ? (
                    <div className="text-xs text-muted-foreground text-center py-8">
                      Cargando...
                    </div>
                  ) : tasksByStatus[col.status].length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs text-muted-foreground text-center py-8 border-2 border-dashed border-border/50 rounded-lg"
                    >
                      Arrastra tareas aquí
                    </motion.div>
                  ) : (
                    tasksByStatus[col.status].map((task) => (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        className={cn(
                          "cursor-grab active:cursor-grabbing",
                          draggedTaskId === task.id && "opacity-40"
                        )}
                      >
                        <TaskCard
                          task={task}
                          onClick={() => setSelectedTask(task)}
                        />
                      </div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
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
