import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/hooks/useOrganization";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Loader2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function NewOrg() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { refetch } = useOrganization();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;

    setLoading(true);

    // Create organization
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .insert({ name: name.trim(), created_by: user.id })
      .select()
      .single();

    if (orgError || !org) {
      toast({ title: "Error al crear organización", description: orgError?.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    // Add creator as admin
    const { error: memberError } = await supabase
      .from("organization_members")
      .insert({ org_id: org.id, user_id: user.id, role: "admin" });

    setLoading(false);

    if (memberError) {
      toast({ title: "Error al agregar miembro", description: memberError.message, variant: "destructive" });
      return;
    }

    toast({ title: "¡Organización creada!" });
    await refetch();
    navigate("/");
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-center min-h-[80vh] p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card>
            <CardHeader className="text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mx-auto mb-3">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Crear organización</CardTitle>
              <CardDescription>
                Crea un equipo para colaborar en tareas juntos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="org-name">Nombre de la organización</Label>
                  <Input
                    id="org-name"
                    placeholder="Mi equipo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <Button className="w-full" type="submit" disabled={loading}>
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <ArrowRight className="w-4 h-4 mr-2" />
                  )}
                  Crear organización
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AppLayout>
  );
}
