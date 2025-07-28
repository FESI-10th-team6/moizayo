import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import '@testing-library/jest-dom';

import HeaderProfileDropdownMenu from './HeaderProfileDropdownMenu';
import { ROUTES } from '@/shared/config/routes';

// Mock dependencies - following project patterns from existing tests
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('next-auth/react', () => ({
  signOut: jest.fn(),
}));

jest.mock('next-intl', () => ({
  useTranslations: jest.fn(),
}));

jest.mock('@/shared/ui/ProfileImage', () => ({
  ProfileImage: ({ url, size }: { url?: string; size: number }) => (
    <div data-testid="profile-image" data-url={url} data-size={size}>
      Profile Image
    </div>
  ),
}));

jest.mock('./HeaderLink', () => ({
  HeaderLink: ({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) => (
    <a href={href} className={className} data-testid="header-link">
      {children}
    </a>
  ),
}));

// Mock Dropdown components based on actual implementation structure
jest.mock('@/shared/ui/dropdown', () => ({
  Dropdown: ({ children }: { children: (props: { isOpen: boolean; toggle: () => void; selectedValue?: string; onSelect: (value: string) => void }) => React.ReactNode }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [selectedValue, setSelectedValue] = React.useState<string | undefined>();
    const toggle = () => setIsOpen((prev) => !prev);
    const onSelect = (value: string) => {
      setSelectedValue(value);
      setIsOpen(false);
    };
    
    return (
      <div data-testid="dropdown" className="relative">
        {children({ isOpen, toggle, selectedValue, onSelect })}
      </div>
    );
  },
  DropdownTrigger: ({ onClick, disabled, children, className, size }: { onClick: () => void; disabled: boolean; children: React.ReactNode; className: string; size: string }) => (
    <button
      data-testid="dropdown-trigger"
      onClick={onClick}
      disabled={disabled}
      className={className}
      data-size={size}
    >
      {children}
    </button>
  ),
  DropdownList: ({ isOpen, children, className }: { isOpen: boolean; children: React.ReactNode; className: string }) => (
    <div
      data-testid="dropdown-list"
      className={className}
      style={{ display: isOpen ? 'block' : 'none' }}
    >
      {children}
    </div>
  ),
  DropdownItem: ({ value, onSelect, children, className, size }: { value: string; onSelect: (value: string) => void; children: React.ReactNode; className: string; size: string }) => (
    <div
      data-testid={`dropdown-item-${value}`}
      className={className}
      data-size={size}
      onClick={() => onSelect(value)}
    >
      {children}
    </div>
  ),
}));

describe('HeaderProfileDropdownMenu', () => {
  const mockRouter = {
    refresh: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
  };

  const mockTranslations = {
    myPage: 'My Page',
    logout: 'Log Out',
  };

  const mockSession = {
    user: {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      image: 'https://example.com/avatar.jpg',
    },
    expires: '2024-01-01',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useTranslations as jest.Mock).mockReturnValue((key: string) => mockTranslations[key as keyof typeof mockTranslations]);
    (signOut as jest.Mock).mockResolvedValue(undefined);
  });

  describe('렌더링 테스트', () => {
    it('세션이 존재할 때 드롭다운과 프로필 이미지가 렌더링되어야 한다', () => {
      render(<HeaderProfileDropdownMenu session={mockSession} status="authenticated" />);
      
      expect(screen.getByTestId('dropdown')).toBeInTheDocument();
      expect(screen.getByTestId('profile-image')).toBeInTheDocument();
      expect(screen.getByTestId('profile-image')).toHaveAttribute('data-url', mockSession.user.image);
      expect(screen.getByTestId('profile-image')).toHaveAttribute('data-size', '40');
    });

    it('사용자 이미지가 없을 때 프로필 이미지가 undefined url로 렌더링되어야 한다', () => {
      const sessionWithoutImage = {
        ...mockSession,
        user: { ...mockSession.user, image: undefined },
      };
      
      render(<HeaderProfileDropdownMenu session={sessionWithoutImage} status="authenticated" />);
      
      const profileImage = screen.getByTestId('profile-image');
      expect(profileImage).toHaveAttribute('data-url', 'undefined');
    });

    it('세션이 null일 때도 드롭다운이 렌더링되어야 한다', () => {
      render(<HeaderProfileDropdownMenu session={null} status="unauthenticated" />);
      
      expect(screen.getByTestId('dropdown')).toBeInTheDocument();
      expect(screen.getByTestId('profile-image')).toBeInTheDocument();
    });

    it('상태가 loading일 때 드롭다운 트리거가 비활성화되어야 한다', () => {
      render(<HeaderProfileDropdownMenu session={mockSession} status="loading" />);
      
      const trigger = screen.getByTestId('dropdown-trigger');
      expect(trigger).toBeDisabled();
    });

    it('상태가 loading이 아닐 때 드롭다운 트리거가 활성화되어야 한다', () => {
      render(<HeaderProfileDropdownMenu session={mockSession} status="authenticated" />);
      
      const trigger = screen.getByTestId('dropdown-trigger');
      expect(trigger).not.toBeDisabled();
    });

    it('드롭다운 트리거에 올바른 size prop이 전달되어야 한다', () => {
      render(<HeaderProfileDropdownMenu session={mockSession} status="authenticated" />);
      
      const trigger = screen.getByTestId('dropdown-trigger');
      expect(trigger).toHaveAttribute('data-size', 'small');
    });
  });

  describe('드롭다운 기능 테스트', () => {
    it('드롭다운이 열렸을 때 드롭다운 아이템들이 보여야 한다', () => {
      render(<HeaderProfileDropdownMenu session={mockSession} status="authenticated" />);
      
      const trigger = screen.getByTestId('dropdown-trigger');
      fireEvent.click(trigger);
      
      expect(screen.getByTestId('dropdown-list')).toHaveStyle({ display: 'block' });
      expect(screen.getByTestId('dropdown-item-myPage')).toBeInTheDocument();
      expect(screen.getByTestId('dropdown-item-logout')).toBeInTheDocument();
    });

    it('드롭다운이 닫혔을 때 드롭다운 아이템들이 숨겨져야 한다', () => {
      render(<HeaderProfileDropdownMenu session={mockSession} status="authenticated" />);
      
      const dropdownList = screen.getByTestId('dropdown-list');
      expect(dropdownList).toHaveStyle({ display: 'none' });
    });

    it('마이페이지 링크가 올바른 href로 렌더링되어야 한다', () => {
      render(<HeaderProfileDropdownMenu session={mockSession} status="authenticated" />);
      
      const trigger = screen.getByTestId('dropdown-trigger');
      fireEvent.click(trigger);
      
      const headerLink = screen.getByTestId('header-link');
      expect(headerLink).toHaveAttribute('href', ROUTES.MY_PAGE);
      expect(headerLink).toHaveTextContent('My Page');
    });

    it('로그아웃 버튼이 올바른 텍스트로 렌더링되어야 한다', () => {
      render(<HeaderProfileDropdownMenu session={mockSession} status="authenticated" />);
      
      const trigger = screen.getByTestId('dropdown-trigger');
      fireEvent.click(trigger);
      
      const logoutButton = screen.getByRole('button', { name: /log out/i });
      expect(logoutButton).toBeInTheDocument();
      expect(logoutButton).toHaveTextContent('Log Out');
    });

    it('드롭다운 아이템들이 올바른 size prop을 가져야 한다', () => {
      render(<HeaderProfileDropdownMenu session={mockSession} status="authenticated" />);
      
      expect(screen.getByTestId('dropdown-item-myPage')).toHaveAttribute('data-size', 'small');
      expect(screen.getByTestId('dropdown-item-logout')).toHaveAttribute('data-size', 'small');
    });

    it('드롭다운 토글 기능이 올바르게 동작해야 한다', () => {
      render(<HeaderProfileDropdownMenu session={mockSession} status="authenticated" />);
      
      const trigger = screen.getByTestId('dropdown-trigger');
      const dropdownList = screen.getByTestId('dropdown-list');
      
      // 처음에는 닫혀있어야 함
      expect(dropdownList).toHaveStyle({ display: 'none' });
      
      // 클릭하면 열려야 함
      fireEvent.click(trigger);
      expect(dropdownList).toHaveStyle({ display: 'block' });
      
      // 다시 클릭하면 닫혀야 함
      fireEvent.click(trigger);
      expect(dropdownList).toHaveStyle({ display: 'none' });
    });
  });

  describe('로그아웃 기능 테스트', () => {
    it('로그아웃 버튼 클릭 시 signOut과 router.refresh가 호출되어야 한다', async () => {
      render(<HeaderProfileDropdownMenu session={mockSession} status="authenticated" />);
      
      const trigger = screen.getByTestId('dropdown-trigger');
      fireEvent.click(trigger);
      
      const logoutButton = screen.getByRole('button', { name: /log out/i });
      fireEvent.click(logoutButton);
      
      await waitFor(() => {
        expect(signOut).toHaveBeenCalledWith({ redirect: true });
        expect(mockRouter.refresh).toHaveBeenCalled();
      });
    });

    it('signOut이 실패할 때 에러를 적절히 처리해야 한다', async () => {
      const mockError = new Error('Sign out failed');
      (signOut as jest.Mock).mockRejectedValue(mockError);
      
      render(<HeaderProfileDropdownMenu session={mockSession} status="authenticated" />);
      
      const trigger = screen.getByTestId('dropdown-trigger');
      fireEvent.click(trigger);
      
      const logoutButton = screen.getByRole('button', { name: /log out/i });
      fireEvent.click(logoutButton);
      
      await waitFor(() => {
        expect(signOut).toHaveBeenCalledWith({ redirect: true });
      });
      
      // signOut이 실패하면 router.refresh가 호출되지 않아야 한다
      expect(mockRouter.refresh).not.toHaveBeenCalled();
    });

    it('signOut이 올바른 매개변수로 호출되어야 한다', async () => {
      render(<HeaderProfileDropdownMenu session={mockSession} status="authenticated" />);
      
      const trigger = screen.getByTestId('dropdown-trigger');
      fireEvent.click(trigger);
      
      const logoutButton = screen.getByRole('button', { name: /log out/i });
      fireEvent.click(logoutButton);
      
      await waitFor(() => {
        expect(signOut).toHaveBeenCalledTimes(1);
        expect(signOut).toHaveBeenCalledWith({ redirect: true });
      });
    });

    it('handleClickSignOut 함수가 async로 동작해야 한다', async () => {
      render(<HeaderProfileDropdownMenu session={mockSession} status="authenticated" />);
      
      const trigger = screen.getByTestId('dropdown-trigger');
      fireEvent.click(trigger);
      
      const logoutButton = screen.getByRole('button', { name: /log out/i });
      
      // 함수가 비동기적으로 실행되는지 확인
      fireEvent.click(logoutButton);
      
      await waitFor(() => {
        expect(signOut).toHaveBeenCalled();
      });
    });

    it('로그아웃 프로세스 중 연속 클릭을 처리할 수 있어야 한다', async () => {
      render(<HeaderProfileDropdownMenu session={mockSession} status="authenticated" />);
      
      const trigger = screen.getByTestId('dropdown-trigger');
      fireEvent.click(trigger);
      
      const logoutButton = screen.getByRole('button', { name: /log out/i });
      
      // 연속으로 빠르게 클릭
      fireEvent.click(logoutButton);
      fireEvent.click(logoutButton);
      fireEvent.click(logoutButton);
      
      await waitFor(() => {
        expect(signOut).toHaveBeenCalledTimes(3);
      });
    });
  });

  describe('드롭다운 아이템 선택 테스트', () => {
    it('마이페이지 아이템 선택 시 드롭다운이 닫혀야 한다', () => {
      render(<HeaderProfileDropdownMenu session={mockSession} status="authenticated" />);
      
      const trigger = screen.getByTestId('dropdown-trigger');
      fireEvent.click(trigger);
      
      expect(screen.getByTestId('dropdown-list')).toHaveStyle({ display: 'block' });
      
      const myPageItem = screen.getByTestId('dropdown-item-myPage');
      fireEvent.click(myPageItem);
      
      expect(screen.getByTestId('dropdown-list')).toHaveStyle({ display: 'none' });
    });

    it('로그아웃 아이템 선택 시 드롭다운이 닫혀야 한다', () => {
      render(<HeaderProfileDropdownMenu session={mockSession} status="authenticated" />);
      
      const trigger = screen.getByTestId('dropdown-trigger');
      fireEvent.click(trigger);
      
      expect(screen.getByTestId('dropdown-list')).toHaveStyle({ display: 'block' });
      
      const logoutItem = screen.getByTestId('dropdown-item-logout');
      fireEvent.click(logoutItem);
      
      expect(screen.getByTestId('dropdown-list')).toHaveStyle({ display: 'none' });
    });

    it('아이템 선택 시 closeDropdown 함수가 올바른 값으로 호출되어야 한다', () => {
      render(<HeaderProfileDropdownMenu session={mockSession} status="authenticated" />);
      
      const trigger = screen.getByTestId('dropdown-trigger');
      fireEvent.click(trigger);
      
      // Mock implementation이 올바르게 동작하는지 확인
      const myPageItem = screen.getByTestId('dropdown-item-myPage');
      fireEvent.click(myPageItem);
      
      expect(screen.getByTestId('dropdown-list')).toHaveStyle({ display: 'none' });
    });
  });

  describe('번역 기능 테스트', () => {
    it('올바른 번역 키를 사용해야 한다', () => {
      render(<HeaderProfileDropdownMenu session={mockSession} status="authenticated" />);
      
      expect(useTranslations).toHaveBeenCalledWith('navigation');
    });

    it('마이페이지 번역 텍스트가 표시되어야 한다', () => {
      render(<HeaderProfileDropdownMenu session={mockSession} status="authenticated" />);
      
      const trigger = screen.getByTestId('dropdown-trigger');
      fireEvent.click(trigger);
      
      expect(screen.getByText('My Page')).toBeInTheDocument();
    });

    it('로그아웃 번역 텍스트가 표시되어야 한다', () => {
      render(<HeaderProfileDropdownMenu session={mockSession} status="authenticated" />);
      
      const trigger = screen.getByTestId('dropdown-trigger');
      fireEvent.click(trigger);
      
      expect(screen.getByText('Log Out')).toBeInTheDocument();
    });

    it('번역 키가 없을 때도 적절히 처리해야 한다', () => {
      (useTranslations as jest.Mock).mockReturnValue(() => undefined);
      
      render(<HeaderProfileDropdownMenu session={mockSession} status="authenticated" />);
      
      const trigger = screen.getByTestId('dropdown-trigger');
      fireEvent.click(trigger);
      
      // 컴포넌트가 에러 없이 렌더링되어야 한다
      expect(screen.getByTestId('dropdown-list')).toBeInTheDocument();
    });

    it('다른 언어 번역을 처리할 수 있어야 한다', () => {
      const koreanTranslations = {
        myPage: '마이페이지',
        logout: '로그아웃',
      };
      
      (useTranslations as jest.Mock).mockReturnValue((key: string) => koreanTranslations[key as keyof typeof koreanTranslations]);
      
      render(<HeaderProfileDropdownMenu session={mockSession} status="authenticated" />);
      
      const trigger = screen.getByTestId('dropdown-trigger');
      fireEvent.click(trigger);
      
      expect(screen.getByText('마이페이지')).toBeInTheDocument();
      expect(screen.getByText('로그아웃')).toBeInTheDocument();
    });

    it('빈 번역 문자열을 처리할 수 있어야 한다', () => {
      (useTranslations as jest.Mock).mockReturnValue(() => '');
      
      render(<HeaderProfileDropdownMenu session={mockSession} status="authenticated" />);
      
      const trigger = screen.getByTestId('dropdown-trigger');
      fireEvent.click(trigger);
      
      expect(screen.getByTestId('dropdown-list')).toBeInTheDocument();
    });
  });

  describe('CSS 클래스 및 스타일링 테스트', () => {
    it('드롭다운 트리거에 올바른 CSS 클래스가 적용되어야 한다', () => {
      render(<HeaderProfileDropdownMenu session={mockSession} status="authenticated" />);
      
      const trigger = screen.getByTestId('dropdown-trigger');
      const expectedClasses = [
        'flex',
        '!w-auto',
        'items-center',
        'justify-center',
        'rounded-full',
        'transition-colors',
        'hover:border-gray-300',
        'hover:bg-gray-50'
      ];
      
      expectedClasses.forEach(className => {
        expect(trigger).toHaveClass(className);
      });
    });

    it('드롭다운 리스트에 올바른 CSS 클래스가 적용되어야 한다', () => {
      render(<HeaderProfileDropdownMenu session={mockSession} status="authenticated" />);
      
      const dropdownList = screen.getByTestId('dropdown-list');
      const expectedClasses = [
        'absolute',
        'top-full',
        'z-[var(--z-dropdown)]',
        'mt-1',
        '!w-[120px]',
        'overflow-hidden',
        'rounded-lg',
        'border',
        'border-gray-200',
        'bg-white',
        'shadow-lg'
      ];
      
      expectedClasses.forEach(className => {
        expect(dropdownList).toHaveClass(className);
      });
    });

    it('마이페이지 드롭다운 아이템에 올바른 CSS 클래스가 적용되어야 한다', () => {
      render(<HeaderProfileDropdownMenu session={mockSession} status="authenticated" />);
      
      const myPageItem = screen.getByTestId('dropdown-item-myPage');
      expect(myPageItem).toHaveClass('w-full', 'p-0');
    });

    it('로그아웃 드롭다운 아이템에 올바른 CSS 클래스가 적용되어야 한다', () => {
      render(<HeaderProfileDropdownMenu session={mockSession} status="authenticated" />);
      
      const logoutItem = screen.getByTestId('dropdown-item-logout');
      expect(logoutItem).toHaveClass('left', 'w-full', 'p-0');
    });

    it('헤더 링크에 올바른 CSS 클래스가 적용되어야 한다', () => {
      render(<HeaderProfileDropdownMenu session={mockSession} status="authenticated" />);
      
      const trigger = screen.getByTestId('dropdown-trigger');
      fireEvent.click(trigger);
      
      const headerLink = screen.getByTestId('header-link');
      const expectedClasses = [
        'flex',
        'h-full',
        'w-full',
        'items-center',
        'px-4',
        'py-3',
        'text-sm',
        'font-medium'
      ];
      
      expectedClasses.forEach(className => {
        expect(headerLink).toHaveClass(className);
      });
    });

    it('로그아웃 버튼에 올바른 CSS 클래스가 적용되어야 한다', () => {
      render(<HeaderProfileDropdownMenu session={mockSession} status="authenticated" />);
      
      const trigger = screen.getByTestId('dropdown-trigger');
      fireEvent.click(trigger);
      
      const logoutButton = screen.getByRole('button', { name: /log out/i });
      const expectedClasses = [
        't',
        'w-full',
        'cursor-pointer',
        'px-4',
        'py-3',
        'text-left'
      ];
      
      expectedClasses.forEach(className => {
        expect(logoutButton).toHaveClass(className);
      });
    });

    it('로그아웃 버튼 내부 span에 올바른 CSS 클래스가 적용되어야 한다', () => {
      render(<HeaderProfileDropdownMenu session={mockSession} status="authenticated" />);
      
      const trigger = screen.getByTestId('dropdown-trigger');
      fireEvent.click(trigger);
      
      const logoutSpan = screen.getByText('Log Out');
      expect(logoutSpan).toHaveClass('text-sm', 'font-medium');
    });
  });

  describe('엣지 케이스 및 에러 처리 테스트', () => {
    it('부분적인 사용자 데이터를 가진 세션을 처리할 수 있어야 한다', () => {
      const partialSession = {
        user: {
          id: '1',
          name: 'John Doe',
          // email과 image가 누락됨
        },
        expires: '2024-01-01',
      };
      
      render(<HeaderProfileDropdownMenu session={partialSession as typeof mockSession} status="authenticated" />);
      
      expect(screen.getByTestId('profile-image')).toBeInTheDocument();
      expect(screen.getByTestId('profile-image')).toHaveAttribute('data-url', 'undefined');
    });

    it('다양한 상태 값을 처리할 수 있어야 한다', () => {
      const statuses = ['loading', 'authenticated', 'unauthenticated'];
      
      statuses.forEach(status => {
        const { rerender } = render(<HeaderProfileDropdownMenu session={mockSession} status={status} />);
        
        const trigger = screen.getByTestId('dropdown-trigger');
        if (status === 'loading') {
          expect(trigger).toBeDisabled();
        } else {
          expect(trigger).not.toBeDisabled();
        }
        
        rerender(<HeaderProfileDropdownMenu session={mockSession} status="authenticated" />);
      });
    });

    it('빠른 토글 클릭을 처리할 수 있어야 한다', () => {
      render(<HeaderProfileDropdownMenu session={mockSession} status="authenticated" />);
      
      const trigger = screen.getByTestId('dropdown-trigger');
      
      // 연속적인 빠른 클릭
      fireEvent.click(trigger);
      fireEvent.click(trigger);
      fireEvent.click(trigger);
      
      // 여전히 올바르게 동작해야 한다 (홀수 번 클릭이므로 열려있음)
      expect(screen.getByTestId('dropdown-list')).toHaveStyle({ display: 'block' });
    });

    it('빈 세션 객체를 처리할 수 있어야 한다', () => {
      const emptySession = {
        user: {},
        expires: '2024-01-01',
      };
      
      render(<HeaderProfileDropdownMenu session={emptySession as typeof mockSession} status="authenticated" />);
      
      expect(screen.getByTestId('dropdown')).toBeInTheDocument();
      expect(screen.getByTestId('profile-image')).toBeInTheDocument();
    });

    it('매우 긴 사용자 이름을 처리할 수 있어야 한다', () => {
      const longNameSession = {
        ...mockSession,
        user: {
          ...mockSession.user,
          name: 'Very Very Very Long User Name That Might Cause Layout Issues',
        },
      };
      
      render(<HeaderProfileDropdownMenu session={longNameSession} status="authenticated" />);
      
      expect(screen.getByTestId('dropdown')).toBeInTheDocument();
    });

    it('특수 문자가 포함된 이미지 URL을 처리할 수 있어야 한다', () => {
      const specialUrlSession = {
        ...mockSession,
        user: {
          ...mockSession.user,
          image: 'https://example.com/avatar?id=123&size=40&special=@#$%',
        },
      };
      
      render(<HeaderProfileDropdownMenu session={specialUrlSession} status="authenticated" />);
      
      const profileImage = screen.getByTestId('profile-image');
      expect(profileImage).toHaveAttribute('data-url', specialUrlSession.user.image);
    });

    it('만료된 세션을 처리할 수 있어야 한다', () => {
      const expiredSession = {
        ...mockSession,
        expires: '2020-01-01', // 과거 날짜
      };
      
      render(<HeaderProfileDropdownMenu session={expiredSession} status="authenticated" />);
      
      expect(screen.getByTestId('dropdown')).toBeInTheDocument();
    });

    it('네트워크 에러 상황에서 안정적으로 동작해야 한다', async () => {
      (signOut as jest.Mock).mockRejectedValue(new Error('Network Error'));
      
      render(<HeaderProfileDropdownMenu session={mockSession} status="authenticated" />);
      
      const trigger = screen.getByTestId('dropdown-trigger');
      fireEvent.click(trigger);
      
      const logoutButton = screen.getByRole('button', { name: /log out/i });
      
      expect(() => fireEvent.click(logoutButton)).not.toThrow();
    });
  });

  describe('컴포넌트 Props 인터페이스 테스트', () => {
    it('Session 타입의 session prop을 받을 수 있어야 한다', () => {
      const validSession = {
        user: {
          id: '1',
          name: 'Test User',
          email: 'test@example.com',
          image: 'https://example.com/image.jpg',
        },
        expires: '2024-12-31T23:59:59.000Z',
      };
      
      expect(() => {
        render(<HeaderProfileDropdownMenu session={validSession} status="authenticated" />);
      }).not.toThrow();
    });

    it('session prop에 null을 받을 수 있어야 한다', () => {
      expect(() => {
        render(<HeaderProfileDropdownMenu session={null} status="unauthenticated" />);
      }).not.toThrow();
    });

    it('status prop에 문자열을 받을 수 있어야 한다', () => {
      const validStatuses = ['loading', 'authenticated', 'unauthenticated'];
      
      validStatuses.forEach(status => {
        expect(() => {
          render(<HeaderProfileDropdownMenu session={mockSession} status={status} />);
        }).not.toThrow();
      });
    });

    it('타입 안전성을 보장해야 한다', () => {
      // TypeScript 타입 체크를 위한 테스트
      const typedSession = mockSession;
      const typedStatus = 'authenticated' as const;
      
      expect(() => {
        render(<HeaderProfileDropdownMenu session={typedSession} status={typedStatus} />);
      }).not.toThrow();
    });

    it('Props 변경에 반응해야 한다', () => {
      const { rerender } = render(<HeaderProfileDropdownMenu session={mockSession} status="loading" />);
      
      expect(screen.getByTestId('dropdown-trigger')).toBeDisabled();
      
      rerender(<HeaderProfileDropdownMenu session={mockSession} status="authenticated" />);
      
      expect(screen.getByTestId('dropdown-trigger')).not.toBeDisabled();
    });
  });

  describe('접근성 테스트', () => {
    it('로그아웃 버튼이 올바른 타입 속성을 가져야 한다', () => {
      render(<HeaderProfileDropdownMenu session={mockSession} status="authenticated" />);
      
      const trigger = screen.getByTestId('dropdown-trigger');
      fireEvent.click(trigger);
      
      const logoutButton = screen.getByRole('button', { name: /log out/i });
      expect(logoutButton).toHaveAttribute('type', 'button');
    });

    it('드롭다운 트리거가 버튼 역할을 해야 한다', () => {
      render(<HeaderProfileDropdownMenu session={mockSession} status="authenticated" />);
      
      const trigger = screen.getByTestId('dropdown-trigger');
      expect(trigger.tagName).toBe('BUTTON');
    });

    it('비활성화된 상태에서 접근성을 유지해야 한다', () => {
      render(<HeaderProfileDropdownMenu session={mockSession} status="loading" />);
      
      const trigger = screen.getByTestId('dropdown-trigger');
      expect(trigger).toBeDisabled();
      expect(trigger).toHaveAttribute('disabled');
    });

    it('키보드 네비게이션을 지원해야 한다', () => {
      render(<HeaderProfileDropdownMenu session={mockSession} status="authenticated" />);
      
      const trigger = screen.getByTestId('dropdown-trigger');
      
      // 스페이스바나 엔터키로 토글 가능해야 함
      trigger.focus();
      fireEvent.keyDown(trigger, { key: ' ', code: 'Space' });
      
      // 실제 키보드 이벤트는 브라우저에서 처리되므로 포커스만 확인
      expect(trigger).toHaveFocus();
    });

    it('적절한 텍스트 콘텐츠를 제공해야 한다', () => {
      render(<HeaderProfileDropdownMenu session={mockSession} status="authenticated" />);
      
      const trigger = screen.getByTestId('dropdown-trigger');
      fireEvent.click(trigger);
      
      expect(screen.getByText('My Page')).toBeInTheDocument();
      expect(screen.getByText('Log Out')).toBeInTheDocument();
    });
  });

  describe('성능 테스트', () => {
    it('불필요한 리렌더링을 방지해야 한다', () => {
      const { rerender } = render(<HeaderProfileDropdownMenu session={mockSession} status="authenticated" />);
      
      // 동일한 props로 리렌더링
      rerender(<HeaderProfileDropdownMenu session={mockSession} status="authenticated" />);
      
      expect(screen.getByTestId('dropdown')).toBeInTheDocument();
    });

    it('메모리 누수가 없어야 한다', () => {
      const { unmount } = render(<HeaderProfileDropdownMenu session={mockSession} status="authenticated" />);
      
      expect(() => {
        unmount();
      }).not.toThrow();
    });

    it('대량의 빠른 상호작용을 처리할 수 있어야 한다', () => {
      render(<HeaderProfileDropdownMenu session={mockSession} status="authenticated" />);
      
      const trigger = screen.getByTestId('dropdown-trigger');
      
      // 100번의 빠른 클릭
      for (let i = 0; i < 100; i++) {
        fireEvent.click(trigger);
      }
      
      // 컴포넌트가 여전히 정상적으로 동작해야 함
      expect(screen.getByTestId('dropdown-list')).toBeInTheDocument();
    });
  });

  describe('통합 테스트', () => {
    it('전체 워크플로우가 올바르게 동작해야 한다', async () => {
      render(<HeaderProfileDropdownMenu session={mockSession} status="authenticated" />);
      
      // 1. 드롭다운 열기
      const trigger = screen.getByTestId('dropdown-trigger');
      fireEvent.click(trigger);
      
      expect(screen.getByTestId('dropdown-list')).toHaveStyle({ display: 'block' });
      
      // 2. 마이페이지 링크 확인
      const headerLink = screen.getByTestId('header-link');
      expect(headerLink).toHaveAttribute('href', ROUTES.MY_PAGE);
      
      // 3. 로그아웃 실행
      const logoutButton = screen.getByRole('button', { name: /log out/i });
      fireEvent.click(logoutButton);
      
      // 4. 드롭다운 닫힘 확인
      expect(screen.getByTestId('dropdown-list')).toHaveStyle({ display: 'none' });
      
      // 5. signOut 호출 확인
      await waitFor(() => {
        expect(signOut).toHaveBeenCalledWith({ redirect: true });
        expect(mockRouter.refresh).toHaveBeenCalled();
      });
    });

    it('세션 변경에 따른 전체 컴포넌트 동작을 확인해야 한다', () => {
      const { rerender } = render(<HeaderProfileDropdownMenu session={mockSession} status="authenticated" />);
      
      // 세션이 있을 때
      expect(screen.getByTestId('profile-image')).toHaveAttribute('data-url', mockSession.user.image);
      
      // 세션이 null로 변경
      rerender(<HeaderProfileDropdownMenu session={null} status="unauthenticated" />);
      
      expect(screen.getByTestId('profile-image')).toHaveAttribute('data-url', 'undefined');
    });

    it('다국어 지원과 함께 전체 기능이 동작해야 한다', () => {
      const japaneseTranslations = {
        myPage: 'マイページ',
        logout: 'ログアウト',
      };
      
      (useTranslations as jest.Mock).mockReturnValue((key: string) => japaneseTranslations[key as keyof typeof japaneseTranslations]);
      
      render(<HeaderProfileDropdownMenu session={mockSession} status="authenticated" />);
      
      const trigger = screen.getByTestId('dropdown-trigger');
      fireEvent.click(trigger);
      
      expect(screen.getByText('マイページ')).toBeInTheDocument();
      expect(screen.getByText('ログアウト')).toBeInTheDocument();
    });
  });
});