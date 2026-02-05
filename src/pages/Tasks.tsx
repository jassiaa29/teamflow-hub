import { useState } from "react";
import { useTasks } from "@/hooks/useTasks";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/layout/AppLayout";
import CreateTaskDialog from "@/components/tasks/CreateTaskDialog";
import TaskCard from "@/components/tasks/TaskCard";
import TaskDetailSheet from "@/components/tasks/TaskDetailSheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, ListTodo } from "lucide-react";
import type { Tables, Database } from "@/integrations/supabase/types";

type Task = Tables<"tasks">;
type TaskStatus = Database["public"]["Enums"]["task_status"];
type TaskPriority = Database["public"]["Enums"]["task_priority"];

export default function Tasks() {
  const { tasks, myTasks, loading, refetch } = useTasks();
  const { user } = useAuth();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<TaskStatus | "all">("all");
  const [filterPriority, setFilterPriority] = useState<TaskPriority | "all">("all");

  const filterTasks = (taskList: Task[]) => {
    return taskList.filter((t) => {
      const matchesSearch =
        !search ||
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.description?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = filterStatus === "all" || t.status === filterStatus;
      const matchesPriority = filterPriority === "all" || t.priority === filterPriority;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  };

  const EmptyState = () => (
    <div className="text-center py-16 text-muted-foreground">
      <ListTodo className="w-10 h-10 mx-auto mb-3 opacity-40" />
      <p className="text-sm">No se encontraron tareas</p>
    </div>
  );

  const TaskGrid = ({ taskList }: { taskList: Task[] }) => {
    const filtered = filterTasks(taskList);
    if (filtered.length === 0) return <EmptyState />;
    return (
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((task) => (
          <TaskCard key={task.id} task={task} onClick={() => setSelectedTask(task)} />
        ))}
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Tareas</h1>
          <CreateTaskDialog onCreated={refetch} />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar tareas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as TaskStatus | "all")}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="todo">Por hacer</SelectItem>
              <SelectItem value="in_progress">En progreso</SelectItem>
              <SelectItem value="in_review">En revisión</SelectItem>
              <SelectItem value="done">Completada</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterPriority} onValueChange={(v) => setFilterPriority(v as TaskPriority | "all")}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Prioridad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="low">Baja</SelectItem>
              <SelectItem value="medium">Media</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="urgent">Urgente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">Todas ({tasks.length})</TabsTrigger>
            <TabsTrigger value="mine">Mis tareas ({myTasks.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-4">
            {loading ? (
              <div className="text-center py-12 text-muted-foreground text-sm">Cargando...</div>
            ) : (
              <TaskGrid taskList={tasks} />
            )}
          </TabsContent>
          <TabsContent value="mine" className="mt-4">
            <TaskGrid taskList={myTasks} />
          </TabsContent>
        </Tabs>
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
