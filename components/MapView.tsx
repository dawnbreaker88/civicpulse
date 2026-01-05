import React, { FC } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import type { Issue, Theme } from '../lib/types';
import { HYDERABAD_CENTER, MAP_ZOOM } from '../lib/constants';
import { getMarkerIcon } from '../lib/helpers';


export const MapView: FC<{ issues: Issue[], theme: Theme }> = ({ issues, theme }) => {
  const lightTileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  
  // A simple way to create a dark mode effect on the default tiles
  const darkTileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
  
  const tileUrl = theme === 'dark' ? darkTileUrl : lightTileUrl;
  
  return (
    <div className="map-container">
      <MapContainer center={HYDERABAD_CENTER} zoom={MAP_ZOOM} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution={attribution}
          url={tileUrl}
        />
        {issues.map(issue => (
          <Marker key={issue.id} position={[issue.location.lat, issue.location.lng]} icon={getMarkerIcon(issue.severity_score)}>
            <Popup>
              <div className="popup-title">{issue.title}</div>
              <div className="popup-summary">{issue.ai_summary}</div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};