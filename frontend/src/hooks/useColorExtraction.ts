/**
 * 颜色提取自定义Hook
 * 功能: 封装图片颜色提取的核心逻辑，支持多种算法和参数配置
 */

import { useState, useCallback, useRef } from 'react';
import { Color, ExtractedColor, ExtractionOptions } from '../types/colorAnalysis';

interface UseColorExtractionOptions {
  onSuccess?: (colors: ExtractedColor[]) => void;
  onError?: (error: Error) => void;
  autoExtract?: boolean;
}

interface UseColorExtractionReturn {
  // 状态
  extracting: boolean;
  extractedColors: ExtractedColor[];
  error: string | null;
  
  // 方法
  extractColors: (imageElement: HTMLImageElement, options: ExtractionOptions) => Promise<ExtractedColor[]>;
  extractFromCanvas: (canvas: HTMLCanvasElement, options: ExtractionOptions) => Promise<ExtractedColor[]>;
  extractFromImageData: (imageData: ImageData, options: ExtractionOptions) => Promise<ExtractedColor[]>;
  reset: () => void;
}

// RGB到HSL转换
const rgbToHsl = (r: number, g: number, b: number): { h: number; s: number; l: number } => {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // 灰色
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
};

// RGB到十六进制转换
const rgbToHex = (r: number, g: number, b: number): string => {
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(x).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
};

// 计算颜色距离（Delta E）
const calculateColorDistance = (color1: { r: number; g: number; b: number }, color2: { r: number; g: number; b: number }): number => {
  const dr = color1.r - color2.r;
  const dg = color1.g - color2.g;
  const db = color1.b - color2.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
};

// 判断是否为中性色
const isNeutralColor = (rgb: { r: number; g: number; b: number }, threshold: number = 30): boolean => {
  const { r, g, b } = rgb;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return (max - min) < threshold;
};

// K-means聚类算法
const kMeansCluster = (pixels: { r: number; g: number; b: number }[], k: number, maxIterations: number = 50): ExtractedColor[] => {
  if (pixels.length === 0) return [];
  
  // 初始化聚类中心
  let centroids: { r: number; g: number; b: number }[] = [];
  for (let i = 0; i < k; i++) {
    const randomIndex = Math.floor(Math.random() * pixels.length);
    centroids.push({ ...pixels[randomIndex] });
  }

  let assignments: number[] = new Array(pixels.length);
  
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    // 分配像素到最近的聚类中心
    let changed = false;
    for (let i = 0; i < pixels.length; i++) {
      let minDistance = Infinity;
      let nearestCentroid = 0;
      
      for (let j = 0; j < k; j++) {
        const distance = calculateColorDistance(pixels[i], centroids[j]);
        if (distance < minDistance) {
          minDistance = distance;
          nearestCentroid = j;
        }
      }
      
      if (assignments[i] !== nearestCentroid) {
        changed = true;
        assignments[i] = nearestCentroid;
      }
    }
    
    if (!changed) break;
    
    // 更新聚类中心
    const clusterSums: { r: number; g: number; b: number; count: number }[] = new Array(k).fill(null).map(() => ({ r: 0, g: 0, b: 0, count: 0 }));
    
    for (let i = 0; i < pixels.length; i++) {
      const cluster = assignments[i];
      clusterSums[cluster].r += pixels[i].r;
      clusterSums[cluster].g += pixels[i].g;
      clusterSums[cluster].b += pixels[i].b;
      clusterSums[cluster].count++;
    }
    
    for (let i = 0; i < k; i++) {
      if (clusterSums[i].count > 0) {
        centroids[i] = {
          r: clusterSums[i].r / clusterSums[i].count,
          g: clusterSums[i].g / clusterSums[i].count,
          b: clusterSums[i].b / clusterSums[i].count
        };
      }
    }
  }

  // 计算每个聚类的统计信息
  const clusterStats = centroids.map((centroid, index) => {
    const clusterPixels = pixels.filter((_, i) => assignments[i] === index);
    const percentage = clusterPixels.length / pixels.length;
    const rgb = {
      r: Math.round(centroid.r),
      g: Math.round(centroid.g),
      b: Math.round(centroid.b)
    };
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    
    return {
      hex: rgbToHex(rgb.r, rgb.g, rgb.b),
      rgb,
      hsl,
      type: 'primary' as const,
      percentage,
      dominance: percentage * 100,
      cluster: [centroid.r, centroid.g, centroid.b],
      confidence: Math.min(1, clusterPixels.length / 100)
    };
  });

  return clusterStats.sort((a, b) => b.percentage - a.percentage);
};

// 中位切分算法
const medianCutAlgorithm = (pixels: { r: number; g: number; b: number }[], targetColors: number): ExtractedColor[] => {
  if (pixels.length === 0) return [];
  
  // 简化版中位切分算法
  // 这里实现一个基础版本，实际项目中可以使用更完善的库
  
  const buckets: { r: number; g: number; b: number }[][] = [pixels];
  
  while (buckets.length < targetColors) {
    // 找到像素最多的桶
    let largestBucketIndex = 0;
    let largestBucketSize = 0;
    
    for (let i = 0; i < buckets.length; i++) {
      if (buckets[i].length > largestBucketSize) {
        largestBucketSize = buckets[i].length;
        largestBucketIndex = i;
      }
    }
    
    const bucket = buckets[largestBucketIndex];
    if (bucket.length <= 1) break;
    
    // 找到最大色彩范围的维度
    const ranges = ['r', 'g', 'b'].map(channel => {
      const values = bucket.map(p => p[channel as keyof typeof p]);
      return {
        channel,
        range: Math.max(...values) - Math.min(...values)
      };
    });
    
    const largestRange = ranges.reduce((max, current) => current.range > max.range ? current : max);
    
    // 按该维度排序并切分
    bucket.sort((a, b) => a[largestRange.channel as keyof typeof a] - b[largestRange.channel as keyof typeof b]);
    const midIndex = Math.floor(bucket.length / 2);
    
    buckets[largestBucketIndex] = bucket.slice(0, midIndex);
    buckets.push(bucket.slice(midIndex));
  }
  
  // 计算每个桶的平均颜色
  return buckets.map(bucket => {
    const totalPixels = bucket.length;
    const avgR = bucket.reduce((sum, p) => sum + p.r, 0) / totalPixels;
    const avgG = bucket.reduce((sum, p) => sum + p.g, 0) / totalPixels;
    const avgB = bucket.reduce((sum, p) => sum + p.b, 0) / totalPixels;
    
    const rgb = { r: Math.round(avgR), g: Math.round(avgG), b: Math.round(avgB) };
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    const percentage = totalPixels / pixels.length;
    
    return {
      hex: rgbToHex(rgb.r, rgb.g, rgb.b),
      rgb,
      hsl,
      type: 'primary' as const,
      percentage,
      dominance: percentage * 100,
      cluster: [avgR, avgG, avgB],
      confidence: Math.min(1, totalPixels / 50)
    };
  }).sort((a, b) => b.percentage - a.percentage);
};

export const useColorExtraction = (options: UseColorExtractionOptions = {}): UseColorExtractionReturn => {
  const {
    onSuccess,
    onError,
    autoExtract = false
  } = options;

  // 状态
  const [extracting, setExtracting] = useState(false);
  const [extractedColors, setExtractedColors] = useState<ExtractedColor[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Canvas引用用于图像处理
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 从ImageData提取颜色
  const extractFromImageData = useCallback(async (
    imageData: ImageData, 
    extractionOptions: ExtractionOptions
  ): Promise<ExtractedColor[]> => {
    return new Promise((resolve, reject) => {
      try {
        const { data, width, height } = imageData;
        const pixels: { r: number; g: number; b: number }[] = [];
        
        // 采样像素以提高性能
        const sampleRate = Math.max(1, Math.floor((width * height) / 10000)); // 最多采样10000个像素
        
        for (let i = 0; i < data.length; i += 4 * sampleRate) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const alpha = data[i + 3];
          
          // 跳过透明像素
          if (alpha < 128) continue;
          
          pixels.push({ r, g, b });
        }

        if (pixels.length === 0) {
          reject(new Error('No valid pixels found in image'));
          return;
        }

        // 根据算法提取颜色
        let colors: ExtractedColor[];
        if (extractionOptions.algorithm === 'kmeans') {
          colors = kMeansCluster(pixels, extractionOptions.colorCount);
        } else {
          colors = medianCutAlgorithm(pixels, extractionOptions.colorCount);
        }

        // 过滤和后处理
        let filteredColors = colors.filter(color => 
          color.percentage >= extractionOptions.minColorPercentage
        );

        // 排除中性色（如果需要）
        if (!extractionOptions.includeNeutral) {
          filteredColors = filteredColors.filter(color => 
            !isNeutralColor(color.rgb)
          );
        }

        // 排除相似颜色（如果需要）
        if (extractionOptions.excludeSimilar) {
          const uniqueColors: ExtractedColor[] = [];
          const minDistance = (1 - extractionOptions.sensitivity) * 100;
          
          for (const color of filteredColors) {
            const isSimilar = uniqueColors.some(existing => 
              calculateColorDistance(color.rgb, existing.rgb) < minDistance
            );
            
            if (!isSimilar) {
              uniqueColors.push(color);
            }
          }
          
          filteredColors = uniqueColors;
        }

        // 限制输出颜色数量
        filteredColors = filteredColors.slice(0, extractionOptions.colorCount);

        resolve(filteredColors);
      } catch (err) {
        reject(err);
      }
    });
  }, []);

  // 从Canvas提取颜色
  const extractFromCanvas = useCallback(async (
    canvas: HTMLCanvasElement, 
    extractionOptions: ExtractionOptions
  ): Promise<ExtractedColor[]> => {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return extractFromImageData(imageData, extractionOptions);
  }, [extractFromImageData]);

  // 从图片元素提取颜色
  const extractColors = useCallback(async (
    imageElement: HTMLImageElement, 
    extractionOptions: ExtractionOptions
  ): Promise<ExtractedColor[]> => {
    setExtracting(true);
    setError(null);

    try {
      // 创建或获取canvas
      if (!canvasRef.current) {
        canvasRef.current = document.createElement('canvas');
      }
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      // 设置canvas尺寸（限制最大尺寸以提高性能）
      const maxSize = 400;
      const scale = Math.min(maxSize / imageElement.naturalWidth, maxSize / imageElement.naturalHeight, 1);
      
      canvas.width = imageElement.naturalWidth * scale;
      canvas.height = imageElement.naturalHeight * scale;

      // 绘制图片到canvas
      ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);

      // 提取颜色
      const colors = await extractFromCanvas(canvas, extractionOptions);
      
      setExtractedColors(colors);
      onSuccess?.(colors);
      
      return colors;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Color extraction failed');
      setError(error.message);
      onError?.(error);
      throw error;
    } finally {
      setExtracting(false);
    }
  }, [extractFromCanvas, onSuccess, onError]);

  // 重置状态
  const reset = useCallback(() => {
    setExtractedColors([]);
    setError(null);
    setExtracting(false);
  }, []);

  return {
    extracting,
    extractedColors,
    error,
    extractColors,
    extractFromCanvas,
    extractFromImageData,
    reset
  };
}; 