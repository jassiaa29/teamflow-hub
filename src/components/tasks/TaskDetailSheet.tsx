import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { Tables, Database } from "@/integrations/supabase/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Clock, Send, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { priorityConfig, statusConfig } from "./TaskCard";

type Task = Tables<"tasks">;
type Comment = Tables<"comments">;
type TaskStatus = Database["public"]["Enums"]["task_status"];

interface TaskDetailSheetProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
}

export default function TaskDetailSheet({ task, open, onOpenChange, onUpdated }: TaskDetailSheetProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<(Comment & { profile?: { full_name: string } })[]>([]);
  const [newComment, setNewComment] = useState("");
  const [sendingComment, setSendingComment] = useState(false);

  useEffect(() => {
    if (task && open) {
      fetchComments();
    }
  }, [task?.id, open]);

  const fetchComments = async () => {
    if (!task) return;
    const { data } = await supabase
      .from("comments")
      .select("*")
      .eq("task_id", task.id)
      .order("created_at", { ascending: true });

    if (data) {
      // Fetch profiles for comment authors
      const userIds = [...new Set(data.map(c => c.user_id).filter(Boolean))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      setComments(data.map(c => ({
        ...c,
        profile: c.user_id ? profileMap.get(c.user_id) as { full_name: string } | undefined : undefined,
      })));
    }
  };

  const handleStatusChange = async (status: TaskStatus) => {
    if (!task) return;
    const { error } = await supabase.from("tasks").update({ status }).eq("id", task.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      onUpdated?.();
    }
  };

  const handleAddComment = async () => {
    if (!task || !user || !newComment.trim()) return;
    setSendingComment(true);
    const { error } = await supabase.from("comments").insert({
      task_id: task.id,
      user_id: user.id,
      content: newComment.trim(),
    });
    setSendingComment(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setNewComment("");
      fetchComments();
    }
  };

  if (!task) return null;

  const priority = priorityConfig[task.priority];
  const status = statusConfig[task.status];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg flex flex-col">
        <SheetHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className={cn("w-2.5 h-2.5 rounded-full", status.dot)} />
            <Badge variant="outline" className={cn("text-xs", priority.className)}>
              {priority.label}
            </Badge>
          </div>
          <SheetTitle className="text-left">{task.title}</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-6 mt-4">
          {/* Status & Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground w-20">Estado</span>
              <Select value={task.status} onValueChange={(v) => handleStatusChange(v as TaskStatus)}>
                <SelectTrigger className="w-44 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">Por hacer</SelectItem>
                  <SelectItem value="in_progress">En progreso</SelectItem>
                  <SelectItem value="in_review">En revisión</SelectItem>
                  <SelectItem value="done">Completada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {task.due_date && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground w-20">Fecha</span>
                <div className="flex items-center gap-1.5 text-sm">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  {format(new Date(task.due_date), "d 'de' MMMM, yyyy", { locale: es })}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground w-20">Creada</span>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                {format(new Date(task.created_at), "d MMM yyyy, HH:mm", { locale: es })}
              </div>
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <div>
              <h4 className="text-sm font-medium mb-2">Descripción</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          {/* Comments */}
          <div>
            <h4 className="text-sm font-medium mb-3">
              Comentarios ({comments.length})
            </h4>
            <div className="space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-2">
                  <Avatar className="w-6 h-6 shrink-0 mt-0.5">
                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                      {comment.profile?.full_name?.[0]?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-medium">
                        {comment.profile?.full_name || "Usuario"}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(comment.created_at), "d MMM, HH:mm", { locale: es })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{comment.content}</p>
                  </div>
                </div>
              ))}
              {comments.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay comentarios aún
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Add Comment */}
        <div className="border-t border-border pt-3 mt-3">
          <div className="flex gap-2">
            <Textarea
              placeholder="Escribe un comentario..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={2}
              className="resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  handleAddComment();
                }
              }}
            />
            <Button
              size="icon"
              className="shrink-0 self-end"
              onClick={handleAddComment}
              disabled={sendingComment || !newComment.trim()}
            >
              {sendingComment ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
