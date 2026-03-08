import { ReactNode, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { User } from "@/types/steplog";

interface Props {
  children: ReactNode;
  user: User;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function DashboardLayout({ children, user, onLogout, activeTab, setActiveTab }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 800);
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      {/* Sidebar fixa à esquerda */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} campus={user.campus} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Área de conteúdo à direita */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header fixo no topo */}
        <Header 
          user={user} 
          isConnected={true} 
          isLoading={isLoading} 
          lastUpdated={new Date()} 
          onRefresh={handleRefresh} 
          onLogout={onLogout} 
          activeTab={activeTab} 
        />

        {/* Área de Scroll do conteúdo principal */}
        <main className="flex-1 overflow-y-auto p-6 bg-zinc-950/50 scrollbar-hide">
          <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}