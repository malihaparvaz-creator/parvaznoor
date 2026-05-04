import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import { AppShell } from "./components/AppShell";
import { Quran } from "./screens/Quran";
import { Salah } from "./screens/Salah";
import { Stories } from "./screens/Stories";
import { Explorer } from "./screens/Explorer";
import { Qibla } from "./screens/Qibla";
import { Settings } from "./screens/Settings";
import { Dhikr } from "./screens/Dhikr";
import { IslamicCalendar } from "./screens/IslamicCalendar";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/quran" element={<AppShell><Quran /></AppShell>} />
          <Route path="/salah" element={<AppShell><Salah /></AppShell>} />
          <Route path="/stories" element={<AppShell><Stories /></AppShell>} />
          <Route path="/explorer" element={<AppShell><Explorer /></AppShell>} />
          <Route path="/qibla" element={<AppShell><Qibla /></AppShell>} />
          <Route path="/settings" element={<AppShell><Settings /></AppShell>} />
          <Route path="/dhikr" element={<AppShell><Dhikr /></AppShell>} />
          <Route path="/calendar" element={<AppShell><IslamicCalendar /></AppShell>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
