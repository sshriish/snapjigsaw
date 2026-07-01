import { useState, useEffect } from 'react';
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
  const [thumbnails, setThumbnails] = useState<Record<FilterType, string>>({} as any);
  const [isLoading, setIsLoading] = useState(true);

  // Generate thumbnail sizes of the photo for preview tiles
  useEffect(() => {
    async function generateThumbnails() {
      setIsLoading(true);
      try {
        const thumbCanvas = document.createElement('canvas');
        const thumbCtx = thumbCanvas.getContext('2d');
        const img = new Image();
        img.src = photoDataUrl;

        await new Promise((resolve) => {
          img.onload = resolve;
        });

        // Small dimensions for thumbnail computation to keep it fast
        thumbCanvas.width = 120;
        thumbCanvas.height = 90;
        thumbCtx?.drawImage(img, 0, 0, 120, 90);

        const newThumbs: Record<FilterType, string> = {} as any;
        for (const option of FILTER_OPTIONS) {
          newThumbs[option.id] = await applyFilter(thumbCanvas, option.id);
        }
        setThumbnails(newThumbs);
      } catch (err) {
        console.error('Failed to generate filter thumbnails:', err);
      } finally {
        setIsLoading(false);
      }
    }

    generateThumbnails();
  }, [photoDataUrl]);

  // Apply filter to the main preview image when selection changes
  useEffect(() => {
    let active = true;
    async function updateMainPreview() {
      if (selectedFilter === 'none') {
        setPreviewImage(photoDataUrl);
        return;
      }
      try {
        const img = new Image();
        img.src = photoDataUrl;
        await new Promise((resolve) => {
          img.onload = resolve;
        });
        const result = await applyFilter(img, selectedFilter);
        if (active) {
          setPreviewImage(result);
        }
      } catch (err) {
        console.error('Error updating main preview filter:', err);
      }
    }
    updateMainPreview();
    return () => {
      active = false;
    };
  }, [selectedFilter, photoDataUrl]);

  const handleConfirm = async () => {
    // Generate full-resolution filtered image
    const img = new Image();
    img.src = photoDataUrl;
    await new Promise((resolve) => {
      img.onload = resolve;
    });
    const finalDataUrl = await applyFilter(img, selectedFilter);
    onFilterSelected(finalDataUrl, selectedFilter);
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
