import { InputHTMLAttributes, forwardRef, useState } from 'react';
import { cn } from '@/shared/lib/cn';
import { type VariantProps, cva } from 'class-variance-authority';
import { VisibilityOffIcon, VisibilityOnIcon } from '../icon';

export interface InputProps
  extends InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  errorMessage?: string;
  className?: string;
  inputClassName?: string;
}

export const INPUT_VARIANT = {
  default: 'text-gray-800',
  toggle: 'border border-gray-50 text-gray-800', // dropdown 완성 후 추가 개발
  hover: 'border-2 border-orange-300 text-gray-800',
  typing: 'border-2 border-orange-600 text-gray-800',
  done: 'border-2 border-gray-50 text-gray-800',
  error: 'border-2 border-red-600 text-gray-800',
};

export const inputVariants = cva(
  'flex w-full rounded-xl px-4 py-2.5 outline-none transition bg-gray-50 text-sm leading-5 tablet:text-base tablet:leading-6',
  {
    variants: {
      variant: INPUT_VARIANT,
      inputSize: {
        lg: 'text-base leading-6',
        sm: 'text-sm leading-5',
      },
      isError: {
        true: 'border-2 border-red-600 text-gray-800',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      inputSize: 'lg',
      isError: false,
    },
  },
);

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      variant = 'default',
      inputSize,
      isError,
      errorMessage,
      type,
      className,
      inputClassName,
      ...props
    },
    ref,
  ) => {
    const isPasswordField = type === 'password';
    const [showPassword, setShowPassword] = useState(false);

    const togglePasswordVisibility = () => setShowPassword((prev) => !prev);

    return (
      <>
        <div className={cn(inputVariants({ variant, inputSize, isError }), className)}>
          <input
            ref={ref}
            className={cn('flex-1 outline-none', inputClassName)}
            type={isPasswordField && !showPassword ? 'password' : 'text'}
            {...props}
          />
          {isPasswordField && (
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="shrink-0 cursor-pointer text-gray-500 hover:text-gray-700 focus:outline-none"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <VisibilityOnIcon /> : <VisibilityOffIcon />}
            </button>
          )}
        </div>
        {errorMessage && <p className="pt-[8px] text-xs text-red-500">{errorMessage}</p>}
      </>
    );
  },
);

Input.displayName = 'Input';
