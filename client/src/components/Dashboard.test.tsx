import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@testing-library/jest-dom';
import { Dashboard } from './Dashboard';
import { StadiumProvider } from '../contexts/StadiumContext';
import * as StadiumContext from '../contexts/StadiumContext';

describe('Dashboard Component', () => {
  it('renders error state initially since no stadium is selected', () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <StadiumProvider>
          <Dashboard />
        </StadiumProvider>
      </QueryClientProvider>
    );
    
    expect(screen.getByText('Error loading dashboard telemetry.')).toBeInTheDocument();
  });

  it('renders loading indicator when activeStadiumId is set', () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    // Mock activeStadiumId to trigger the fetch query
    vi.spyOn(StadiumContext, 'useStadium').mockReturnValue({
      activeStadiumId: 'c1a7b4f5-5d9c-4b6a-9f8e-d2b3c4a5b6c7',
      setActiveStadiumId: () => {}
    });

    render(
      <QueryClientProvider client={queryClient}>
        <Dashboard />
      </QueryClientProvider>
    );

    // The typing-indicator div has aria-label="Loading dashboard data"
    expect(screen.getByLabelText('Loading dashboard data')).toBeInTheDocument();
  });
});
