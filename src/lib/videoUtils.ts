export async function generateVideoThumbnails(videoFileOrUrl: File | string, numThumbnails: number = 3): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    let url = '';
    if (typeof videoFileOrUrl === 'string') {
      url = videoFileOrUrl;
    } else if (videoFileOrUrl instanceof File) {
      url = URL.createObjectURL(videoFileOrUrl);
    } else {
      return resolve([]);
    }
    
    video.src = url;
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';
    
    const thumbnails: string[] = [];
    let currentFrame = 0;

    video.onloadeddata = () => {
      // Set canvas size to video dimensions, scaled down to prevent memory issues
      const MAX_SIZE = 1280;
      let targetW = video.videoWidth;
      let targetH = video.videoHeight;
      if (Math.max(targetW, targetH) > MAX_SIZE) {
        const ratio = MAX_SIZE / Math.max(targetW, targetH);
        targetW = Math.round(targetW * ratio);
        targetH = Math.round(targetH * ratio);
      }
      canvas.width = targetW || 640;
      canvas.height = targetH || 360;
      
      const duration = video.duration;
      // If duration is NaN (can happen with some HEVC or broken files), just resolve empty
      if (isNaN(duration) || duration === 0) {
        if (videoFileOrUrl instanceof File) URL.revokeObjectURL(url);
        return resolve([]);
      }
      
      const intervals: number[] = [];
      for (let i = 1; i <= numThumbnails; i++) {
        intervals.push((duration / (numThumbnails + 1)) * i);
      }
      
      const captureFrame = () => {
        if (!context) {
          if (videoFileOrUrl instanceof File) URL.revokeObjectURL(url);
          return resolve(thumbnails);
        }
        
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas to data URL (JPEG, 70% quality to save space)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        thumbnails.push(dataUrl);
        
        currentFrame++;
        if (currentFrame < intervals.length) {
          video.currentTime = intervals[currentFrame];
        } else {
          if (videoFileOrUrl instanceof File) URL.revokeObjectURL(url);
          resolve(thumbnails);
        }
      };
      
      video.onseeked = captureFrame;
      
      // Start the extraction process
      video.currentTime = intervals[0];
    };
    
    video.onerror = (e) => {
      if (videoFileOrUrl instanceof File) URL.revokeObjectURL(url);
      console.warn("Could not extract thumbnails from video", e);
      resolve([]); // Resolve empty array on error (fallback gracefully)
    };
  });
}

// Convert data URI to Blob
export function dataURItoBlob(dataURI: string): Blob {
  if (!dataURI || !dataURI.includes(',')) {
    throw new Error('Invalid data URI');
  }
  const byteString = atob(dataURI.split(',')[1]);
  const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
}

// Draw text banner on thumbnail (subtitles/captions) with style customization
export interface SubtitleOptions {
  textSize?: 'medium' | 'large' | 'xlarge';
  textColor?: string;
  bgColor?: string;
}

export async function drawTextOnImage(
  dataUriOrUrl: string,
  text: string,
  options?: SubtitleOptions
): Promise<string> {
  const {
    textSize = 'large',
    textColor = '#FFFFFF',
    bgColor = 'rgba(15, 23, 42, 0.85)'
  } = options || {};

  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(dataUriOrUrl);
      
      // Downscale if too large (prevent mobile out of memory)
      const MAX_SIZE = 1280;
      let targetW = img.naturalWidth || img.width;
      let targetH = img.naturalHeight || img.height;
      
      if (!targetW || !targetH) {
        console.warn("Image has 0 width or height, falling back");
        return resolve(dataUriOrUrl);
      }

      if (Math.max(targetW, targetH) > MAX_SIZE) {
        const ratio = MAX_SIZE / Math.max(targetW, targetH);
        targetW = Math.round(targetW * ratio);
        targetH = Math.round(targetH * ratio);
      }
      canvas.width = targetW || 640;
      canvas.height = targetH || 360;
      
      // Calculate 16:9 safe area for vertical/tall images
      // so the subtitle isn't cropped out when displayed in VideoCard (aspect-video + object-cover)
      let safeW = canvas.width;
      let safeH = canvas.height;
      let cropBottom = canvas.height;
      const targetRatio = 16 / 9;
      const imgRatio = canvas.width / canvas.height;
      
      if (imgRatio < targetRatio) {
        // Image is taller than 16:9 (Vertical)
        safeH = canvas.width / targetRatio;
        cropBottom = (canvas.height + safeH) / 2; // Bottom of the centered 16:9 crop area
      }
      
      // Draw original image (scaled)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Clean and trim the text
      const cleanText = text.trim();
      if (!cleanText) return resolve(dataUriOrUrl);
      
      // Font scale factors based on selected size
      let fontScale = 0.12; // 'large' by default (12% of height)
      if (textSize === 'medium') fontScale = 0.08;
      else if (textSize === 'xlarge') fontScale = 0.16;

      // Font settings based on safe height (responsive/proportional to the visible area)
      const fontSize = Math.max(18, Math.round(safeH * fontScale));
      ctx.font = `bold ${fontSize}px "Segoe UI", Roboto, "Noto Sans KR", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Calculate text width and background dimensions
      const textWidth = ctx.measureText(cleanText).width;
      const paddingX = fontSize * 0.65;
      const paddingY = fontSize * 0.35;
      const bgWidth = textWidth + (paddingX * 2);
      const bgHeight = fontSize + (paddingY * 2);
      
      // Subtitle position (bottom center of the safe area, vertically aligned nicely)
      const posX = canvas.width / 2;
      const posY = cropBottom - (bgHeight / 2) - Math.max(16, Math.round(safeH * 0.08)); // 8% margin from bottom of safe area
      
      const drawTextWithShadow = () => {
        // Text shadow/stroke fallback for high readability
        ctx.strokeStyle = textColor === '#000000' || textColor === '#000' ? '#FFFFFF' : '#000000';
        ctx.lineWidth = Math.max(3, Math.round(fontSize * 0.18));
        ctx.lineJoin = 'round';
        ctx.miterLimit = 2;
        ctx.strokeText(cleanText, posX, posY + Math.round(fontSize * 0.04));
        
        ctx.fillStyle = textColor;
        ctx.fillText(cleanText, posX, posY + Math.round(fontSize * 0.04));
      };

      if (bgColor && bgColor !== 'none') {
        // Draw rounded semi-transparent background box
        ctx.fillStyle = bgColor;
        const radius = Math.round(bgHeight * 0.25); // Rounded corner radius
        
        const x = posX - (bgWidth / 2);
        const y = posY - (bgHeight / 2);
        
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + bgWidth - radius, y);
        ctx.quadraticCurveTo(x + bgWidth, y, x + bgWidth, y + radius);
        ctx.lineTo(x + bgWidth, y + bgHeight - radius);
        ctx.quadraticCurveTo(x + bgWidth, y + bgHeight, x + bgWidth - radius, y + bgHeight);
        ctx.lineTo(x + radius, y + bgHeight);
        ctx.quadraticCurveTo(x, y + bgHeight, x, y + bgHeight - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();
        
        // Draw pure text without stroke inside background box
        ctx.fillStyle = textColor;
        ctx.fillText(cleanText, posX, posY + Math.round(fontSize * 0.04));
      } else {
        // No background mode: draw strong outlined text
        drawTextWithShadow();
      }
      
      // Output as high-quality JPEG data URL
      resolve(canvas.toDataURL('image/jpeg', 0.88));
    };
    
    img.onerror = (e) => {
      console.warn("Could not draw text on thumbnail image", e);
      resolve(dataUriOrUrl); // Return fallback original on error
    };

    // Use an async IIFE to load the image src
    (async () => {
      try {
        let src = dataUriOrUrl;
        let isBlobObjUrl = false;
        
        // Proxy HTTP URLs by fetching as a blob first to COMPLETELY bypass Canvas CORS tainting
        if (dataUriOrUrl.startsWith('http')) {
          const res = await fetch(`/api/proxy-image?url=${encodeURIComponent(dataUriOrUrl)}`);
          if (!res.ok) throw new Error('Proxy fetch failed');
          const blob = await res.blob();
          src = URL.createObjectURL(blob);
          isBlobObjUrl = true;
        }

        // We can revoke the object URL after the image is loaded
        const cleanup = () => {
          if (isBlobObjUrl) URL.revokeObjectURL(src);
        };

        const originalOnload = img.onload;
        img.onload = (e) => {
          if (typeof originalOnload === 'function') originalOnload.call(img, e);
          cleanup();
        };

        const originalOnerror = img.onerror;
        img.onerror = (e) => {
          if (typeof originalOnerror === 'function') originalOnerror.call(img, e);
          cleanup();
        };

        img.src = src;
      } catch (err) {
        console.warn("Failed to load image securely, falling back to original URL", err);
        // Fallback
        if (dataUriOrUrl.startsWith('http')) {
          img.crossOrigin = 'anonymous';
          img.src = `/api/proxy-image?url=${encodeURIComponent(dataUriOrUrl)}`;
        } else {
          img.src = dataUriOrUrl;
        }
      }
    })();
  });
}
