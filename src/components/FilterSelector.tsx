import { useState, useEffect, useCallback } from 'react';
import { FILTER_OPTIONS, applyFilter } from '../utils/imageFilters';
import type { FilterType } from '../utils/imageFilters';
import { Sparkles, ArrowRight } from 'lucide-react';

interface FilterSelectorProps {
  photoDataUrl: string;
  onFilterSelected: (filteredDataUrl: string, filterId: FilterType) => void;
  onCancel: () => void;
}

export const FilterSelector: React.FC<FilterSelectorProps> = ({
  photoDataUrl,
  onFilterSelected,
  onCancel
}) => {
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('none');
  const [previewImage, setPreviewImage] = useState<string>(photoDataUrl);
  const [thumbnails, setThumbnails] = useState<Record<FilterType, string>>(
    {} as Record<FilterType, string>
  );
  const [isLoading, setIsLoading] = useState(true);

  // Loads a data URL into an <img>, rejecting on decode failure instead of hanging forever.
  const loadImage = useCallback((src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image for filtering.'));
      img.src = src;
    });
  }, []);

  // Generate thumbnail sizes of the photo for preview tiles
  useEffect(() => {
    let active = true;

    async function generateThumbnails() {
      setIsLoading(true);
      try {
        const thumbCanvas = document.createElement('canvas');
        const thumbCtx = thumbCanvas.getContext('2d');
        const img = await loadImage(photoDataUrl);

        // Small dimensions for thumbnail computation to keep it fast
        thumbCanvas.width = 120;
        thumbCanvas.height = 90;
        thumbCtx?.drawImage(img, 0, 0, 120, 90);

        const newThumbs = {} as Record<FilterType, string>;
        for (const option of FILTER_OPTIONS) {
          newThumbs[option.id] = await applyFilter(thumbCanvas, option.id);
        }
        if (active) {
          setThumbnails(newThumbs);
        }
      } catch (err) {
        console.error('Failed to generate filter thumbnails:', err);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void generateThumbnails();
    return () => {
      active = false;
    };
  }, [photoDataUrl, loadImage]);

  // Apply filter to the main preview image when selection changes
  useEffect(() => {
    let active = true;
    async function updateMainPreview() {
      if (selectedFilter === 'none') {
        setPreviewImage(photoDataUrl);
        return;
      }
      try {
        const img = await loadImage(photoDataUrl);
        const result = await applyFilter(img, selectedFilter);
        if (active) {
          setPreviewImage(result);
        }
      } catch (err) {
        console.error('Error updating main preview filter:', err);
      }
    }
    void updateMainPreview();
    return () => {
      active = false;
    };
  }, [selectedFilter, photoDataUrl, loadImage]);

  const handleConfirm = async () => {
    try {
      // Generate full-resolution filtered image
      const img = await loadImage(photoDataUrl);
      const finalDataUrl = await applyFilter(img, selectedFilter);
      onFilterSelected(finalDataUrl, selectedFilter);
    } catch (err) {
      console.error('Failed to apply filter on confirm:', err);
    }
  };

  return (
    <div className="glass-panel filter-card">
      <div style={{ alignSelf: 'flex-start' }}>
        <h2 className="landing-title" style={{ fontSize: '24px', marginBottom: '4px' }}>
          Select Image Style
        </h2>
        <p className="app-subtitle">Choose a filter to bake into your jigsaw puzzle and final polaroid</p>
      </div>

      <div className="filter-display-area">
        <div>
          <img
            src={previewImage}
            alt="Filter preview"
            className="filter-preview-main"
          />
        </div>

        <div className="filter-options-panel">
          <div className="filter-options-header">Styles</div>
          <div className="filter-grid">
            {FILTER_OPTIONS.map((option) => (
              <button
                key={option.id}
                className={`filter-tile ${selectedFilter === option.id ? 'active' : ''}`}
                onClick={() => setSelectedFilter(option.id)}
              >
                {isLoading ? (
                  <div style={{ height: '50px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }} />
                ) : (
                  <img
                    src={thumbnails[option.id]}
                    alt={option.name}
                    style={{ width: '100%', height: '50px', objectFit: 'cover', borderRadius: '6px' }}
                  />
                )}
                <span className="filter-tile-name">{option.name}</span>
                <span className="filter-tile-desc">{option.description}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="filter-actions">
        <button className="btn-secondary" onClick={onCancel}>
          Back
        </button>
        <button className="btn-primary" onClick={handleConfirm}>
          <Sparkles size={18} /> Bake Filter & Slice Puzzle <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};
