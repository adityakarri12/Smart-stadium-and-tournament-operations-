import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import '@testing-library/jest-dom';
import { Login } from './Login';
import * as AuthContext from '../contexts/AuthContext';
import * as StadiumContext from '../contexts/StadiumContext';

describe('Login Component', () => {
  beforeEach(() => {
    vi.spyOn(StadiumContext, 'useStadium').mockReturnValue({
      activeStadiumId: null,
      setActiveStadiumId: vi.fn(),
    });
  });

  it('renders Step 1 (Authentication form) initially when not authenticated', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      isAuthenticated: false,
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

    render(
      <HelmetProvider>
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      </HelmetProvider>
    );

    // Verify Title and Subtitle exist
    expect(screen.getByText('Command Center')).toBeInTheDocument();
    
    // Verify inputs and submit button are rendered
    expect(screen.getByLabelText('Work Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Access Code / Password')).toBeInTheDocument();
  });

  it('validates continue button is disabled initially', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      isAuthenticated: false,
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

    render(
      <HelmetProvider>
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      </HelmetProvider>
    );

    const submitBtn = screen.getByRole('button', { name: 'Continue' });
    expect(submitBtn).toBeDisabled();
  });
});
