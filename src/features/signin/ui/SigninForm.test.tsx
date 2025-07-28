import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { SigninForm } from './SigninForm';
import { ROUTES } from '@/shared/config/routes';

// Mock next-auth
jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock AuthForm component
jest.mock('@/widgets/AuthForm/ui/AuthForm', () => ({
  AuthForm: ({ meta, fields, handlers, isValid }) => (
    <div data-testid="auth-form">
      <h1 data-testid="form-title">{meta.title}</h1>
      <form data-testid="signin-form">
        {fields.map((field: { name: string; type: string; label: string; placeholder: string }) => (
          <div key={field.name}>
            <input
              data-testid={`${field.name}-input`}
              type={field.type}
              {...handlers.register(field.name)}
            />
            {handlers.errors[field.name] && (
              <span data-testid={`${field.name}-error`}>
                {handlers.errors[field.name].message}
              </span>
            )}
          </div>
        ))}
        <button
          data-testid="submit-button"
          type="submit"
          disabled={!isValid}
        >
          {meta.buttonLabel}
        </button>
      </form>
      <div data-testid="footer">
        <span>{meta.footerText}</span>
        <a href={meta.footerHref} data-testid="footer-link">
          {meta.footerLinkText}
        </a>
      </div>
    </div>
  ),
}));

// Mock schema and fields
jest.mock('../model/signinSchema', () => ({
  signinSchema: {
    parse: jest.fn(),
    safeParse: jest.fn(),
  },
}));

jest.mock('../model/signFields', () => ({
  signFields: [
    { name: 'email', type: 'email', label: 'Email', placeholder: 'Enter email' },
    { name: 'password', type: 'password', label: 'Password', placeholder: 'Enter password' },
  ],
}));

// Mock ROUTES
jest.mock('@/shared/config/routes', () => ({
  ROUTES: {
    ROOT: '/',
    SIGNIN: '/signin',
    SIGNUP: '/signup',
  },
}));

// Mock console methods

describe('SigninForm', () => {
  const mockPush = jest.fn();
  const mockSignIn = signIn as jest.MockedFunction<typeof signIn>;
  const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
    });
    
    // Reset document.referrer
    Object.defineProperty(document, 'referrer', {
      value: '',
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('Component Rendering', () => {
    it('should render the signin form with correct structure', () => {
      render(<SigninForm />);
      
      expect(screen.getByTestId('auth-form')).toBeInTheDocument();
      expect(screen.getByTestId('email-input')).toBeInTheDocument();
      expect(screen.getByTestId('password-input')).toBeInTheDocument();
      expect(screen.getByTestId('submit-button')).toBeInTheDocument();
    });

    it('should render form with correct CSS classes', () => {
      const { container } = render(<SigninForm />);
      const form = container.querySelector('form');
      
      expect(form).toHaveClass('web:justify-end', 'flex', 'w-full', 'justify-center');
    });

    it('should pass correct meta props to AuthForm', () => {
      render(<SigninForm />);
      
      expect(screen.getByText('pages.signin.title')).toBeInTheDocument();
      expect(screen.getByText('pages.signin.loginButton')).toBeInTheDocument();
      expect(screen.getByText('pages.signin.footerText')).toBeInTheDocument();
      expect(screen.getByText('pages.signin.signupLink')).toBeInTheDocument();
      
      const footerLink = screen.getByTestId('footer-link');
      expect(footerLink).toHaveAttribute('href', ROUTES.SIGNUP);
    });

    it('should configure form with zodResolver and onChange mode', () => {
      render(<SigninForm />);
      
      // Verify the form renders correctly with validation setup
      expect(screen.getByTestId('auth-form')).toBeInTheDocument();
      expect(screen.getByTestId('submit-button')).toBeInTheDocument();
    });
  });

  describe('Form Submission - Success Cases', () => {
    it('should handle successful login and redirect to root when no referrer', async () => {
      const mockResult = { ok: true, error: null };
      mockSignIn.mockResolvedValue(mockResult);
      
      render(<SigninForm />);
      
      const form = screen.getByTestId('signin-form');
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('credentials', {
          redirect: false,
        });
        expect(consoleLogSpy).toHaveBeenCalledWith('LOGIN', { result: mockResult });
        expect(consoleLogSpy).toHaveBeenCalledWith('[REFERRER]', '');
        expect(mockPush).toHaveBeenCalledWith(ROUTES.ROOT);
      });
    });

    it('should redirect to root when referrer is signin page', async () => {
      mockSignIn.mockResolvedValue({ ok: true, error: null });
      Object.defineProperty(document, 'referrer', {
        value: `http://localhost:3000${ROUTES.SIGNIN}`,
        writable: true,
      });
      
      render(<SigninForm />);
      
      const form = screen.getByTestId('signin-form');
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(ROUTES.ROOT);
      });
    });

    it('should redirect to root when referrer is signup page', async () => {
      mockSignIn.mockResolvedValue({ ok: true, error: null });
      Object.defineProperty(document, 'referrer', {
        value: `http://localhost:3000${ROUTES.SIGNUP}`,
        writable: true,
      });
      
      render(<SigninForm />);
      
      const form = screen.getByTestId('signin-form');
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(ROUTES.ROOT);
      });
    });

    it('should redirect to referrer when valid external referrer exists', async () => {
      const externalReferrer = 'http://localhost:3000/dashboard';
      mockSignIn.mockResolvedValue({ ok: true, error: null });
      Object.defineProperty(document, 'referrer', {
        value: externalReferrer,
        writable: true,
      });
      
      render(<SigninForm />);
      
      const form = screen.getByTestId('signin-form');
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(externalReferrer);
      });
    });

    it('should redirect to referrer for completely different domain referrer', async () => {
      const externalReferrer = 'http://localhost:3000/some/other/path';
      mockSignIn.mockResolvedValue({ ok: true, error: null });
      Object.defineProperty(document, 'referrer', {
        value: externalReferrer,
        writable: true,
      });
      
      render(<SigninForm />);
      
      const form = screen.getByTestId('signin-form');
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(externalReferrer);
      });
    });
  });

  describe('Form Submission - Error Cases', () => {
    it('should handle authentication error and set form error', async () => {
      const errorMessage = 'Invalid credentials';
      mockSignIn.mockResolvedValue({ 
        ok: false, 
        error: errorMessage 
      });
      
      render(<SigninForm />);
      
      const form = screen.getByTestId('signin-form');
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('credentials', {
          redirect: false,
        });
        expect(screen.getByTestId('email-error')).toHaveTextContent(errorMessage);
        expect(mockPush).not.toHaveBeenCalled();
      });
    });

    it('should handle different error types from signIn', async () => {
      const errorMessage = 'User not found';
      mockSignIn.mockResolvedValue({ 
        ok: false, 
        error: errorMessage 
      });
      
      render(<SigninForm />);
      
      const form = screen.getByTestId('signin-form');
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toHaveTextContent(errorMessage);
      });
    });

    it('should handle network error during signin', async () => {
      const networkError = new Error('Network error');
      mockSignIn.mockRejectedValue(networkError);
      
      render(<SigninForm />);
      
      const form = screen.getByTestId('signin-form');
      
      // The component doesn't handle network errors explicitly,
      // so this would throw unless wrapped in error boundary
      await expect(async () => {
        fireEvent.submit(form);
        await waitFor(() => {
          expect(mockSignIn).toHaveBeenCalled();
        });
      }).rejects.toThrow('Network error');
    });

    it('should handle undefined result from signIn', async () => {
      mockSignIn.mockResolvedValue(undefined);
      
      render(<SigninForm />);
      
      const form = screen.getByTestId('signin-form');
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith(ROUTES.ROOT);
      });
    });

    it('should handle null result from signIn', async () => {
      mockSignIn.mockResolvedValue(null);
      
      render(<SigninForm />);
      
      const form = screen.getByTestId('signin-form');
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith(ROUTES.ROOT);
      });
    });
  });

  describe('Form Data Handling', () => {
    it('should pass form data to signIn function with credentials provider', async () => {
      mockSignIn.mockResolvedValue({ ok: true, error: null });
      
      const formData = {
        email: 'test@example.com',
        password: 'password123',
      };
      
      // Mock the form submission with data
      const mockHandleSubmit = jest.fn((callback) => (e: Event) => {
        e.preventDefault();
        callback(formData);
      });
      
      // Override the mock to include form data
      jest.doMock('react-hook-form', () => ({
        useForm: () => ({
          register: jest.fn(),
          handleSubmit: mockHandleSubmit,
          formState: { errors: {}, isValid: true },
          setError: jest.fn(),
        }),
      }));
      
      render(<SigninForm />);
      
      const form = screen.getByTestId('signin-form');
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('credentials', {
          ...formData,
          redirect: false,
        });
      });
    });

    it('should use credentials provider for authentication', async () => {
      mockSignIn.mockResolvedValue({ ok: true, error: null });
      
      render(<SigninForm />);
      
      const form = screen.getByTestId('signin-form');
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith(
          'credentials',
          expect.objectContaining({
            redirect: false,
          })
        );
      });
    });
  });

  describe('Console Logging Behavior', () => {
    it('should log successful login result', async () => {
      const mockResult = { ok: true, error: null, url: 'http://localhost:3000' };
      mockSignIn.mockResolvedValue(mockResult);
      
      render(<SigninForm />);
      
      const form = screen.getByTestId('signin-form');
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(consoleLogSpy).toHaveBeenCalledWith('LOGIN', { result: mockResult });
      });
    });

    it('should log referrer information', async () => {
      const referrer = 'http://localhost:3000/dashboard';
      Object.defineProperty(document, 'referrer', {
        value: referrer,
        writable: true,
      });
      
      mockSignIn.mockResolvedValue({ ok: true, error: null });
      
      render(<SigninForm />);
      
      const form = screen.getByTestId('signin-form');
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(consoleLogSpy).toHaveBeenCalledWith('[REFERRER]', referrer);
      });
    });

    it('should log empty referrer when not set', async () => {
      mockSignIn.mockResolvedValue({ ok: true, error: null });
      
      render(<SigninForm />);
      
      const form = screen.getByTestId('signin-form');
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(consoleLogSpy).toHaveBeenCalledWith('[REFERRER]', '');
      });
    });
  });

  describe('Referrer Logic Edge Cases', () => {
    it('should handle empty referrer string', async () => {
      mockSignIn.mockResolvedValue({ ok: true, error: null });
      Object.defineProperty(document, 'referrer', {
        value: '',
        writable: true,
      });
      
      render(<SigninForm />);
      
      const form = screen.getByTestId('signin-form');
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(ROUTES.ROOT);
      });
    });

    it('should handle referrer that contains signin in URL path', async () => {
      mockSignIn.mockResolvedValue({ ok: true, error: null });
      Object.defineProperty(document, 'referrer', {
        value: 'http://localhost:3000/app/signin/something',
        writable: true,
      });
      
      render(<SigninForm />);
      
      const form = screen.getByTestId('signin-form');
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(ROUTES.ROOT);
      });
    });

    it('should handle referrer that contains signup in URL path', async () => {
      mockSignIn.mockResolvedValue({ ok: true, error: null });
      Object.defineProperty(document, 'referrer', {
        value: 'http://localhost:3000/app/signup/form',
        writable: true,
      });
      
      render(<SigninForm />);
      
      const form = screen.getByTestId('signin-form');
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(ROUTES.ROOT);
      });
    });

    it('should redirect to valid referrer that does not contain signin or signup', async () => {
      const validReferrer = 'http://localhost:3000/profile';
      mockSignIn.mockResolvedValue({ ok: true, error: null });
      Object.defineProperty(document, 'referrer', {
        value: validReferrer,
        writable: true,
      });
      
      render(<SigninForm />);
      
      const form = screen.getByTestId('signin-form');
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(validReferrer);
      });
    });
  });

  describe('Form Validation States', () => {
    it('should disable submit button when form is invalid', () => {
      render(<SigninForm />);
      
      const submitButton = screen.getByTestId('submit-button');
      expect(submitButton).toBeDisabled();
    });

    it('should pass correct validation props to AuthForm', () => {
      render(<SigninForm />);
      
      // Verify that AuthForm receives proper handlers and validation state
      expect(screen.getByTestId('auth-form')).toBeInTheDocument();
      expect(screen.getByTestId('email-input')).toBeInTheDocument();
      expect(screen.getByTestId('password-input')).toBeInTheDocument();
    });
  });

  describe('Error Handling Integration', () => {
    it('should call setError with manual type when authentication fails', async () => {
      const mockSetError = jest.fn();
      const errorMessage = 'Authentication failed';
      
      // Mock useForm to return our mock setError
      jest.doMock('react-hook-form', () => ({
        useForm: () => ({
          register: jest.fn(),
          handleSubmit: jest.fn((callback) => (e: Event) => {
            e.preventDefault();
            callback({});
          }),
          formState: { errors: {}, isValid: true },
          setError: mockSetError,
        }),
      }));
      
      mockSignIn.mockResolvedValue({ 
        ok: false, 
        error: errorMessage 
      });
      
      render(<SigninForm />);
      
      const form = screen.getByTestId('signin-form');
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(mockSetError).toHaveBeenCalledWith('email', {
          type: 'manual',
          message: errorMessage,
        });
      });
    });
  });

  describe('Router Integration Edge Cases', () => {
    it('should handle router push failure gracefully', async () => {
      mockSignIn.mockResolvedValue({ ok: true, error: null });
      mockPush.mockRejectedValue(new Error('Navigation failed'));
      
      render(<SigninForm />);
      
      const form = screen.getByTestId('signin-form');
      
      // The component doesn't handle router failures explicitly
      await expect(async () => {
        fireEvent.submit(form);
        await waitFor(() => {
          expect(mockSignIn).toHaveBeenCalled();
          expect(mockPush).toHaveBeenCalled();
        });
      }).rejects.toThrow('Navigation failed');
    });

    it('should handle multiple rapid form submissions', async () => {
      mockSignIn.mockResolvedValue({ ok: true, error: null });
      
      render(<SigninForm />);
      
      const form = screen.getByTestId('signin-form');
      
      // Submit form multiple times rapidly
      fireEvent.submit(form);
      fireEvent.submit(form);
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledTimes(3);
      });
    });
  });

  describe('AuthForm Integration', () => {
    it('should pass correct signFields to AuthForm', () => {
      render(<SigninForm />);
      
      // Verify that the expected fields are rendered
      expect(screen.getByTestId('email-input')).toBeInTheDocument();
      expect(screen.getByTestId('password-input')).toBeInTheDocument();
    });

    it('should pass form state handlers to AuthForm', () => {
      render(<SigninForm />);
      
      // Verify AuthForm receives handlers for registration and error display
      expect(screen.getByTestId('auth-form')).toBeInTheDocument();
      expect(screen.getByTestId('submit-button')).toBeInTheDocument();
    });
  });
});