import Image from 'next/image';
import { cn } from '@/shared/lib';
import { ProfileIcon } from '../icon';

interface ProfileImageProps {
  size?: number; // 정사각형 한 변의 길이 (px)
  url?: string; // 프로필 이미지 URL
  className?: string; // 추가 커스텀 클래스
  alt?: string; // img alt
}

export const ProfileImage = ({ size = 40, url, className }: ProfileImageProps) => {
  return (
    <div
      className={cn(`relative overflow-hidden rounded-full border-3 border-white`, className)}
      style={{ width: size + 6, height: size + 6 }}
    >
      {url ? (
        <Image
          src={url}
          alt={'alt'}
          fill
          sizes={`${size}px`}
          className="object-cover"
        />
      ) : (
        <ProfileIcon size={size} />
      )}
    </div>
  );
};
