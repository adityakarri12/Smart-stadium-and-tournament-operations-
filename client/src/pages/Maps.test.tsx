import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import '@testing-library/jest-dom';
import { Maps } from './Maps';
import * as AuthContext from '../contexts/AuthContext';
import * as StadiumContext from '../contexts/StadiumContext';
import { useQuery } from '@tanstack/react-query';

beforeAll(() => {
  // Mock scrollIntoView which is missing in jsdom
  window.HTMLElement.prototype.scrollIntoView = vi.fn();

  // Mock speechSynthesis which is missing in jsdom
  (window as any).speechSynthesis = {
    cancel: vi.fn(),
    speak: vi.fn(),
  } as any;
  (window as any).SpeechSynthesisUtterance = class {
    lang = '';
    text = '';
  };
});

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const original = await importOriginal<any>();
  return {
    ...original,
    useQuery: vi.fn(),
    useQueryClient: vi.fn().mockReturnValue({
      invalidateQueries: vi.fn(),
    }),
  };
});

describe('Maps Component', () => {
  it('renders stadium map and handles SOS trigger', () => {
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

    vi.mocked(useQuery).mockReturnValue({
      data: {
        data: {
          zones: [
            { id: 'z1', name: 'North Stand', density: 'LOW', riskLevel: 'NORMAL', waitingTime: 5, facilities: [] }
          ]
        }
      },
      isLoading: false,
      isError: false
    } as any);

    render(
      <HelmetProvider>
        <Maps />
      </HelmetProvider>
    );

    // Verify Title is rendered
    expect(screen.getByText('Smart Operational Map')).toBeInTheDocument();

    // Verify SOS button is rendered
    const sosBtn = screen.getByRole('button', { name: 'Toggle Emergency Evacuation Mode' });
    expect(sosBtn).toBeInTheDocument();

    // Trigger SOS
    fireEvent.click(sosBtn);

    // Should display active alert
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
