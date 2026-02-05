import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/hooks/useOrganization";
import Dashboard from "./Dashboard";
import NewOrg from "./NewOrg";
import { Skeleton } from "@/components/ui/skeleton";

export default function Index() {
  const { loading: authLoading } = useAuth();
  const { currentOrg, organizations, loading: orgLoading } = useOrganization();

  if (authLoading || orgLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-4 w-full max-w-md px-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (organizations.length === 0) {
    return <NewOrg />;
  }

  return <Dashboard />;
}
