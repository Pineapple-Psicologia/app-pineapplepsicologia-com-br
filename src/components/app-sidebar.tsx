import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Users, FileText, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

type RecentSession = {
  id: string;
  patient_id: string;
  session_date: string;
  patient_name: string;
};

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { user, signOut } = useAuth();
  const currentPath = useRouterState({
    select: (r) => r.location.pathname,
  });

  const [recent, setRecent] = useState<RecentSession[]>([]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const load = async () => {
      const { data } = await supabase
        .from("sessions")
        .select("id, patient_id, session_date, patients(name)")
        .order("session_date", { ascending: false })
        .limit(8);
      if (cancelled || !data) return;
      setRecent(
        data.map((s: any) => ({
          id: s.id,
          patient_id: s.patient_id,
          session_date: s.session_date,
          patient_name: s.patients?.name ?? "Paciente",
        })),
      );
    };

    load();

    const channel = supabase
      .channel("sidebar-sessions")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sessions" },
        () => load(),
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user]);

  const isActive = (path: string) => currentPath === path;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link to="/" className="flex items-center gap-2 px-2 py-1">
          <div className="h-7 w-7 rounded-md bg-primary text-primary-foreground grid place-items-center text-sm font-semibold">
            L
          </div>
          {!collapsed && <span className="font-semibold">Lúdico Clínico</span>}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/pacientes")} tooltip="Pacientes">
                  <Link to="/pacientes" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {!collapsed && <span>Pacientes</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!collapsed && (
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center gap-2">
              <FileText className="h-3.5 w-3.5" /> Prontuários recentes
            </SidebarGroupLabel>
            <SidebarGroupContent>
              {recent.length === 0 ? (
                <p className="px-2 py-1 text-xs text-muted-foreground">
                  Nenhum prontuário ainda.
                </p>
              ) : (
                <SidebarMenu>
                  {recent.map((s) => (
                    <SidebarMenuItem key={s.id}>
                      <SidebarMenuButton asChild tooltip={s.patient_name}>
                        <Link
                          to="/pacientes/$patientId"
                          params={{ patientId: s.patient_id }}
                          hash={s.id}
                          className="flex flex-col items-start gap-0.5 h-auto py-2"
                        >
                          <span className="text-sm font-medium truncate w-full">
                            {s.patient_name}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {new Date(s.session_date).toLocaleString("pt-BR", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut()}
          className="justify-start"
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Sair</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
