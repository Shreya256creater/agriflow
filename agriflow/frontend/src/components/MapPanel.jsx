import { useEffect } from 'react';
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { formatKm, inr, useLang } from '../ui';

const SHORT = {
  tractor: 'Tr',
  harvester: 'Hv',
  seed_drill: 'Sd',
  sprayer: 'Sp',
  rotavator: 'Rv',
  thresher: 'Th',
};

function icon(color, text) {
  return L.divIcon({
    className: '',
    html: `<div style="width:44px;height:44px;border-radius:999px;background:${color};color:white;display:flex;align-items:center;justify-content:center;font-weight:800;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.3);font-size:14px">${text}</div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
}

function zoomFor(radius) {
  if (radius <= 5) return 13;
  if (radius <= 10) return 12;
  if (radius <= 25) return 11;
  return 10;
}

function RecenterView({ lat, lng, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], zoom);
    const timer = setTimeout(() => map.invalidateSize(), 80);
    return () => clearTimeout(timer);
  }, [map, lat, lng, zoom]);
  return null;
}

export default function MapPanel({ items, lat, lng, radius, onBook }) {
  const { t } = useLang();
  const zoom = zoomFor(radius);
  return (
    <div className="h-[55vh] overflow-hidden rounded-3xl border border-[#E1E6D8]">
      <MapContainer center={[lat, lng]} zoom={zoom} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <RecenterView lat={lat} lng={lng} zoom={zoom} />
        <Circle center={[lat, lng]} radius={radius * 1000} pathOptions={{ color: '#1F6B45', fillOpacity: 0.08 }} />
        <Marker position={[lat, lng]} icon={icon('#C8922A', t('yourPin').slice(0, 3))} />
        {items.map((item) => (
          <Marker key={item.id} position={[item.lat, item.lng]} icon={icon('#1F6B45', SHORT[item.type] || 'M')}>
            <Popup>
              <strong>{item.name}</strong>
              <div>{inr(item.pricePerDay)} · {formatKm(item.distanceKm)} {t('km')}</div>
              <button type="button" onClick={() => onBook(item)}>{t('bookNow')}</button>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
