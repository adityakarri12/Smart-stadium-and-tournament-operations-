import { Suspense, lazy } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { AppErrorBoundary } from './components/AppErrorBoundary';
import { RouteLoader } from './components/RouteLoader';
import { StadiumProvider } from './contexts/StadiumContext';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

const Layout = lazy(() => import('./layouts/Layout').then(module => ({ default: module.Layout })));
const Home = lazy(() => import('./pages/Home').then(module => ({ default: module.Home })));
const Assistant = lazy(() => import('./pages/Assistant').then(module => ({ default: module.Assistant })));
const DashboardView = lazy(() => import('./pages/DashboardView').then(module => ({ default: module.DashboardView })));
const Maps = lazy(() => import('./pages/Maps').then(module => ({ default: module.Maps })));
const Login = lazy(() => import('./pages/Login').then(module => ({ default: module.Login })));
const Analytics = lazy(() => import('./pages/Analytics').then(module => ({ default: module.Analytics })));

const queryClient = new QueryClient();

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <Helmet>
          <html lang="en" />
          <title>FIFA World Cup 2026 Smart Stadium Platform</title>
          <meta name="description" content="Official FIFA World Cup 2026 smart stadium operations platform for live dashboards, maps, AI assistance, accessibility, and crowd intelligence." />
          <meta name="keywords" content="FIFA World Cup 2026, smart stadium, stadium operations, crowd analytics, accessibility, AI assistant" />
          <meta name="robots" content="index,follow" />
          <link rel="canonical" href="https://fifa2026.smartstadium.example/" />
          <meta property="og:type" content="website" />
          <meta property="og:title" content="FIFA World Cup 2026 Smart Stadium Platform" />
          <meta property="og:description" content="Live stadium intelligence for operations, navigation, accessibility, and AI-guided spectator support." />
          <meta property="og:image" content="/og-image.png" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="FIFA World Cup 2026 Smart Stadium Platform" />
          <meta name="twitter:description" content="Live stadium intelligence for operations, navigation, accessibility, and AI-guided spectator support." />
          <script type="application/ld+json">
            {JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'FIFA World Cup 2026 Smart Stadium Platform',
              applicationCategory: 'SportsApplication',
              operatingSystem: 'Web',
              description: 'Official stadium operations platform for crowd intelligence, navigation, and accessibility.',
              areaServed: ['United States', 'Canada', 'Mexico'],
            })}
          </script>
        </Helmet>
        
        <AuthProvider>
          <StadiumProvider>
            <AppErrorBoundary>
              <BrowserRouter>
                <Suspense fallback={<RouteLoader />}>
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    
                    <Route path="/" element={<Layout />}>
                      <Route index element={<Home />} />
                      <Route path="assistant" element={
                        <ProtectedRoute>
                          <Assistant />
                        </ProtectedRoute>
                      } />
                      <Route path="dashboard" element={
                        <ProtectedRoute>
                          <DashboardView />
                        </ProtectedRoute>
                      } />
                      <Route path="maps" element={
                        <ProtectedRoute>
                          <Maps />
                        </ProtectedRoute>
                      } />
                      <Route path="analytics" element={
                        <ProtectedRoute>
                          <Analytics />
                        </ProtectedRoute>
                      } />
                      <Route path="*" element={<Home />} />
                    </Route>
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </AppErrorBoundary>
          </StadiumProvider>
        </AuthProvider>
        
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
