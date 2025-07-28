'use client';

import { useTranslations } from 'next-intl';
import { InputWithLabel } from '@/shared/ui/InputWithLabel';
import { Button } from '@/shared/ui/button';
import { HeaderLink } from '@/widgets/Header/ui/HeaderLink';
import { FieldValues, Path } from 'react-hook-form';
import { AuthFormProps } from '../model/types';

export const AuthForm = <T extends FieldValues>({
  meta,
  fields,
  handlers,
  isValid,
}: AuthFormProps<T>) => {
  const t = useTranslations();
  const { register, errors } = handlers;

  return (
    <div className="web:w-[510px] rounded-common tablet:px-16 web:px-14 tablet:py-8 tablet:w-[608px] my-8 flex w-full flex-col items-center gap-8 border border-gray-200 px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900">{t(meta.title)}</h1>

      <div className="flex w-full flex-col gap-6">
        {fields.map(({ name, label, placeholder, type = 'text', withVariant }) => (
          <InputWithLabel
            key={name as string}
            label={t(label)}
            placeholder={t(placeholder)}
            type={type}
            variant={withVariant ?? 'default'}
            isError={!!errors[name]?.message}
            errorMessage={errors[name]?.message ? t(errors[name]?.message as string) : undefined}
            autoComplete={
              name === 'password' || name === 'confirmPassword' ? 'new-password' : 'off'
            }
            {...register(name as Path<T>)}
          />
        ))}
      </div>
      <Button
        type="submit"
        className="mt-3 w-full rounded-xl py-2.5 text-white transition"
        variant={isValid ? 'primary' : 'default'}
      >
        {t(meta.buttonLabel)}
      </Button>

      <p className="pt-3 text-sm text-gray-500">
        {t(meta.footerText)}
        <HeaderLink
          href={meta.footerHref}
          className="text-orange-500 hover:underline"
        >
          {t(meta.footerLinkText)}
        </HeaderLink>
      </p>
    </div>
  );
};
