import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from "react-native";
import { CalendarHeart, ChevronRight } from "lucide-react-native";
import { useThemeContext } from "../styles/ThemeContext";
import { useLanguageContext } from "../styles/LanguageContext";
import { getCelebrationImage } from "../utils/celebrationImage";
import { api } from "../app/api";
import type { CustomAnniversary } from "./AnniversaryPage";

interface AnniversaryCardProps {
  relationshipStartDate: Date | null;
  onPress?: () => void;
  userId: string;
}

interface Milestone {
  label: string;
  daysUntil: number;
}

function getToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function diffDaysBetween(a: Date, b: Date): number {
  const aUTC = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const bUTC = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((bUTC - aUTC) / (1000 * 60 * 60 * 24));
}

export function AnniversaryCard({
  relationshipStartDate,
  onPress,
  userId,
}: AnniversaryCardProps) {
  const { theme } = useThemeContext();
  const { t, language } = useLanguageContext();

  const daysTogether = useMemo(() => {
    if (!relationshipStartDate) return 0;
    const diff = diffDaysBetween(relationshipStartDate, getToday());
    return diff >= 0 ? diff : 0;
  }, [relationshipStartDate]);

  const milestones = useMemo(() => {
    if (!relationshipStartDate) return [];
    const today = getToday();
    const results: Milestone[] = [];

    // Next 100-day milestone
    const current100 = Math.floor(daysTogether / 100) * 100;
    const next100 = current100 + 100;
    const daysUntil100 = next100 - daysTogether;
    results.push({
      label: t("anniversary.day100").replace("{count}", String(next100)),
      daysUntil: daysUntil100,
    });

    // Next monthly anniversary
    const startDay = relationshipStartDate.getDate();
    let monthCandidate = new Date(
      today.getFullYear(),
      today.getMonth(),
      startDay
    );
    // If the start day doesn't exist in the candidate month, use last day of that month
    if (monthCandidate.getDate() !== startDay) {
      monthCandidate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    }
    if (monthCandidate <= today) {
      monthCandidate = new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        startDay
      );
      if (monthCandidate.getDate() !== startDay) {
        monthCandidate = new Date(
          today.getFullYear(),
          today.getMonth() + 2,
          0
        );
      }
    }
    // Only show if it's not the same as yearly
    const monthsDiff =
      (monthCandidate.getFullYear() - relationshipStartDate.getFullYear()) *
        12 +
      (monthCandidate.getMonth() - relationshipStartDate.getMonth());
    if (monthsDiff > 0 && monthsDiff % 12 !== 0) {
      const daysUntilMonthly = diffDaysBetween(today, monthCandidate);
      results.push({
        label: t("anniversary.monthlyAnniversary").replace(
          "{count}",
          String(monthsDiff)
        ),
        daysUntil: daysUntilMonthly,
      });
    }

    // Next yearly anniversary
    let nextYearDate = new Date(
      today.getFullYear(),
      relationshipStartDate.getMonth(),
      relationshipStartDate.getDate()
    );
    if (nextYearDate <= today) {
      nextYearDate = new Date(
        today.getFullYear() + 1,
        relationshipStartDate.getMonth(),
        relationshipStartDate.getDate()
      );
    }
    const yearsDiff =
      nextYearDate.getFullYear() - relationshipStartDate.getFullYear();
    if (yearsDiff > 0) {
      const daysUntilYearly = diffDaysBetween(today, nextYearDate);
      results.push({
        label: t("anniversary.yearlyAnniversary").replace(
          "{count}",
          String(yearsDiff)
        ),
        daysUntil: daysUntilYearly,
      });
    }

    // Sort by soonest first
    results.sort((a, b) => a.daysUntil - b.daysUntil);

    return results;
  }, [relationshipStartDate, daysTogether, t]);

  // Check if today is any milestone
  const todayMilestones = useMemo(() => {
    if (!relationshipStartDate) return [];
    const today = getToday();
    const active: string[] = [];

    // 100-day milestone today?
    if (daysTogether > 0 && daysTogether % 100 === 0) {
      active.push(
        t("anniversary.day100").replace("{count}", String(daysTogether))
      );
    }

    // Monthly anniversary today?
    const startDay = relationshipStartDate.getDate();
    if (today.getDate() === startDay && daysTogether > 0) {
      const monthsDiff =
        (today.getFullYear() - relationshipStartDate.getFullYear()) * 12 +
        (today.getMonth() - relationshipStartDate.getMonth());
      if (monthsDiff > 0 && monthsDiff % 12 !== 0) {
        active.push(
          t("anniversary.monthlyAnniversary").replace(
            "{count}",
            String(monthsDiff)
          )
        );
      }
    }

    // Yearly anniversary today?
    if (
      today.getMonth() === relationshipStartDate.getMonth() &&
      today.getDate() === relationshipStartDate.getDate() &&
      today.getFullYear() > relationshipStartDate.getFullYear()
    ) {
      const years =
        today.getFullYear() - relationshipStartDate.getFullYear();
      active.push(
        t("anniversary.yearlyAnniversary").replace("{count}", String(years))
      );
    }

    return active;
  }, [relationshipStartDate, daysTogether, t]);

  // Load custom anniversaries that fall on today
  const [todayCustom, setTodayCustom] = useState<string[]>([]);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const serverList = await api.getAnniversaries(userId);
        const today = getToday();
        const mm = String(today.getMonth() + 1).padStart(2, "0");
        const dd = String(today.getDate()).padStart(2, "0");
        // Match anniversaries whose month-day equals today (recurring)
        const matches = serverList
          .filter((a) => {
            const parts = a.date.split("-");
            return parts[1] === mm && parts[2] === dd;
          })
          .map((a) => a.title);
        setTodayCustom(matches);
      } catch {}
    })();
  }, [userId]);

  const allTodayCelebrations = [...todayMilestones, ...todayCustom];
  const isCelebration = allTodayCelebrations.length > 0;

  const [celebrationImageUri, setCelebrationImageUri] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

  useEffect(() => {
    if (!isCelebration || allTodayCelebrations.length === 0) return;
    let cancelled = false;
    setImageLoading(true);
    getCelebrationImage(allTodayCelebrations[0], language)
      .then((uri) => {
        if (!cancelled) setCelebrationImageUri(uri);
      })
      .finally(() => {
        if (!cancelled) setImageLoading(false);
      });
    return () => { cancelled = true; };
  }, [isCelebration, allTodayCelebrations.length, language]);

  function formatCountdown(daysUntil: number): string {
    if (daysUntil === 0) return t("anniversary.today");
    if (daysUntil === 1) return t("anniversary.tomorrow");
    return t("anniversary.inDays").replace("{count}", String(daysUntil));
  }

  const daysLabel =
    daysTogether === 1
      ? t("anniversary.dayTogether")
      : t("anniversary.daysTogether").replace(
          "{count}",
          String(daysTogether)
        );

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.colorCard, borderColor: theme.colorBorder }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.header}>
        <CalendarHeart size={20} color={theme.colorPrimary} />
        <Text style={[styles.title, { color: theme.colorForeground }]}>
          {daysLabel}
        </Text>
        <ChevronRight
          size={16}
          color={theme.colorMutedForeground}
          style={styles.chevron}
        />
      </View>

      {!relationshipStartDate ? (
        <View
          style={[styles.milestoneRow, { backgroundColor: theme.colorMuted }]}
        >
          <Text
            style={[
              styles.milestoneLabel,
              { color: theme.colorMutedForeground },
            ]}
          >
            {t("anniversary.noDateSet")}
          </Text>
        </View>
      ) : (
        <>
          {/* Celebration banner */}
          {isCelebration && (
            <View style={styles.celebrationContainer}>
              {celebrationImageUri ? (
                <Image
                  source={{ uri: celebrationImageUri }}
                  style={styles.celebrationImage}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={[
                    styles.celebrationPlaceholder,
                    { backgroundColor: theme.colorPrimary + "20" },
                  ]}
                >
                  {imageLoading && (
                    <ActivityIndicator
                      size="small"
                      color={theme.colorPrimary}
                      style={{ marginBottom: 6 }}
                    />
                  )}
                </View>
              )}
            </View>
          )}
          {isCelebration &&
            allTodayCelebrations.map((label, i) => (
              <View
                key={`cel-${i}`}
                style={[
                  styles.milestoneRow,
                  { backgroundColor: theme.colorPrimary + "18" },
                ]}
              >
                <Text
                  style={[
                    styles.milestoneLabel,
                    { color: theme.colorPrimary, fontWeight: "600" },
                  ]}
                >
                  {label}
                </Text>
                <Text
                  style={[
                    styles.milestoneCountdown,
                    { color: theme.colorPrimary },
                  ]}
                >
                  {t("anniversary.today")}
                </Text>
              </View>
            ))}

          {/* Upcoming milestones */}
          {milestones.length > 0 && (
            <>
              <Text
                style={[
                  styles.sectionLabel,
                  { color: theme.colorMutedForeground },
                ]}
              >
                {t("anniversary.upcomingMilestones")}
              </Text>
              {milestones.slice(0, 3).map((m, i) => (
                <View
                  key={`ms-${i}`}
                  style={[
                    styles.milestoneRow,
                    { backgroundColor: theme.colorMuted },
                  ]}
                >
                  <Text
                    style={[
                      styles.milestoneLabel,
                      { color: theme.colorForeground },
                    ]}
                  >
                    {m.label}
                  </Text>
                  <Text
                    style={[
                      styles.milestoneCountdown,
                      { color: theme.colorMutedForeground },
                    ]}
                  >
                    {formatCountdown(m.daysUntil)}
                  </Text>
                </View>
              ))}
            </>
          )}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 8,
    flex: 1,
  },
  chevron: {
    marginLeft: "auto",
  },
  celebrationContainer: {
    marginBottom: 6,
    alignItems: "center",
  },
  celebrationImage: {
    width: "100%",
    height: 120,
    borderRadius: 12,
  },
  celebrationPlaceholder: {
    width: "100%",
    height: 120,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 4,
    marginBottom: 4,
    marginLeft: 2,
  },
  milestoneRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  milestoneLabel: {
    fontSize: 13,
    flex: 1,
  },
  milestoneCountdown: {
    fontSize: 12,
    marginLeft: 8,
  },
});
