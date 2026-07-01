// Client-side Image Enhancement Pipeline (Denoise, Super-resolution, Sharpen, Auto-Contrast)

/**
 * Enhances the image by:
 * 1. Upscaling it 1.5x (super-resolution canvas scaling)
 * 2. Applying an auto-contrast stretching filter (enhances washed-out webcam lighting)
 * 3. Denoising using a Bilateral-style smoothing filter (removes sensor grain/noise)
 * 4. Applying a custom Unsharp-Masking Convolution filter (restores crisp edges)
 */
export async function enhanceImage(imageDataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageDataUrl;

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Failed to get 2d canvas context for image enhancement');
        }

        // 1. Super-resolution Scale (1.5x scaling)
        const scale = 1.5;
        const width = Math.round(img.naturalWidth * scale);
        const height = Math.round(img.naturalHeight * scale);
        canvas.width = width;
        canvas.height = height;

        // Draw upscaled image (uses browser bicubic/bilinear smoothing as a base)
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const imgData = ctx.getImageData(0, 0, width, height);
        const srcData = new Uint8ClampedArray(imgData.data);
        const destData = imgData.data;

        // 2. Auto-Contrast Stretching & Brightness Boost
        // Calculate min and max luminance
        let minLum = 255;
        let maxLum = 0;
        const len = srcData.length;

        for (let i = 0; i < len; i += 4) {
          const r = srcData[i];
          const g = srcData[i + 1];
          const b = srcData[i + 2];
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          if (lum < minLum) minLum = lum;
          if (lum > maxLum) maxLum = lum;
        }

        const lumRange = maxLum - minLum;
        const stretchContrast = lumRange > 20 && lumRange < 240;

        // Apply filters
        for (let i = 0; i < len; i += 4) {
          let r = srcData[i];
          let g = srcData[i + 1];
          let b = srcData[i + 2];

          // Auto-Contrast stretch if contrast is too flat
          if (stretchContrast) {
            r = ((r - minLum) / lumRange) * 255;
            g = ((g - minLum) / lumRange) * 255;
            b = ((b - minLum) / lumRange) * 255;
          }

          // Subtle brightness boost (webcams are often dark)
          r = r * 1.05 + 5;
          g = g * 1.05 + 5;
          b = b * 1.05 + 5;

          // Saturation boost (+15%)
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          r = lum + (r - lum) * 1.15;
          g = lum + (g - lum) * 1.15;
          b = lum + (b - lum) * 1.15;

          srcData[i] = Math.min(255, Math.max(0, r));
          srcData[i + 1] = Math.min(255, Math.max(0, g));
          srcData[i + 2] = Math.min(255, Math.max(0, b));
        }

        // 3. Bilateral Denoising Filter (Edge-Preserving Blur)
        // To be performant, we use a simplified 5x5 bilateral filter on the pixels
        const spatialSigma = 2.0;
        const rangeSigma = 25.0;
        const spatialFactor = -0.5 / (spatialSigma * spatialSigma);
        const rangeFactor = -0.5 / (rangeSigma * rangeSigma);

        // Precompute spatial weights
        const spatialWeights: number[][] = [];
        for (let dy = -2; dy <= 2; dy++) {
          spatialWeights[dy + 2] = [];
          for (let dx = -2; dx <= 2; dx++) {
            spatialWeights[dy + 2][dx + 2] = Math.exp((dx * dx + dy * dy) * spatialFactor);
          }
        }

        const getPixel = (x: number, y: number, c: number) => {
          const px = Math.min(width - 1, Math.max(0, x));
          const py = Math.min(height - 1, Math.max(0, y));
          return srcData[(py * width + px) * 4 + c];
        };

        const denoisedBuffer = new Uint8ClampedArray(len);

        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;

            const rCenter = srcData[idx];
            const gCenter = srcData[idx + 1];
            const bCenter = srcData[idx + 2];

            let sumR = 0, sumG = 0, sumB = 0;
            let normR = 0, normG = 0, normB = 0;

            // Loop 5x5 window
            for (let dy = -2; dy <= 2; dy++) {
              for (let dx = -2; dx <= 2; dx++) {
                const sWeight = spatialWeights[dy + 2][dx + 2];
                const nx = x + dx;
                const ny = y + dy;

                const nr = getPixel(nx, ny, 0);
                const ng = getPixel(nx, ny, 1);
                const nb = getPixel(nx, ny, 2);

                // Range weights (color similarity)
                const rWeightR = Math.exp(((nr - rCenter) * (nr - rCenter)) * rangeFactor);
                const rWeightG = Math.exp(((ng - gCenter) * (ng - gCenter)) * rangeFactor);
                const rWeightB = Math.exp(((nb - bCenter) * (nb - bCenter)) * rangeFactor);

                const wR = sWeight * rWeightR;
                const wG = sWeight * rWeightG;
                const wB = sWeight * rWeightB;

                sumR += nr * wR;
                normR += wR;

                sumG += ng * wG;
                normG += wG;

                sumB += nb * wB;
                normB += wB;
              }
            }

            denoisedBuffer[idx] = sumR / normR;
            denoisedBuffer[idx + 1] = sumG / normG;
            denoisedBuffer[idx + 2] = sumB / normB;
            denoisedBuffer[idx + 3] = srcData[idx + 3]; // Alpha
          }
        }

        // 4. Unsharp Masking (Sharpen Convolution Filter)
        // Kernel:
        // [  0, -0.5,  0 ]
        // [ -0.5, 3, -0.5 ]
        // [  0, -0.5,  0 ]
        const sharpenKernel = [
          [0, -0.5, 0],
          [-0.5, 3, -0.5],
          [0, -0.5, 0]
        ];

        const getDenoisedPixel = (x: number, y: number, c: number) => {
          const px = Math.min(width - 1, Math.max(0, x));
          const py = Math.min(height - 1, Math.max(0, y));
          return denoisedBuffer[(py * width + px) * 4 + c];
        };

        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;

            let finalR = 0;
            let finalG = 0;
            let finalB = 0;

            for (let ky = -1; ky <= 1; ky++) {
              for (let kx = -1; kx <= 1; kx++) {
                const weight = sharpenKernel[ky + 1][kx + 1];
                finalR += getDenoisedPixel(x + kx, y + ky, 0) * weight;
                finalG += getDenoisedPixel(x + kx, y + ky, 1) * weight;
                finalB += getDenoisedPixel(x + kx, y + ky, 2) * weight;
              }
            }

            // Write back to main canvas buffer
            destData[idx] = Math.min(255, Math.max(0, finalR));
            destData[idx + 1] = Math.min(255, Math.max(0, finalG));
            destData[idx + 2] = Math.min(255, Math.max(0, finalB));
            destData[idx + 3] = denoisedBuffer[idx + 3];
          }
        }

        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.95));
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = (err) => {
      reject(err);
    };
  });
}
