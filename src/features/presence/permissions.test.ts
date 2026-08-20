jest.mock('expo-location', () => require('../../test-utils/expo-mocks').createExpoLocationMock());

import * as Location from 'expo-location';

import { ensureForegroundLocation, getForegroundLocationStatus } from './permissions';

describe('permissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Location.hasServicesEnabledAsync as jest.Mock).mockResolvedValue(true);
    (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
  });

  describe('ensureForegroundLocation', () => {
    it('returns services_off and never requests when device services are disabled', async () => {
      (Location.hasServicesEnabledAsync as jest.Mock).mockResolvedValue(false);

      const result = await ensureForegroundLocation();

      expect(result).toBe('services_off');
      expect(Location.requestForegroundPermissionsAsync).not.toHaveBeenCalled();
    });

    it('returns granted without requesting when already granted', async () => {
      (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });

      const result = await ensureForegroundLocation();

      expect(result).toBe('granted');
      expect(Location.requestForegroundPermissionsAsync).not.toHaveBeenCalled();
    });

    it('requests once and returns granted when undetermined and the request is granted', async () => {
      (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'undetermined' });
      (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });

      const result = await ensureForegroundLocation();

      expect(result).toBe('granted');
      expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalledTimes(1);
    });

    it('returns denied when undetermined and the request is denied', async () => {
      (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'undetermined' });
      (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });

      const result = await ensureForegroundLocation();

      expect(result).toBe('denied');
    });
  });

  describe('getForegroundLocationStatus', () => {
    it('returns granted and never requests', async () => {
      (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });

      const result = await getForegroundLocationStatus();

      expect(result).toBe('granted');
      expect(Location.requestForegroundPermissionsAsync).not.toHaveBeenCalled();
    });

    it('returns denied and never requests', async () => {
      (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });

      const result = await getForegroundLocationStatus();

      expect(result).toBe('denied');
      expect(Location.requestForegroundPermissionsAsync).not.toHaveBeenCalled();
    });

    it('returns services_off and never requests', async () => {
      (Location.hasServicesEnabledAsync as jest.Mock).mockResolvedValue(false);

      const result = await getForegroundLocationStatus();

      expect(result).toBe('services_off');
      expect(Location.requestForegroundPermissionsAsync).not.toHaveBeenCalled();
    });
  });
});
