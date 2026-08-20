import { Text, View } from 'react-native';

import { useTodayEarningsQuery, useTodayOnlineTimeQuery } from '../api';

/** `h = Math.floor(total / 60)`, `m = total % 60`; drops the `0h` prefix when
 *  there are no full hours yet. Exported so it can be exercised directly. */
export function formatMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

interface StatCardProps {
  eyebrow: string;
  value: string;
  subtext: string;
}

function StatCard({ eyebrow, value, subtext }: StatCardProps) {
  return (
    <View className="flex-1 rounded-control bg-neutral-50 p-[14px]">
      <Text className="text-[12px] font-jakarta-bold uppercase tracking-[0.08em] text-neutral-500">
        {eyebrow}
      </Text>
      <Text className="mt-1 text-[24px] font-jakarta-extrabold text-neutral-900">{value}</Text>
      <Text className="mt-0.5 text-[13px] font-jakarta text-neutral-500">{subtext}</Text>
    </View>
  );
}

/** D06's bottom-sheet stat row. Reads both hooks itself so the screen does not
 *  have to thread four values down. */
export function StatCards() {
  const { data: earnings } = useTodayEarningsQuery();
  const { data: onlineTime } = useTodayOnlineTimeQuery();

  const currency = earnings?.currency_code ?? 'RM';
  const amount = (earnings?.total_earnings ?? 0).toFixed(2);
  const trips = earnings?.trip_count ?? 0;
  const minutes = onlineTime?.total_minutes ?? 0;

  return (
    <View className="flex-row gap-3">
      <StatCard
        eyebrow="Today"
        value={`${currency} ${amount}`}
        subtext={`${trips} ${trips === 1 ? 'trip' : 'trips'}`}
      />
      <StatCard
        eyebrow="Online time"
        value={formatMinutes(minutes)}
        // No session start time is available from the backend, so the mockup's
        // "since 06:30" is not renderable. "Today so far" states the same period
        // truthfully. Zero-state copy is UI-SPEC's own default.
        subtext={minutes > 0 ? 'Today so far' : 'Not online yet'}
      />
    </View>
  );
}
