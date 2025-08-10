import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import type { CreateGatheringPayload } from '@/entities/gathering/model/schema';
import { cn } from '@/shared/lib';
import { CalendarIcon } from '@/shared/ui/icon';
import { TimePicker } from '@/shared/ui/time-picker';
import { Control, Controller, FieldError, UseFormSetValue, UseFormWatch } from 'react-hook-form';

const Calendar = dynamic(
  () => import('@/shared/ui/calendar').then((mod) => ({ default: mod.Calendar })),
  {
    ssr: false,
  },
);

interface GatheringRegistrationEndFieldProps {
  control: Control<CreateGatheringPayload>;
  error?: FieldError;
  showDatePicker: boolean;
  setShowDatePicker: (v: boolean) => void;
  currentDateField: 'dateTime' | 'registrationEnd' | null;
  setCurrentDateField: (v: 'dateTime' | 'registrationEnd' | null) => void;
  setValue: UseFormSetValue<CreateGatheringPayload>;
  watch: UseFormWatch<CreateGatheringPayload>;
  formatDateTime: (date: Date | undefined) => string;
  formatDateTimeMobile: (date: Date | undefined) => string;
}

export const GatheringRegistrationEndField = ({
  control,
  error,
  showDatePicker,
  setShowDatePicker,
  currentDateField,
  setCurrentDateField,
  setValue,
  watch,
  formatDateTime,
  formatDateTimeMobile,
}: GatheringRegistrationEndFieldProps) => {
  const t = useTranslations('pages.gatherings.create');
  return (
    <div className="min-w-0 flex-1">
      <label className="mb-2 block text-sm font-medium">{t('form.registrationEnd')}</label>
      <Controller
        control={control}
        name="registrationEnd"
        render={({ field }) => (
          <div className="relative">
            <div
              className={cn(
                'flex w-full cursor-pointer items-center rounded-xl bg-gray-50 px-4 py-2.5',
                'border-0',
                error && 'border-red-500',
              )}
              onClick={() => {
                setCurrentDateField('registrationEnd');
                if (!watch('registrationEnd')) {
                  const now = new Date();
                  now.setHours(14, 0, 0, 0);
                  setValue('registrationEnd', now);
                }
                setShowDatePicker(!showDatePicker);
              }}
            >
              <span
                className={cn(
                  'block min-w-0 flex-1 truncate',
                  field.value ? 'text-gray-800' : 'text-gray-400',
                )}
              >
                {field.value ? (
                  <>
                    <span className="tablet:inline hidden">{formatDateTime(field.value)}</span>
                    <span className="tablet:hidden">{formatDateTimeMobile(field.value)}</span>
                  </>
                ) : (
                  t('form.registrationEndPlaceholder')
                )}
              </span>
              <CalendarIcon
                size={16}
                className="ml-auto flex-shrink-0 text-gray-400"
              />
            </div>
            {showDatePicker && currentDateField === 'registrationEnd' && (
              <div className="fixed top-1/2 left-1/2 z-[9999] -translate-x-1/2 -translate-y-1/2">
                <Calendar
                  value={field.value}
                  onChange={(date) => {
                    if (date) {
                      // 날짜 선택 시 자동으로 14:00로 설정
                      const newDate = new Date(date);
                      newDate.setHours(14, 0, 0, 0); // 14:00로 고정
                      field.onChange(newDate);
                    }
                  }}
                  footer={
                    <TimePicker
                      value={field.value}
                      onChange={(timeDate) => {
                        if (field.value) {
                          const newDate = new Date(field.value);
                          newDate.setHours(timeDate.getHours(), timeDate.getMinutes(), 0, 0);
                          field.onChange(newDate);
                        }
                      }}
                      onReset={() => {
                        // 날짜와 시간 모두 초기화
                        field.onChange(undefined);
                      }}
                      onConfirm={() => {
                        setShowDatePicker(false);
                      }}
                    />
                  }
                />
              </div>
            )}
            {error && <p className="mt-1 text-xs text-red-500">{t(error.message ?? '')}</p>}
          </div>
        )}
      />
    </div>
  );
};
