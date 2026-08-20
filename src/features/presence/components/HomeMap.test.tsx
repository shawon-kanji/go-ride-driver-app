import { fireEvent, render, screen } from '@testing-library/react-native';

jest.mock('react-native-maps', () => require('../../../test-utils/expo-mocks').createReactNativeMapsMock());
jest.mock('lucide-react-native', () => require('../../../test-utils/expo-mocks').createLucideMock());

import { HomeMap } from './HomeMap';

const COORDS = { latitude: 3.139, longitude: 101.6869 };

describe('HomeMap', () => {
  it('renders an element with testID map-view', async () => {
    await render(<HomeMap coords={null} />);
    expect(screen.getByTestId('map-view')).toBeTruthy();
  });

  it('renders a map-marker whose coordinate prop deep-equals the given coords', async () => {
    await render(<HomeMap coords={COORDS} />);
    expect(screen.getByTestId('map-marker').props.coordinate).toEqual(COORDS);
  });

  it('sets tracksViewChanges exactly false on the marker', async () => {
    await render(<HomeMap coords={COORDS} />);
    expect(screen.getByTestId('map-marker').props.tracksViewChanges).toBe(false);
  });

  it('renders no marker with coords null, but the MapView still renders', async () => {
    await render(<HomeMap coords={null} />);
    expect(screen.queryByTestId('map-marker')).toBeNull();
    expect(screen.getByTestId('map-view')).toBeTruthy();
  });

  it('does not render the re-centre control initially', async () => {
    await render(<HomeMap coords={COORDS} />);
    expect(screen.queryByTestId('home-map-recentre')).toBeNull();
  });

  it('shows the re-centre control after a pan drag on the map', async () => {
    await render(<HomeMap coords={COORDS} />);
    await fireEvent(screen.getByTestId('map-view'), 'panDrag');
    expect(await screen.findByTestId('home-map-recentre')).toBeTruthy();
  });

  it('hides the re-centre control again after it is pressed', async () => {
    await render(<HomeMap coords={COORDS} />);
    await fireEvent(screen.getByTestId('map-view'), 'panDrag');
    const recentre = await screen.findByTestId('home-map-recentre');
    await fireEvent.press(recentre);
    expect(screen.queryByTestId('home-map-recentre')).toBeNull();
  });

  it('passes a non-undefined region while following, and undefined after panning', async () => {
    await render(<HomeMap coords={COORDS} />);
    expect(screen.getByTestId('map-view').props.region).toEqual({
      ...COORDS,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });

    await fireEvent(screen.getByTestId('map-view'), 'panDrag');
    expect(screen.getByTestId('map-view').props.region).toBeUndefined();
  });

  it('uses the Kuala Lumpur fallback initialRegion and an undefined region when coords is null', async () => {
    await render(<HomeMap coords={null} />);
    expect(screen.getByTestId('map-view').props.region).toBeUndefined();
    expect(screen.getByTestId('map-view').props.initialRegion).toEqual({
      latitude: 3.139,
      longitude: 101.6869,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    });
  });
});
