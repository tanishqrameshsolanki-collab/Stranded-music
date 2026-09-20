import React from 'react';
import { artworkUrl } from '../../services/api';

interface ArtworkProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string | undefined;
  // Rendered CSS size in px; the CDN variant requested is 2x this for retina.
  size: number;
  eager?: boolean;
}

// Every album cover in the app goes through here so list thumbnails fetch small
// variants instead of the 600px master, decode off the main thread, and reserve space.
const Artwork: React.FC<ArtworkProps> = ({ src, size, eager = false, alt = '', className, ...rest }) => {
  const variant = Math.min(600, Math.ceil((size * 2) / 100) * 100);
  return (
    <img
      src={artworkUrl(src, variant)}
      alt={alt}
      width={size}
      height={size}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      draggable={false}
      className={className}
      {...rest}
    />
  );
};

export default Artwork;
