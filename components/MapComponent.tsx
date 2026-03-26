import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Image,
  Modal,
  SafeAreaView,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from "react-native-maps";
import * as Location from "expo-location";
import { MapPin, X, Clock, Navigation, CloudSun, Maximize2, Minimize2 } from "lucide-react-native";
import { api } from "../app/api";
import { useLanguageContext } from "../styles/LanguageContext";
import { useThemeContext } from "../styles/ThemeContext";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type LocationData = {
  lat: number;
  lon: number;
};

type WeatherData = {
  temperature: number | null;
  description: string;
  timezone: string | null;
};

type PinCardData = {
  kind: "me" | "partner";
  displayName: string;
  avatar: string | null;
  location: LocationData;
  placeName: string | null;
  weather: WeatherData | null;
  localTime: string | null;
  lastUpdated: string | null; // relative time string
};

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/** Haversine formula — returns distance in metres */
function haversineDistance(a: LocationData, b: LocationData): number {
  const R = 6_371_000; // Earth radius in metres
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const sinHalfLat = Math.sin(dLat / 2);
  const sinHalfLon = Math.sin(dLon / 2);
  const h =
    sinHalfLat * sinHalfLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinHalfLon * sinHalfLon;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Format distance for display */
function formatDistance(metres: number): string {
  if (metres < 1000) {
    return `${Math.round(metres)} m`;
  }
  return `${(metres / 1000).toFixed(1)} km`;
}

/** Build a relative-time string from an ISO timestamp */
function relativeTime(
  isoString: string,
  t: (key: string) => string
): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return t("map.justNow");
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} ${minutes === 1 ? t("map.minAgo") : t("map.minsAgo")}`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} ${hours === 1 ? t("map.hourAgo") : t("map.hoursAgo")}`;
  }
  const days = Math.floor(hours / 24);
  return `${days} ${days === 1 ? t("map.dayAgo") : t("map.daysAgo")}`;
}

/** Format time in a given IANA timezone */
function formatLocalTime(timezone: string): string | null {
  try {
    return new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: timezone,
      hour12: false,
    });
  } catch {
    return null;
  }
}

/** Fetch weather + timezone from Open-Meteo for a coordinate */
async function fetchWeather(loc: LocationData): Promise<WeatherData> {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}` +
      `&current=temperature_2m,weather_code&timezone=auto`;
    const resp = await fetch(url);
    const json = await resp.json();
    const temp: number | null = json?.current?.temperature_2m ?? null;
    const code: number | null = json?.current?.weather_code ?? null;
    const tz: string | null = json?.timezone ?? null;

    // WMO weather code -> i18n key (resolved at display time)
    let desc = "";
    if (code !== null) {
      if (code === 0) desc = "map.weatherClear";
      else if (code <= 3) desc = "map.weatherPartlyCloudy";
      else if (code <= 49) desc = "map.weatherFoggy";
      else if (code <= 59) desc = "map.weatherDrizzle";
      else if (code <= 69) desc = "map.weatherRain";
      else if (code <= 79) desc = "map.weatherSnow";
      else if (code <= 84) desc = "map.weatherRainShowers";
      else if (code <= 86) desc = "map.weatherSnowShowers";
      else if (code <= 99) desc = "map.weatherThunderstorm";
    }

    return { temperature: temp, description: desc, timezone: tz };
  } catch {
    return { temperature: null, description: "", timezone: null };
  }
}

/** Reverse geocode a coordinate to a place name */
async function reverseGeocode(loc: LocationData): Promise<string | null> {
  try {
    const results = await Location.reverseGeocodeAsync({
      latitude: loc.lat,
      longitude: loc.lon,
    });
    if (results.length > 0) {
      const r = results[0];
      // Build a short name: district/city
      const parts = [r.district, r.city, r.region].filter(Boolean);
      if (parts.length > 0) return parts.slice(0, 2).join(", ");
      // Fallback to name
      if (r.name) return r.name;
    }
    return null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// PinInfoCard sub-component
// ---------------------------------------------------------------------------

function PinInfoCard({
  data,
  onClose,
}: {
  data: PinCardData;
  onClose: () => void;
}) {
  const { theme } = useThemeContext();
  const { t } = useLanguageContext();

  return (
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={pinStyles.overlay}>
        <TouchableWithoutFeedback>
          <View
            style={[
              pinStyles.card,
              {
                backgroundColor: theme.colorCard,
                borderColor: theme.colorBorder,
              },
            ]}
          >
            {/* Close button */}
            <TouchableOpacity
              style={pinStyles.closeBtn}
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={16} color={theme.colorMutedForeground} />
            </TouchableOpacity>

            {/* Header: avatar + name */}
            <View style={pinStyles.header}>
              {data.avatar ? (
                <Image
                  source={{ uri: data.avatar }}
                  style={pinStyles.avatar}
                />
              ) : (
                <View
                  style={[
                    pinStyles.avatarPlaceholder,
                    { backgroundColor: theme.colorMuted },
                  ]}
                >
                  <MapPin
                    size={18}
                    color={
                      data.kind === "me" ? "#007AFF" : "#FF5E5E"
                    }
                  />
                </View>
              )}
              <Text
                style={[
                  pinStyles.name,
                  { color: theme.colorCardForeground },
                ]}
                numberOfLines={1}
              >
                {data.displayName}
              </Text>
            </View>

            {/* Location */}
            {data.placeName ? (
              <View style={pinStyles.row}>
                <Navigation size={13} color={theme.colorMutedForeground} />
                <Text
                  style={[
                    pinStyles.detail,
                    { color: theme.colorMutedForeground },
                  ]}
                  numberOfLines={1}
                >
                  {data.placeName}
                </Text>
              </View>
            ) : null}

            {/* Weather */}
            {data.weather && data.weather.temperature !== null ? (
              <View style={pinStyles.row}>
                <CloudSun size={13} color={theme.colorMutedForeground} />
                <Text
                  style={[
                    pinStyles.detail,
                    { color: theme.colorMutedForeground },
                  ]}
                >
                  {Math.round(data.weather.temperature)}°C
                  {data.weather.description
                    ? ` · ${t(data.weather.description)}`
                    : ""}
                </Text>
              </View>
            ) : null}

            {/* Local time */}
            {data.localTime ? (
              <View style={pinStyles.row}>
                <Clock size={13} color={theme.colorMutedForeground} />
                <Text
                  style={[
                    pinStyles.detail,
                    { color: theme.colorMutedForeground },
                  ]}
                >
                  {t("map.localTime")}: {data.localTime}
                </Text>
              </View>
            ) : null}

            {/* Last updated */}
            {data.lastUpdated ? (
              <Text
                style={[
                  pinStyles.updated,
                  { color: theme.colorMutedForeground },
                ]}
              >
                {t("map.lastUpdated")} {data.lastUpdated}
              </Text>
            ) : null}
          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  );
}

const pinStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
    zIndex: 100,
  },
  card: {
    width: 220,
    borderRadius: 14,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  closeBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 8,
    flexShrink: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 6,
  },
  detail: {
    fontSize: 12,
    flexShrink: 1,
  },
  updated: {
    fontSize: 11,
    marginTop: 2,
    fontStyle: "italic",
  },
});

// ---------------------------------------------------------------------------
// MapComponent
// ---------------------------------------------------------------------------

export function MapComponent() {
  const { t } = useLanguageContext();
  const { theme } = useThemeContext();
  const [myLocation, setMyLocation] = useState<LocationData | null>(null);
  const [otherLocation, setOtherLocation] = useState<LocationData | null>(null);
  const [otherUpdatedAt, setOtherUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pin info card state
  const [selectedPin, setSelectedPin] = useState<PinCardData | null>(null);
  const [fullscreen, setFullscreen] = useState(false);

  // Cached enrichment data (fetched on marker tap)
  const [myWeather, setMyWeather] = useState<WeatherData | null>(null);
  const [otherWeather, setOtherWeather] = useState<WeatherData | null>(null);
  const [myPlace, setMyPlace] = useState<string | null>(null);
  const [otherPlace, setOtherPlace] = useState<string | null>(null);
  const [myProfile, setMyProfile] = useState<{
    name: string;
    avatar: string | null;
  } | null>(null);
  const [partnerProfile, setPartnerProfile] = useState<{
    name: string;
    avatar: string | null;
  } | null>(null);

  // ---- initial data fetch ----
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          if (mounted) {
            setError(t("map.permissionDenied"));
            setLoading(false);
          }
          return;
        }

        const loc = await Location.getCurrentPositionAsync({});
        const lat = loc.coords.latitude;
        const lon = loc.coords.longitude;

        if (mounted) setMyLocation({ lat, lon });

        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const AsyncStorage =
          require("@react-native-async-storage/async-storage").default as {
            getItem: (k: string) => Promise<string | null>;
          };
        const cachedUuid =
          (await AsyncStorage.getItem("user:uuid")) || "anonymous";

        // Upload my location to server so partner can see it
        if (cachedUuid !== "anonymous") {
          api.postMyLocation({ lat, lon, userId: cachedUuid }).catch(() => {});
        }

        const linkedUser = await AsyncStorage.getItem("user:linkedUser");

        // Load my profile
        try {
          const profileStr = await AsyncStorage.getItem("user:profile");
          if (profileStr) {
            const p = JSON.parse(profileStr);
            if (mounted) setMyProfile({ name: p.name || t("map.you"), avatar: p.avatar || null });
          }
        } catch {}

        // Load partner profile from cached linkedUserProfile
        if (linkedUser && linkedUser.trim()) {
          try {
            const partnerProfileStr = await AsyncStorage.getItem("user:linkedUserProfile");
            if (partnerProfileStr && mounted) {
              const pp = JSON.parse(partnerProfileStr);
              setPartnerProfile({
                name: pp.name || linkedUser.trim() || t("map.partner"),
                avatar: pp.avatar || null,
              });
            } else if (mounted) {
              // Fallback: use linkedUser name directly
              setPartnerProfile({
                name: linkedUser.trim(),
                avatar: null,
              });
            }
          } catch {}

          const other = await api
            .getOtherLocation(cachedUuid)
            .catch(() => null);

          const isValidLocation =
            other &&
            typeof other.lat === "number" &&
            typeof other.lon === "number" &&
            isFinite(other.lat) &&
            isFinite(other.lon) &&
            other.lat !== 0 &&
            other.lon !== 0;

          if (mounted && isValidLocation) {
            setOtherLocation({ lat: other.lat, lon: other.lon });
            if (other.updated_at) setOtherUpdatedAt(other.updated_at);
          }
        }
      } catch (e: any) {
        if (mounted) setError(String(e?.message || e));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // ---- marker tap handler ----
  const handleMarkerPress = useCallback(
    async (kind: "me" | "partner") => {
      const loc = kind === "me" ? myLocation : otherLocation;
      if (!loc) return;

      // Kick off weather + geocode fetches in parallel
      const weatherCache = kind === "me" ? myWeather : otherWeather;
      const placeCache = kind === "me" ? myPlace : otherPlace;

      const [weather, place] = await Promise.all([
        weatherCache ? Promise.resolve(weatherCache) : fetchWeather(loc),
        placeCache !== null && placeCache !== undefined
          ? Promise.resolve(placeCache)
          : reverseGeocode(loc),
      ]);

      // Cache results
      if (kind === "me") {
        setMyWeather(weather);
        setMyPlace(place);
      } else {
        setOtherWeather(weather);
        setOtherPlace(place);
      }

      const localTime =
        weather.timezone ? formatLocalTime(weather.timezone) : null;

      const profile = kind === "me" ? myProfile : partnerProfile;
      const displayName = profile?.name || (kind === "me" ? t("map.you") : t("map.partner"));
      const avatar = profile?.avatar || null;

      let lastUpdated: string | null = null;
      if (kind === "me") {
        lastUpdated = t("map.justNow"); // own location is always "just now"
      } else if (otherUpdatedAt) {
        lastUpdated = relativeTime(otherUpdatedAt, t);
      }

      setSelectedPin({
        kind,
        displayName,
        avatar,
        location: loc,
        placeName: place || t("map.unknownLocation"),
        weather,
        localTime,
        lastUpdated,
      });
    },
    [
      myLocation,
      otherLocation,
      myWeather,
      otherWeather,
      myPlace,
      otherPlace,
      myProfile,
      partnerProfile,
      otherUpdatedAt,
      t,
    ]
  );

  // ---- render ----

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colorSecondary }]}>
        <ActivityIndicator size="small" color={theme.colorPrimary} />
      </View>
    );
  }

  if (error || !myLocation) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colorSecondary }]}>
        <MapPin size={20} color={theme.colorMutedForeground} />
        <Text style={[styles.errorText, { color: theme.colorMutedForeground }]}>
          {t("map.unavailable")}
        </Text>
      </View>
    );
  }

  // Region calculation
  const region = (() => {
    if (otherLocation) {
      const minLat = Math.min(myLocation.lat, otherLocation.lat);
      const maxLat = Math.max(myLocation.lat, otherLocation.lat);
      const minLon = Math.min(myLocation.lon, otherLocation.lon);
      const maxLon = Math.max(myLocation.lon, otherLocation.lon);
      const latDelta = Math.max((maxLat - minLat) * 1.5, 0.05);
      const lonDelta = Math.max((maxLon - minLon) * 1.5, 0.05);
      return {
        latitude: (minLat + maxLat) / 2,
        longitude: (minLon + maxLon) / 2,
        latitudeDelta: latDelta,
        longitudeDelta: lonDelta,
      };
    }
    return {
      latitude: myLocation.lat,
      longitude: myLocation.lon,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
  })();

  // Distance string
  const distanceText = otherLocation
    ? formatDistance(haversineDistance(myLocation, otherLocation))
    : "--";

  const CustomMarker = ({ color }: { color: string }) => (
    <MapPin size={32} color={"#FFFFFF"} fill={color} strokeWidth={2.5} />
  );

  // Midpoint for distance label
  const midpoint = otherLocation
    ? {
        latitude: (myLocation.lat + otherLocation.lat) / 2,
        longitude: (myLocation.lon + otherLocation.lon) / 2,
      }
    : null;

  const mapContent = (isFullscreen: boolean) => (
    <>
      <MapView
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        mapType="mutedStandard"
        region={region}
        showsUserLocation={false}
        showsMyLocationButton={false}
        zoomEnabled={true}
        scrollEnabled={true}
      >
        {/* My Location Marker */}
        <Marker
          coordinate={{
            latitude: myLocation.lat,
            longitude: myLocation.lon,
          }}
          anchor={{ x: 0.5, y: 1 }}
          onPress={() => handleMarkerPress("me")}
        >
          <CustomMarker color="#007AFF" />
        </Marker>

        {/* Partner Location Marker + Polyline + Distance label */}
        {otherLocation && (
          <>
            <Marker
              coordinate={{
                latitude: otherLocation.lat,
                longitude: otherLocation.lon,
              }}
              anchor={{ x: 0.5, y: 1 }}
              onPress={() => handleMarkerPress("partner")}
            >
              <CustomMarker color="#FF5E5E" />
            </Marker>

            {/* Dashed line between markers */}
            <Polyline
              coordinates={[
                { latitude: myLocation.lat, longitude: myLocation.lon },
                { latitude: otherLocation.lat, longitude: otherLocation.lon },
              ]}
              strokeColor="rgba(99,102,241,0.35)"
              strokeWidth={1.2}
              lineDashPattern={[6, 5]}
            />

            {/* Distance label at midpoint */}
            {midpoint && (
              <Marker
                coordinate={midpoint}
                anchor={{ x: 0.5, y: 0.5 }}
                tracksViewChanges={false}
              >
                <View style={styles.distanceBubble}>
                  <Text style={styles.distanceBubbleText}>
                    {distanceText}
                  </Text>
                </View>
              </Marker>
            )}
          </>
        )}
      </MapView>

      {/* Expand / Collapse button */}
      <TouchableOpacity
        style={[styles.expandBtn, { backgroundColor: theme.colorCard + "E6" }]}
        onPress={() => setFullscreen(!isFullscreen)}
        activeOpacity={0.7}
      >
        {isFullscreen ? (
          <Minimize2 size={18} color={theme.colorForeground} />
        ) : (
          <Maximize2 size={18} color={theme.colorForeground} />
        )}
      </TouchableOpacity>

      {/* Pin Info Card overlay */}
      {selectedPin && (
        <PinInfoCard
          data={selectedPin}
          onClose={() => setSelectedPin(null)}
        />
      )}
    </>
  );

  return (
    <>
      <View style={[styles.container, { backgroundColor: theme.colorSecondary }]}>
        {mapContent(false)}
      </View>

      <Modal
        visible={fullscreen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setFullscreen(false)}
      >
        <SafeAreaView style={[styles.fullscreenContainer, { backgroundColor: theme.colorBackground }]}>
          <View style={styles.fullscreenMap}>
            {mapContent(true)}
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    minHeight: 160,
    justifyContent: "center",
    alignItems: "center",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  errorText: {
    fontSize: 12,
    marginTop: 8,
  },
  distanceBubble: {
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  distanceBubbleText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6366F1",
  },
  expandBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  fullscreenContainer: {
    flex: 1,
  },
  fullscreenMap: {
    flex: 1,
  },
});
