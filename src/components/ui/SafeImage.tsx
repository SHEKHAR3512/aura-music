import React, { useState, useEffect } from 'react';
import { Music, Disc, User, Radio } from 'lucide-react';

export interface SafeImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null;
  alt: string;
  type?: 'track' | 'artist' | 'album' | 'playlist' | 'podcast' | 'user';
  fallbackIcon?: 'music' | 'disc' | 'user' | 'radio';
  containerClassName?: string;
  roundedClassName?: string;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  type = 'track',
  fallbackIcon,
  className = '',
  containerClassName = '',
  roundedClassName = '',
  referrerPolicy = 'no-referrer',
  ...rest
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Reset error & load state when src changes
  useEffect(() => {
    setHasError(false);
    setIsLoaded(false);
  }, [src]);

  // Determine icon to show on fallback
  const renderFallbackIcon = () => {
    const iconType = fallbackIcon || (
      type === 'artist' || type === 'user'
        ? 'user'
        : type === 'podcast'
        ? 'radio'
        : type === 'playlist' || type === 'album'
        ? 'disc'
        : 'music'
    );

    const isCircle = className.includes('rounded-full') || roundedClassName.includes('rounded-full');

    const iconProps = {
      className: isCircle
        ? 'w-1/2 h-1/2 text-white/50 stroke-[1.5]'
        : 'w-2/5 h-2/5 text-white/50 stroke-[1.5]'
    };

    switch (iconType) {
      case 'user':
        return <User {...iconProps} />;
      case 'radio':
        return <Radio {...iconProps} />;
      case 'disc':
        return <Disc {...iconProps} />;
      case 'music':
      default:
        return <Music {...iconProps} />;
    }
  };

  const isRoundedFull = className.includes('rounded-full') || roundedClassName.includes('rounded-full');

  // If there's no src or image failed to load, show the cinematic gradient placeholder
  if (!src || hasError) {
    return (
      <div
        role="img"
        aria-label={alt || 'Image'}
        className={`flex items-center justify-center select-none bg-gradient-to-br from-slate-800 via-indigo-950/70 to-slate-900 border border-white/10 ${
          isRoundedFull ? 'rounded-full' : roundedClassName || ''
        } ${className}`}
        style={rest.style}
      >
        {renderFallbackIcon()}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy={referrerPolicy}
      onError={() => setHasError(true)}
      onLoad={() => setIsLoaded(true)}
      className={`${className} ${!isLoaded ? 'opacity-90' : 'opacity-100'} transition-opacity duration-300`}
      {...rest}
    />
  );
};
