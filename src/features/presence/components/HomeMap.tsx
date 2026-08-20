import { Crosshair } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, type Region } from 'react-native-maps';

import type { LatLng } from '../../../lib/geo';

// Shown before any fix exists (permission not yet granted — D06 mounts before D07
// ever requests it). Kuala Lumpur city centre: an arbitrary but valid region beats
// letting the native view receive undefined/NaN.
const FALLBACK_REGION: Region = {
  latitude: 3.139,
  longitude: 101.6869,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const FOLLOW_DELTA = 0.01;

interface HomeMapProps {
  /** Latest known fix, or null when permission has never been granted. */
  coords: LatLng | null;
  testID?: string;
}

export function HomeMap({ coords, testID }: HomeMapProps) {
  const [following, setFollowing] = useState(true);

  const region = useMemo<Region | undefined>(() => {
    if (!following || !coords) return undefined;
    return { ...coords, latitudeDelta: FOLLOW_DELTA, longitudeDelta: FOLLOW_DELTA };
  }, [following, coords]);

  // onPanDrag is the library's own "the user touched the map" signal — do not build
  // a separate gesture detector for this (RESEARCH.md "Don't Hand-Roll").
  const handlePanDrag = useCallback(() => setFollowing(false), []);
  const handleRecentre = useCallback(() => setFollowing(true), []);

  return (
    <View testID={testID} className="flex-1">
      <MapView
        testID="map-view"
        provider={PROVIDER_GOOGLE}
        style={{ flex: 1 }}
        initialRegion={FALLBACK_REGION}
        region={region}
        onPanDrag={handlePanDrag}
        showsMyLocationButton={false}
        toolbarEnabled={false}
      >
        {coords && (
          // Static icon, so tracksViewChanges is false from the very first render —
          // leaving it true re-rasterises the marker on every location tick and is
          // PITFALLS.md Pitfall 9, scoped explicitly to this phase.
          <Marker coordinate={coords} tracksViewChanges={false} />
        )}
      </MapView>

      {!following && (
        <Pressable
          testID="home-map-recentre"
          onPress={handleRecentre}
          className="absolute bottom-4 right-4 h-11 w-11 items-center justify-center rounded-pill bg-white shadow"
        >
          <Crosshair size={20} strokeWidth={2} color="#111827" />
        </Pressable>
      )}
    </View>
  );
}
