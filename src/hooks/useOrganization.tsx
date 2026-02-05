import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Tables } from "@/integrations/supabase/types";

type Organization = Tables<"organizations">;

interface OrgContextType {
  currentOrg: Organization | null;
  organizations: Organization[];
  setCurrentOrg: (org: Organization) => void;
  loading: boolean;
  refetch: () => void;
}

const OrgContext = createContext<OrgContextType>({
  currentOrg: null,
  organizations: [],
  setCurrentOrg: () => {},
  loading: true,
  refetch: () => {},
});

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrgs = async () => {
    if (!user) {
      setOrganizations([]);
      setCurrentOrg(null);
      setLoading(false);
      return;
    }

    const { data: memberships } = await supabase
      .from("organization_members")
      .select("org_id")
      .eq("user_id", user.id);

    if (memberships && memberships.length > 0) {
      const orgIds = memberships.map((m) => m.org_id);
      const { data: orgs } = await supabase
        .from("organizations")
        .select("*")
        .in("id", orgIds);

      if (orgs) {
        setOrganizations(orgs);
        if (!currentOrg || !orgs.find((o) => o.id === currentOrg.id)) {
          setCurrentOrg(orgs[0] || null);
        }
      }
    } else {
      setOrganizations([]);
      setCurrentOrg(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrgs();
  }, [user]);

  return (
    <OrgContext.Provider
      value={{
        currentOrg,
        organizations,
        setCurrentOrg,
        loading,
        refetch: fetchOrgs,
      }}
    >
      {children}
    </OrgContext.Provider>
  );
}

export const useOrganization = () => useContext(OrgContext);
