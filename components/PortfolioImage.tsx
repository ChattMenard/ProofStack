"use client";
import { CldImage } from 'next-cloudinary';

interface PortfolioImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
}

export default function PortfolioImage({ src, alt, width = 400, height = 300, className = "" }: PortfolioImageProps) {
  // Extract the public ID from Cloudinary URL
  // Cloudinary URLs typically look like: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.{format}
  const extractPublicId = (url: string): string => {
    try {
      const urlParts = url.split('/');
      const uploadIndex = urlParts.findIndex(part => part === 'upload');
      if (uploadIndex !== -1 && uploadIndex < urlParts.length - 1) {
        // Get everything after 'upload/' and remove file extension
        const afterUpload = urlParts.slice(uploadIndex + 1).join('/');
        return afterUpload.split('.')[0]; // Remove file extension
      }
      return url; // Fallback to full URL if parsing fails
    } catch {
      return url; // Fallback to full URL if parsing fails
    }
  };

  const publicId = extractPublicId(src);

  return (
    <CldImage
      src={publicId}
      alt={alt}
      width={width}
      height={height}
      crop={{
        type: 'auto',
        source: true
      }}
      className={`rounded-lg shadow-sm ${className}`}
      // Enable automatic format and quality optimization
      quality="auto"
      format="auto"
      // Add loading and placeholder
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R+IRjWjBqO6O2mhP//Z"
    />
  );
}