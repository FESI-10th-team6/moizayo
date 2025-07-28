import { Button } from '@/shared/ui/button';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('Button 컴포넌트에 관한 테스트 ', () => {
  it('버튼이 렌더링 되는가 ', () => {
    render(<Button variant="primary">확인</Button>);
    expect(screen.getByText('확인')).toBeInTheDocument();
  });

  it('variant primary가 정상 작동 하는가? ', () => {
    render(<Button variant="primary">확인</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-primary');
    expect(button).toHaveClass('text-white');
  });
  it('outline variant가 올바르게 적용되어야 한다', () => {
    render(<Button variant="outline">확인</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('border-[var(--color-primary)]');
    expect(button).toHaveClass('text-[var(--color-primary)]');
  });
  it('default variant가 올바르게 적용되어야 한다', () => {
    render(<Button variant="default">확인</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-gray-500');
    expect(button).toHaveClass('text-white');
  });
  it('disabled 적용 되었을때 버튼이 비활성화 되어야한다. ', () => {
    render(
      <Button
        variant="default"
        disabled
      >
        확인
      </Button>,
    );
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('className 으로 추가속성이 적용되어야 한다. ', () => {
    render(
      <Button
        variant="primary"
        className="w-[400px] bg-blue-600"
      >
        확인
      </Button>,
    );
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-blue-600');
    expect(button).toHaveClass('w-[400px]');
  });

  it('기본 타입이 제대로 전달되는가? ', () => {
    render(
      <Button
        variant="outline"
        type="submit"
      >
        확인
      </Button>,
    );
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'submit');
  });

  it('유저 클릭 이벤트 테스트 ', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();
    render(
      <Button
        variant="primary"
        onClick={handleClick}
      >
        확인
      </Button>,
    );
    const button = screen.getByRole('button');

    await user.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
