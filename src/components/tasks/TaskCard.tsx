import type { Tables } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

type Task = Tables<"tasks">;

interface TaskCardProps {
  task: Task;
  assignees?: { user_id: string; full_name: string }[];
  commentCount?: number;
  onClick?: () => void;
}

const priorityConfig = {
  low: { label: "Baja", className: "bg-success/10 text-success border-success/20" },
  medium: { label: "Media", className: "bg-warning/10 text-warning border-warning/20" },
  high: { label: "Alta", className: "bg-priority-high/10 text-priority-high border-priority-high/20" },
  urgent: { label: "Urgente", className: "bg-destructive/10 text-destructive border-destructive/20" },
};

const statusConfig = {
  todo: { label: "Por hacer", dot: "bg-muted-foreground" },
  in_progress: { label: "En progreso", dot: "bg-info" },
  in_review: { label: "En revisión", dot: "bg-warning" },
  done: { label: "Completada", dot: "bg-success" },
};

export default function TaskCard({ task, assignees = [], commentCount = 0, onClick }: TaskCardProps) {
  const priority = priorityConfig[task.priority];
  const status = statusConfig[task.status];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="task-card-hover bg-card rounded-lg border border-border p-4 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full shrink-0", status.dot)} />
          <h3 className="text-sm font-medium leading-tight line-clamp-2">{task.title}</h3>
        </div>
        <Badge variant="outline" className={cn("shrink-0 text-[10px] px-1.5 py-0", priority.className)}>
          {priority.label}
        </Badge>
      </div>

      {task.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3 ml-4">
          {task.description}
        </p>
      )}

      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-2">
          {task.due_date && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              {format(new Date(task.due_date), "d MMM", { locale: es })}
            </div>
          )}
          {commentCount > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MessageSquare className="w-3 h-3" />
              {commentCount}
            </div>
          )}
        </div>

        <div className="flex -space-x-1.5">
          {assignees.slice(0, 3).map((a) => (
            <Avatar key={a.user_id} className="w-5 h-5 border-2 border-card">
              <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                {a.full_name?.[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
          ))}
          {assignees.length > 3 && (
            <Avatar className="w-5 h-5 border-2 border-card">
              <AvatarFallback className="text-[8px] bg-muted text-muted-foreground">
                +{assignees.length - 3}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export { priorityConfig, statusConfig };
