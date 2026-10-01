import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Analytics } from "@vercel/analytics/react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import SimplifiedResume from "./pages/SimplifiedResume";
import { BlogListPage, BlogPostPage } from "./pages/Blog";
import DoomsWaitlist from "./pages/DoomsWaitlist";
import NotFound from "./pages/NotFound";
import { SeoManager } from "@/components/seo/SeoManager";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SeoManager />
        <Routes>
          <Route path="/" element={<SimplifiedResume />} />
          <Route path="/desktop" element={<Index />} />
          <Route path="/simplified" element={<Navigate to="/" replace />} />
          <Route path="/blogs" element={<BlogListPage />} />
          <Route path="/blogs/:slug" element={<BlogPostPage />} />
          <Route path="/blog" element={<Navigate to="/blogs" replace />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/admin" element={<Navigate to="/" replace />} />
          <Route path="/dooms" element={<DoomsWaitlist />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      <Analytics />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
