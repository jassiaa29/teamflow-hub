import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { UserPlus, Shield, User, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface MemberWithProfile {
  id: string;
  user_id: string;
  role: "member" | "admin";
  joined_at: string;
  profile: { full_name: string; avatar_url: string | null } | null;
  email?: string;
}

export default function Team() {
  const { currentOrg } = useOrganization();
  const { user } = useAuth();
  const { toast } = useToast();
  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchMembers = async () => {
    if (!currentOrg) return;
    setLoading(true);

    const { data: memberships } = await supabase
      .from("organization_members")
      .select("*")
      .eq("org_id", currentOrg.id);

    if (memberships) {
      const userIds = memberships.map((m) => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

      setMembers(
        memberships.map((m) => ({
          ...m,
          profile: profileMap.get(m.user_id) || null,
        }))
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMembers();
  }, [currentOrg]);

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !currentOrg) return;

    setInviting(true);
    // Note: In a real app, you'd look up the user by email or send an invite
    // For now, we show a message about the limitation
    toast({
      title: "Función de invitación",
      description: "El usuario debe registrarse primero. Luego podrás agregarlo por ID.",
    });
    setInviting(false);
    setDialogOpen(false);
    setInviteEmail("");
  };

  const currentUserIsAdmin = members.some(
    (m) => m.user_id === user?.id && m.role === "admin"
  );

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Equipo</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {currentOrg ? `Miembros de ${currentOrg.name}` : "Selecciona una organización"}
            </p>
          </div>

          {currentUserIsAdmin && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <UserPlus className="w-4 h-4" />
                  Invitar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invitar miembro</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <div className="space-y-2">
                    <Label>Email del miembro</Label>
                    <Input
                      placeholder="miembro@email.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleInvite} disabled={inviting} className="w-full">
                    {inviting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    Enviar invitación
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground text-sm">Cargando...</div>
        ) : members.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <User className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No hay miembros en esta organización</p>
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((member, idx) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card>
                  <CardContent className="flex items-center gap-4 p-4">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {member.profile?.full_name?.[0]?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {member.profile?.full_name || "Usuario"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Se unió el {new Date(member.joined_at).toLocaleDateString("es")}
                      </p>
                    </div>
                    <Badge
                      variant={member.role === "admin" ? "default" : "secondary"}
                      className="gap-1 shrink-0"
                    >
                      {member.role === "admin" ? (
                        <Shield className="w-3 h-3" />
                      ) : (
                        <User className="w-3 h-3" />
                      )}
                      {member.role === "admin" ? "Admin" : "Miembro"}
                    </Badge>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
