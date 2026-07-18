import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import '@testing-library/jest-dom';
import { Assistant } from './Assistant';
import * as AuthContext from '../contexts/AuthContext';
import * as StadiumContext from '../contexts/StadiumContext';

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

describe('Assistant Page Component', () => {
  it('renders chat assistant view correctly with suggestions', () => {
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

    render(
      <HelmetProvider>
        <Assistant />
      </HelmetProvider>
    );

    // Verify header title
    expect(screen.getByText('AI Stadium Assistant')).toBeInTheDocument();
    
    // Verify welcome message is visible in chat history
    expect(screen.getByText(/Welcome to the FIFA World Cup 2026/)).toBeInTheDocument();

    // Verify suggestions section is displayed
    expect(screen.getByText('Suggested Questions')).toBeInTheDocument();

    // Verify input text box is rendered with correct label/placeholder
    const chatInput = screen.getByLabelText('Type your message');
    expect(chatInput).toBeInTheDocument();
  });

  it('updates text input value when user types', () => {
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

    render(
      <HelmetProvider>
        <Assistant />
      </HelmetProvider>
    );

    const chatInput = screen.getByLabelText('Type your message') as HTMLInputElement;
    fireEvent.change(chatInput, { target: { value: 'Where is gate C?' } });

    expect(chatInput.value).toBe('Where is gate C?');
  });
});
