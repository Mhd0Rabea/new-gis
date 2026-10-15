import { useState } from 'react';
import { Map, MapPin, Mountain, Satellite, Search } from 'lucide-react';
import { Modal } from '../../../components/Modal.jsx';
import { basemapConfigurations } from '../config/basemaps.js';

const basemapIcons = { streets: Map, satellite: Satellite, terrain: Mountain };

export function MapNavigationPanel({
  basemapId,
  searchQuery,
  searchStatus,
  searchResults,
  onBasemapChange,
  onSearchQueryChange,
  onSearch,
  onSelectPlace,
}) {
  const [searchOpen, setSearchOpen] = useState(false);

  const selectPlace = (place) => {
    onSelectPlace(place);
    setSearchOpen(false);
  };

  return (
    <section className="map-panel map-navigation-panel" aria-labelledby="map-navigation-title">
      <div className="map-panel-heading">
        <div>
          <span className="map-panel-eyebrow"><MapPin size={15} aria-hidden="true" /> استكشاف المكان</span>
          <h2 id="map-navigation-title">البحث وخريطة الأساس</h2>
        </div>
        <button
          className="map-icon-button map-search-launch"
          type="button"
          onClick={() => setSearchOpen(true)}
          aria-label="فتح البحث عن مكان"
          title="البحث عن مكان"
        >
          <Search size={18} aria-hidden="true" />
        </button>
      </div>

      <div className="map-basemap-picker">
        <span className="map-basemap-label">خريطة الأساس</span>
        <div className="map-basemap-options" role="group" aria-label="اختر خريطة الأساس">
          {basemapConfigurations.map((basemap) => {
            const Icon = basemapIcons[basemap.id];
            const isActive = basemap.id === basemapId;
            return (
              <button
                key={basemap.id}
                className={'map-basemap-option' + (isActive ? ' is-active' : '')}
                type="button"
                onClick={() => onBasemapChange(basemap.id)}
                aria-pressed={isActive}
              >
                <Icon size={18} strokeWidth={2} aria-hidden="true" />
                <strong>{basemap.label}</strong>
              </button>
            );
          })}
        </div>
      </div>

      <Modal isOpen={searchOpen} onClose={() => setSearchOpen(false)} title="البحث عن مكان" size="small" className="map-tool-modal">
        <form className="map-tool-form map-search-modal-form" onSubmit={onSearch}>
          <div className="map-tool-intro">
            <MapPin size={20} aria-hidden="true" />
            <p>ابحث عن محافظة أو منطقة أو مكان ضمن سوريا.</p>
          </div>
          <label htmlFor="map-place-query">اسم المكان</label>
          <div className="map-place-search-row">
            <input
              id="map-place-query"
              type="search"
              value={searchQuery}
              onChange={(event) => onSearchQueryChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') onSearch(event);
              }}
              placeholder="مثال: دمشق"
              autoComplete="off"
              minLength={2}
              required
              autoFocus
            />
            <button className="button button-primary" type="submit" disabled={searchStatus === 'loading'} aria-label="البحث عن مكان">
              <Search size={17} aria-hidden="true" />
            </button>
          </div>
          <p className="map-place-search-status" role="status">
            {searchStatus === 'loading' ? 'جاري البحث...' : null}
            {searchStatus === 'empty' ? 'لم يتم العثور على نتائج ضمن سوريا.' : null}
            {searchStatus === 'error' ? 'تعذر الاتصال بخدمة البحث.' : null}
          </p>

          {searchResults.length > 0 ? (
            <ul className="map-place-results" aria-label="نتائج البحث عن الأماكن">
              {searchResults.map((result) => (
                <li key={result.id}>
                  <button type="button" onClick={() => selectPlace(result)}>
                    <MapPin size={16} aria-hidden="true" />
                    <span>{result.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </form>
      </Modal>
    </section>
  );
}
