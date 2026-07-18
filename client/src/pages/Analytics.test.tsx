import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import '@testing-library/jest-dom';
import { Analytics } from './Analytics';
import * as AuthContext from '../contexts/AuthContext';
import * as StadiumContext from '../contexts/StadiumContext';
import { useQuery } from '@tanstack/react-query';

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const original = await importOriginal<any>();
  return {
    ...original,
    useQuery: vi.fn(),
  };
});

describe('Analytics Component', () => {
  it('renders operational analytics details correctly', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
      isLoading: false,
      userProfile: {
        name: 'Alex Johnson',
        preferredLanguage: 'en',
        accessibilityPreference: 'none',
        ticketSection: 'North Stand',
        seatNumber: 'A-12',
      },
      updateUserProfile: vi.fn(),
    });

    vi.spyOn(StadiumContext, 'useStadium').mockReturnValue({
      activeStadiumId: 'c1a7b4f5-5d9c-4b6a-9f8e-d2b3c4a5b6c7',
      setActiveStadiumId: vi.fn()
    });

    vi.mocked(useQuery).mockImplementation((options: any) => {
      if (options.queryKey[0] === 'dashboard') {
        return {
          data: {
            data: {
              stadiumName: 'SoFi Stadium',
              zones: [
                { id: '1', name: 'North Stand', density: 'LOW', riskLevel: 'NORMAL', waitingTime: 5, facilities: [] }
              ],
              events: [],
              incidents: [],
              kpis: {
                totalSpectators: 50000,
                occupancyPercent: 83,
                activeIncidents: 0,
                openFacilities: 5,
                avgWaitTime: 5
              }
            }
          },
          isLoading: false,
          isError: false
        } as any;
      }
      if (options.queryKey[0] === 'analyticsDigest') {
        return {
          data: {
            data: {
              digest: 'Mocked operational digest analysis'
            }
          },
          isLoading: false,
          isError: false
        } as any;
      }
      return { isLoading: true } as any;
    });

    render(
      <HelmetProvider>
        <Analytics />
      </HelmetProvider>
    );

    expect(screen.getByText('Operational Analytics')).toBeInTheDocument();
    expect(screen.getByText('Mocked operational digest analysis')).toBeInTheDocument();
    expect(screen.getByText('83%')).toBeInTheDocument();
  });
});
