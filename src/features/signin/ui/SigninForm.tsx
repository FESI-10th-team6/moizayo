'use client';

import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/shared/config/routes';
import { AuthForm } from '@/widgets/AuthForm/ui/AuthForm';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { signFields } from '../model/signFields';
import { signinSchema } from '../model/signinSchema';
import { SigninFormData } from '../model/type';

export const SigninForm = () => {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setError,
  } = useForm<SigninFormData>({
    resolver: zodResolver(signinSchema),
    mode: 'onChange',
  });

  const onSubmit = async (formData: SigninFormData) => {
    const result = await signIn('credentials', {
      ...formData,
      redirect: false,
    });

    if (result?.error) {
      // 에러 처리
      setError('email', { type: 'manual', message: result.error });
      return;
    }

    console.log('LOGIN', { result });

    console.log('[REFERRER]', document.referrer);
    router.push(document.referrer || ROUTES.ROOT);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="web:justify-end flex w-full justify-center"
    >
      <AuthForm
        meta={{
          title: 'pages.signin.title',
          buttonLabel: 'pages.signin.loginButton',
          footerText: 'pages.signin.footerText',
          footerLinkText: 'pages.signin.signupLink',
          footerHref: ROUTES.SIGNUP,
        }}
        fields={signFields}
        handlers={{
          register,
          errors,
        }}
        isValid={isValid}
      />
    </form>
  );
};
