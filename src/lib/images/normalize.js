export function normalizeMediaUrl(url) {
  if (!url || typeof url !== 'string') return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/api/images/')) return url;
  if (url.startsWith('/uploads/')) return `/api/images/${url.replace(/^\//, '')}`;
  return url;
}

export function normalizeImageUrl(url) {
  return normalizeMediaUrl(url);
}

export function normalizePropertyImages(property) {
  if (!property) return property;

  return {
    ...property,
    images: property.images?.map((image) => ({
      ...image,
      url: normalizeMediaUrl(image.url),
    })),
    videos: property.videos?.map((video) => ({
      ...video,
      url: normalizeMediaUrl(video.url),
    })),
  };
}