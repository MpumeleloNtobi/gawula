export type NearbyShop = {
  name: string;
  logoText: string;
  logoColor: string;
  logoUrl: string;
  badge?: string;
  coordinates: { lat: number; lng: number };
  popularity: number;
  area: string;
};

export const SHOPS_NEAR_YOU: NearbyShop[] = [
  { name: "Woolworths Foodstop", logoText: "W",    logoColor: "#111111", logoUrl: "https://tb-static.uber.com/prod/image-proc/processed_images/8afaa06be6ac16c9db21645160262082/a3a76b0a0c26aa379cf413f8c825764f.png",  coordinates: { lat: -26.1450, lng: 28.0420 }, popularity: 10, area: "Rosebank" },
  { name: "Spar",                logoText: "SPAR", logoColor: "#007a3d", logoUrl: "https://tb-static.uber.com/prod/image-proc/processed_images/f988cd34d6e6017827397fe8a7d67146/c3ac94fc1809fad838eecc532a15cdbe.png",  coordinates: { lat: -26.1465, lng: 28.0405 }, popularity: 5,  area: "Rosebank" },
  { name: "CityFuel",            logoText: "CF",   logoColor: "#ff6600", logoUrl: "https://tb-static.uber.com/prod/image-proc/processed_images/5ba095f3e26389b402ce4920a00a99f3/c3ac94fc1809fad838eecc532a15cdbe.jpeg", coordinates: { lat: -26.1095, lng: 28.0555 }, popularity: 3,  area: "Sandton" },
  { name: "Yassir Express",      logoText: "YE",   logoColor: "#7b2d8b", logoUrl: "https://tb-static.uber.com/prod/image-proc/processed_images/beb75eb06130ad6cd7feb864ed3bf4fa/c3ac94fc1809fad838eecc532a15cdbe.jpeg", badge: "R30 off", coordinates: { lat: -26.1080, lng: 28.0560 }, popularity: 6, area: "Sandton" },
  { name: "TOPS at SPAR",        logoText: "TOPS", logoColor: "#a61222", logoUrl: "https://tb-static.uber.com/prod/image-proc/processed_images/9eb1381f9042369ace7a33d629993cbd/c3ac94fc1809fad838eecc532a15cdbe.png",  coordinates: { lat: -26.1462, lng: 28.0408 }, popularity: 4,  area: "Rosebank" },
  { name: "Liquor City",         logoText: "LC",   logoColor: "#003087", logoUrl: "https://tb-static.uber.com/prod/image-proc/processed_images/9538f91f9392fe20148dd312c6790c55/c3ac94fc1809fad838eecc532a15cdbe.jpeg", badge: "New", coordinates: { lat: -26.1100, lng: 28.0545 }, popularity: 5, area: "Sandton" },
  { name: "Blue Bottle Liquors", logoText: "BB",   logoColor: "#00538f", logoUrl: "https://tb-static.uber.com/prod/image-proc/processed_images/cfb5fc813b623f3c31eae5b1f76d5f93/e9e11c5f13560a3ff4e36d2afc8d81ea.jpeg", coordinates: { lat: -26.1090, lng: 28.0570 }, popularity: 3, area: "Sandton" },
  { name: "Uber Eats Market",    logoText: "UE",   logoColor: "#06c167", logoUrl: "https://tb-static.uber.com/prod/image-proc/processed_images/74753f1ab8e756a5b60abdd8f5375fa3/cdbf718e74f23061854f430977faed8b.png",  coordinates: { lat: -26.0145, lng: 28.1100 }, popularity: 4,  area: "Waterfall" },
  { name: "Engen Quickshop",     logoText: "EQ",   logoColor: "#f7941d", logoUrl: "https://tb-static.uber.com/prod/image-proc/processed_images/7d8432c74b1af3d4d30a42b1fefeb22e/c3ac94fc1809fad838eecc532a15cdbe.jpeg", coordinates: { lat: -26.0160, lng: 28.1075 }, popularity: 9, area: "Waterfall" },
  { name: "Over The Counter",    logoText: "OTC",  logoColor: "#1a1a1a", logoUrl: "https://tb-static.uber.com/prod/image-proc/processed_images/857335b6957c0785db730e9f4bf63d3d/16d71f1e5663400ba5e01a535ed086de.jpeg", coordinates: { lat: -26.0165, lng: 28.1090 }, popularity: 3, area: "Waterfall" },
  { name: "Butcher's Bike",      logoText: "BB",   logoColor: "#c0392b", logoUrl: "https://tb-static.uber.com/prod/image-proc/processed_images/f48c7fe9ee281c89b982b6384376fae3/c9252e6c6cd289c588c3381bc77b1dfc.jpeg", coordinates: { lat: -26.0170, lng: 28.1080 }, popularity: 5, area: "Waterfall" },
];

export const CLUSTER_RADIUS_KM = 1.5;
export const CLUSTER_ANCHOR_COUNT = 4;

export type ShopCluster = {
  id: string;
  anchor: NearbyShop;
  members: NearbyShop[];
  radiusKm: number;
};

function distanceKm(a: NearbyShop["coordinates"], b: NearbyShop["coordinates"]): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function buildShopClusters(
  shops: NearbyShop[] = SHOPS_NEAR_YOU,
  radiusKm: number = CLUSTER_RADIUS_KM,
  anchorCount: number = CLUSTER_ANCHOR_COUNT,
): ShopCluster[] {
  const anchors = [...shops]
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, anchorCount);

  return anchors
    .map((anchor) => {
      const members = shops.filter(
        (shop) => shop.name !== anchor.name && distanceKm(anchor.coordinates, shop.coordinates) <= radiusKm,
      );
      return {
        id: `cluster-${anchor.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        anchor,
        members,
        radiusKm,
      };
    })
    .filter((cluster) => cluster.members.length > 0);
}

export function shopSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getNearbyShopBySlug(slug: string): NearbyShop | undefined {
  return SHOPS_NEAR_YOU.find((shop) => shopSlug(shop.name) === slug);
}
