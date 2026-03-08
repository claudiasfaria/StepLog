import { useState } from "react";
import { User } from "@/types/steplog";
import AuthPage from "@/components/AuthPage";
import PublicDashboard from "@/components/public/PublicDashboard";
import EntityDashboard from "@/components/entity/EntityDashboard";
import StudentDashboard from "@/components/student/StudentDashboard";
import { useAdminEmails } from "@/lib/api";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const { data: adminEmails = [] } = useAdminEmails();

  if (!user) return <AuthPage onLogin={setUser} />;

  // O email determina automaticamente o papel: admins vão para EntityDashboard, todos os outros para StudentDashboard.
  const isAdmin  = adminEmails.includes(user.email.toLowerCase());
  if (isAdmin) return <EntityDashboard user={user} onLogout={() => setUser(null)} />;

  const isPublic = user.campus?.isPublic === true;
  if (isPublic) return <PublicDashboard user={user} onLogout={() => setUser(null)} />;

  return <StudentDashboard user={user} onLogout={() => setUser(null)} />;
}