import { createExpoLocationMock, makeLocationObject } from './expo-mocks';

describe('expo-mocks test utilities', () => {
  it('makeLocationObject applies overrides and defaults mocked to false', () => {
    const loc = makeLocationObject({ latitude: 1, longitude: 2 });
    expect(loc.coords.latitude).toBe(1);
    expect(loc.coords.longitude).toBe(2);
    expect(loc.mocked).toBe(false);
  });

  it('createExpoLocationMock exposes PermissionStatus.GRANTED and a jest.fn watchPositionAsync', () => {
    const mock = createExpoLocationMock();
    expect(mock.PermissionStatus.GRANTED).toBe('granted');
    expect(jest.isMockFunction(mock.watchPositionAsync)).toBe(true);
  });
});
