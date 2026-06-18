"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { LuCheck as Check, LuChevronDown as ChevronDown, LuChevronLeft as ChevronLeft, LuChevronRight as ChevronRight, LuCoffee as Coffee, LuFlame as Flame, LuHeart as Heart, LuHeart as HeartFilled, LuMapPin as MapPin, LuMoon as Moon, LuSearch as Search, LuStar as Star, LuStar as StarOutline, LuTag as Tag, LuUtensilsCrossed as UtensilsCrossed, LuX as X } from "react-icons/lu";
import { LuBeef as Beef, LuCakeSlice as CakeSlice, LuCookingPot as CookingPot, LuCupSoda as CupSoda, LuDrumstick as Drumstick, LuFish as Fish, LuSandwich as Hamburger, LuLeaf as Leaf, LuMedal as Medal, LuMilk as Milk, LuPizza as Pizza, LuSalad as Salad, LuSoup as Soup, LuSprout as Sprout, LuUtensils as Utensils, LuWheat as Wheat } from "react-icons/lu";
import type { IconType } from "react-icons";
import { FloatingContactButton } from "@/components/floating-contact-button";
import { NearbyShopLogo } from "@/components/nearby-shop";
import { StoreLogo } from "@/components/store-logo";
import { WalkingPickupIcon } from "@/components/walking-pickup-icon";
import { LoadingDots } from "@/components/ui/loading-dots";
import { SHOPS_NEAR_YOU, buildShopClusters, shopSlug } from "@/components/nearby-shop-data";

const SHOP_CLUSTERS = buildShopClusters();
import { cartBrandIds, deliveryQuoteForBrandIds, deliveryQuoteForLines, useCart } from "@/lib/cart-store";
import { BRANDS, FULFILLMENT_ROUTES, HUBS, STORE_LOCATIONS, getBrandLocation } from "@/lib/mock-data";
import { cn, formatPrice } from "@/lib/utils";

const DELIVERY_LOCATIONS = [
  { hubId: "rosebank", name: "Erand Creek Estate", address: "14th rd, Johannesburg Ward 112, GT, 1687, ZA" },
  { hubId: "sandton", name: "Sandton Central", address: "West Street, Sandton, Johannesburg, GT, 2196, ZA" },
  { hubId: "melville", name: "Melville Village", address: "7th Street, Melville, Johannesburg, GT, 2092, ZA" },
  { hubId: "parkhurst", name: "Parkhurst", address: "4th Avenue, Parkhurst, Johannesburg, GT, 2193, ZA" },
];

const CUISINES: { name: string; Icon: IconType }[] = [
  { name: "Burgers", Icon: Hamburger },
  { name: "Chicken", Icon: Drumstick },
  { name: "Pizza", Icon: Pizza },
  { name: "Bowls", Icon: Leaf },
  { name: "Salads", Icon: Salad },
  { name: "Vegetarian", Icon: Sprout },
  { name: "Soup", Icon: Soup },
  { name: "Noodles", Icon: CookingPot },
  { name: "Seafood", Icon: Fish },
  { name: "Asian", Icon: Utensils },
  { name: "Grills", Icon: Beef },
  { name: "Bakery", Icon: Wheat },
  { name: "Spicy", Icon: Flame },
  { name: "Sides", Icon: UtensilsCrossed },
  { name: "Shakes", Icon: Milk },
  { name: "Drinks", Icon: CupSoda },
  { name: "Coffee", Icon: Coffee },
  { name: "Desserts", Icon: CakeSlice },
];

type FilterKey = "offers" | "deliveryFee" | "highestRated" | "rating" | "sort" | "bundleType";
type FilterPopup = "rating" | "sort" | "bundleType";
type RatingFilter = "any" | "3" | "3.5" | "4" | "4.5" | "5";
type SortMode = "recommended" | "rating";
type BundleType = "mall" | "complex" | "cluster";
const FILTERS: { key: FilterKey; label: string; Icon?: IconType; trailing?: boolean }[] = [
  { key: "offers", label: "Offers", Icon: Tag },
  { key: "deliveryFee", label: "Delivery fee" },
  { key: "highestRated", label: "Highest rated", Icon: Medal },
  { key: "rating", label: "Rating", Icon: StarOutline, trailing: true },
  { key: "sort", label: "Sort", trailing: true },
  { key: "bundleType", label: "Bundle type", trailing: true },
];

const RATING_OPTIONS: { value: RatingFilter; label: string }[] = [
  { value: "3", label: "3+" },
  { value: "3.5", label: "3.5+" },
  { value: "4", label: "4+" },
  { value: "4.5", label: "4.5+" },
  { value: "5", label: "5" },
];

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "recommended", label: "Recommended" },
  { value: "rating", label: "Rating" },
];

const BUNDLE_TYPE_OPTIONS: { value: BundleType; label: string }[] = [
  { value: "mall", label: "Mall" },
  { value: "complex", label: "Complex" },
  { value: "cluster", label: "Cluster" },
];

const CATEGORY_TERMS: Record<string, string[]> = {
  Burgers: ["burger", "smash", "patty"],
  Chicken: ["chicken"],
  Pizza: ["pizza", "margherita", "pepperoni", "funghi", "prosciutto"],
  Bowls: ["bowl", "grain", "buddha", "quinoa", "poke"],
  Salads: ["salad", "caesar", "romaine", "greens"],
  Vegetarian: ["vegetarian", "vegan", "pumpkin", "mushroom", "margherita", "edamame"],
  Soup: ["soup", "broth", "ramen"],
  Noodles: ["noodle", "ramen", "yakisoba"],
  Seafood: ["salmon", "poke"],
  Asian: ["ramen", "yakisoba", "gyoza", "bao", "edamame", "miso", "tonkotsu", "yuzu"],
  Grills: ["flame", "grill", "smash", "burger", "chicken"],
  Bakery: ["focaccia", "sourdough", "bun", "toast", "bread"],
  Spicy: ["spicy", "chilli", "pepperoni", "miso"],
  Sides: ["fries", "rings", "gyoza", "edamame", "focaccia"],
  Shakes: ["shake", "milk"],
  Drinks: ["juice", "drink", "shake"],
  Coffee: ["espresso", "coffee", "tiramisu"],
  Desserts: ["dessert", "tiramisu", "caramel", "shake", "shortbread"],
};

type RestaurantResult = {
  id: string;
  name: string;
  area: string;
  cuisines: string[];
  routeBrandId: string;
  rating: number;
  ratingCount: number;
  deliveryFee: number;
  etaMinutes: [number, number];
  offer?: string;
  pickup?: boolean;
  closed?: boolean;
  distanceKm?: number;
};

const RESTAURANT_RESULTS: RestaurantResult[] = [
  {
    id: "woolworths-foodstop-midway-mews",
    name: "Woolworths Foodstop Engen Midway Mews",
    area: "Midrand",
    cuisines: ["Coffee", "Bakery", "Sides"],
    routeBrandId: "harvest",
    rating: 4.7,
    ratingCount: 1500,
    deliveryFee: 2900,
    etaMinutes: [20, 35],
  },
  {
    id: "yassir-express-midrand",
    name: "Yassir Express, Midrand",
    area: "Midrand",
    cuisines: ["Chicken", "Burgers", "Spicy"],
    routeBrandId: "ember",
    rating: 4.4,
    ratingCount: 7000,
    deliveryFee: 3500,
    etaMinutes: [25, 40],
    offer: "2 Offers available",
  },
  {
    id: "bw-sandton",
    name: "B&W, Sandton",
    area: "Sandton",
    cuisines: ["Burgers", "Chicken", "Sides"],
    routeBrandId: "ember",
    rating: 4.3,
    ratingCount: 87,
    deliveryFee: 3900,
    etaMinutes: [25, 45],
    offer: "Save on selected items",
  },
  {
    id: "dinerboyz-sandton",
    name: "Dinerboyz, Sandton",
    area: "Sandton",
    cuisines: ["Burgers", "Chicken", "Grills"],
    routeBrandId: "ember",
    rating: 4.3,
    ratingCount: 800,
    deliveryFee: 3900,
    etaMinutes: [30, 45],
    offer: "Save on selected items",
  },
  {
    id: "bw-waterfall",
    name: "B&W Waterfall",
    area: "Waterfall",
    cuisines: ["Burgers", "Chicken", "Sides"],
    routeBrandId: "ember",
    rating: 4.6,
    ratingCount: 440,
    deliveryFee: 2900,
    etaMinutes: [20, 35],
    offer: "Save on selected items",
  },
  {
    id: "mongkok-chinese-restaurant",
    name: "Mongkok Chinese Restaurant",
    area: "Johannesburg",
    cuisines: ["Asian", "Noodles", "Soup"],
    routeBrandId: "noodlebar",
    rating: 4.5,
    ratingCount: 3000,
    deliveryFee: 4500,
    etaMinutes: [35, 50],
    offer: "Free item (spend R 200)",
    pickup: true,
    closed: true,
    distanceKm: 18.5,
  },
  {
    id: "hao-ke-lai-linden",
    name: "Hao Ke lai, Linden",
    area: "Linden",
    cuisines: ["Asian", "Noodles", "Soup"],
    routeBrandId: "noodlebar",
    rating: 4.6,
    ratingCount: 3000,
    deliveryFee: 4900,
    etaMinutes: [40, 55],
    pickup: true,
    distanceKm: 22.5,
  },
  {
    id: "good-flavour-chinese-randburg",
    name: "Good Flavour Chinese, Randburg",
    area: "Randburg",
    cuisines: ["Asian", "Noodles", "Soup"],
    routeBrandId: "noodlebar",
    rating: 4.6,
    ratingCount: 1000,
    deliveryFee: 4900,
    etaMinutes: [40, 60],
    offer: "Top offer • Buy 1 get 1 free",
    pickup: true,
    distanceKm: 25.1,
  },
  {
    id: "exclusive-stick-kebabs-randburg",
    name: "Exclusive Stick Kebabs Randburg",
    area: "Randburg",
    cuisines: ["Grills", "Chicken", "Spicy"],
    routeBrandId: "ember",
    rating: 4.0,
    ratingCount: 110,
    deliveryFee: 4500,
    etaMinutes: [35, 55],
    offer: "Save on selected items",
    pickup: true,
    distanceKm: 18.2,
  },
  {
    id: "relish-deluxe",
    name: "Relish Deluxe",
    area: "Sandton",
    cuisines: ["Burgers", "Grills", "Chicken"],
    routeBrandId: "ember",
    rating: 4.3,
    ratingCount: 600,
    deliveryFee: 3900,
    etaMinutes: [30, 45],
    pickup: true,
    distanceKm: 21.8,
  },
  {
    id: "daves-burgers-randburg",
    name: "Dave's Burgers Randburg",
    area: "Randburg",
    cuisines: ["Burgers", "Grills", "Sides"],
    routeBrandId: "ember",
    rating: 4.5,
    ratingCount: 900,
    deliveryFee: 3900,
    etaMinutes: [35, 50],
  },
  {
    id: "kota-joe-midrand",
    name: "Kota Joe, Midrand",
    area: "Midrand",
    cuisines: ["Burgers", "Chicken", "Sides"],
    routeBrandId: "ember",
    rating: 4.4,
    ratingCount: 1200,
    deliveryFee: 2900,
    etaMinutes: [25, 35],
    offer: "Combo deals available",
  },
  {
    id: "chicken-licken-midrand",
    name: "Chicken Licken, Midrand",
    area: "Midrand",
    cuisines: ["Chicken", "Spicy", "Sides"],
    routeBrandId: "ember",
    rating: 4.2,
    ratingCount: 5000,
    deliveryFee: 2500,
    etaMinutes: [20, 35],
  },
  {
    id: "steers-carlswald",
    name: "Steers, Carlswald",
    area: "Carlswald",
    cuisines: ["Burgers", "Grills", "Sides"],
    routeBrandId: "ember",
    rating: 4.4,
    ratingCount: 2000,
    deliveryFee: 2900,
    etaMinutes: [20, 35],
    offer: "Save on selected items",
  },
  {
    id: "nandos-waterfall",
    name: "Nando's Waterfall",
    area: "Waterfall",
    cuisines: ["Chicken", "Grills", "Spicy"],
    routeBrandId: "ember",
    rating: 4.6,
    ratingCount: 6000,
    deliveryFee: 2900,
    etaMinutes: [20, 35],
  },
  {
    id: "fishaways-sandton",
    name: "Fishaways, Sandton",
    area: "Sandton",
    cuisines: ["Seafood", "Sides"],
    routeBrandId: "harvest",
    rating: 4.3,
    ratingCount: 900,
    deliveryFee: 3500,
    etaMinutes: [25, 40],
  },
  {
    id: "ocean-basket-mall-of-africa",
    name: "Ocean Basket, Mall of Africa",
    area: "Waterfall",
    cuisines: ["Seafood", "Grills"],
    routeBrandId: "harvest",
    rating: 4.5,
    ratingCount: 2500,
    deliveryFee: 3500,
    etaMinutes: [30, 45],
    pickup: true,
    distanceKm: 7.4,
  },
  {
    id: "debonairs-pizza-midrand",
    name: "Debonairs Pizza, Midrand",
    area: "Midrand",
    cuisines: ["Pizza"],
    routeBrandId: "dough",
    rating: 4.2,
    ratingCount: 3000,
    deliveryFee: 2500,
    etaMinutes: [20, 35],
    offer: "2 Offers available",
  },
  {
    id: "romans-pizza-halfway-house",
    name: "Romans Pizza, Halfway House",
    area: "Halfway House",
    cuisines: ["Pizza"],
    routeBrandId: "dough",
    rating: 4.4,
    ratingCount: 2200,
    deliveryFee: 2500,
    etaMinutes: [20, 35],
  },
  {
    id: "panarottis-sandton",
    name: "Panarottis, Sandton",
    area: "Sandton",
    cuisines: ["Pizza", "Desserts"],
    routeBrandId: "dough",
    rating: 4.1,
    ratingCount: 760,
    deliveryFee: 3900,
    etaMinutes: [30, 45],
  },
  {
    id: "kauai-mall-of-africa",
    name: "Kauai, Mall of Africa",
    area: "Waterfall",
    cuisines: ["Salads", "Bowls", "Vegetarian"],
    routeBrandId: "harvest",
    rating: 4.6,
    ratingCount: 1800,
    deliveryFee: 2900,
    etaMinutes: [20, 35],
  },
  {
    id: "simply-asia-sunninghill",
    name: "Simply Asia, Sunninghill",
    area: "Sunninghill",
    cuisines: ["Asian", "Noodles", "Spicy"],
    routeBrandId: "noodlebar",
    rating: 4.4,
    ratingCount: 1400,
    deliveryFee: 3900,
    etaMinutes: [30, 45],
  },
  {
    id: "saigon-suzy-cedar-square",
    name: "Saigon Suzy, Cedar Square",
    area: "Fourways",
    cuisines: ["Asian", "Noodles", "Chicken"],
    routeBrandId: "noodlebar",
    rating: 4.5,
    ratingCount: 1300,
    deliveryFee: 4500,
    etaMinutes: [35, 55],
    pickup: true,
    distanceKm: 14.8,
  },
  {
    id: "mugg-and-bean-midrand",
    name: "Mugg & Bean, Midrand",
    area: "Midrand",
    cuisines: ["Coffee", "Bakery", "Burgers"],
    routeBrandId: "harvest",
    rating: 4.5,
    ratingCount: 2100,
    deliveryFee: 2900,
    etaMinutes: [20, 35],
  },
  {
    id: "seattle-coffee-waterfall",
    name: "Seattle Coffee Co, Waterfall",
    area: "Waterfall",
    cuisines: ["Coffee", "Bakery"],
    routeBrandId: "harvest",
    rating: 4.8,
    ratingCount: 950,
    deliveryFee: 2500,
    etaMinutes: [15, 30],
  },
  {
    id: "krispy-kreme-mall-of-africa",
    name: "Krispy Kreme, Mall of Africa",
    area: "Waterfall",
    cuisines: ["Desserts", "Coffee"],
    routeBrandId: "dough",
    rating: 4.7,
    ratingCount: 1100,
    deliveryFee: 2500,
    etaMinutes: [20, 35],
    offer: "Save on selected items",
  },
  {
    id: "rocomamas-mall-of-africa",
    name: "RocoMamas, Mall of Africa",
    area: "Waterfall",
    cuisines: ["Burgers", "Grills", "Shakes"],
    routeBrandId: "ember",
    rating: 4.5,
    ratingCount: 4200,
    deliveryFee: 3500,
    etaMinutes: [25, 40],
  },
  {
    id: "fish-and-chip-co-randburg",
    name: "The Fish & Chip Co, Randburg",
    area: "Randburg",
    cuisines: ["Seafood", "Sides"],
    routeBrandId: "harvest",
    rating: 4.1,
    ratingCount: 700,
    deliveryFee: 4500,
    etaMinutes: [35, 55],
    pickup: true,
    distanceKm: 19.6,
  },
  {
    id: "pedros-chicken-midrand",
    name: "Pedros Chicken, Midrand",
    area: "Midrand",
    cuisines: ["Chicken", "Grills", "Spicy"],
    routeBrandId: "ember",
    rating: 4.4,
    ratingCount: 1600,
    deliveryFee: 2500,
    etaMinutes: [20, 35],
    offer: "Free item (spend R 150)",
  },
  {
    id: "galitos-sandton",
    name: "Galito's, Sandton",
    area: "Sandton",
    cuisines: ["Chicken", "Grills", "Spicy"],
    routeBrandId: "ember",
    rating: 4.3,
    ratingCount: 850,
    deliveryFee: 3500,
    etaMinutes: [25, 40],
  },
  {
    id: "mochachos-randburg",
    name: "Mochachos, Randburg",
    area: "Randburg",
    cuisines: ["Chicken", "Burgers", "Spicy"],
    routeBrandId: "ember",
    rating: 4.2,
    ratingCount: 1000,
    deliveryFee: 4500,
    etaMinutes: [35, 55],
  },
  {
    id: "anat-sandton",
    name: "Anat, Sandton City",
    area: "Sandton",
    cuisines: ["Grills", "Vegetarian", "Sides"],
    routeBrandId: "harvest",
    rating: 4.2,
    ratingCount: 900,
    deliveryFee: 3900,
    etaMinutes: [30, 45],
  },
  {
    id: "momo-kuro-rosebank",
    name: "Momo Kuro, Rosebank",
    area: "Rosebank",
    cuisines: ["Asian", "Noodles", "Vegetarian"],
    routeBrandId: "noodlebar",
    rating: 4.7,
    ratingCount: 1200,
    deliveryFee: 4500,
    etaMinutes: [35, 50],
    pickup: true,
    distanceKm: 17.2,
  },
  {
    id: "lexis-healthy-eatery-sandton",
    name: "Lexi's Healthy Eatery, Sandton",
    area: "Sandton",
    cuisines: ["Vegetarian", "Salads", "Bowls"],
    routeBrandId: "harvest",
    rating: 4.6,
    ratingCount: 950,
    deliveryFee: 3900,
    etaMinutes: [30, 45],
  },
  {
    id: "green-peppercorn-morningside",
    name: "The Green Peppercorn, Morningside",
    area: "Morningside",
    cuisines: ["Grills", "Seafood", "Salads"],
    routeBrandId: "harvest",
    rating: 4.5,
    ratingCount: 680,
    deliveryFee: 4500,
    etaMinutes: [35, 55],
  },
  {
    id: "calistos-portuguese-gillview",
    name: "Calisto's Portuguese, Gillview",
    area: "Gillview",
    cuisines: ["Chicken", "Seafood", "Grills"],
    routeBrandId: "ember",
    rating: 4.4,
    ratingCount: 1900,
    deliveryFee: 4900,
    etaMinutes: [40, 60],
    pickup: true,
    distanceKm: 24.8,
  },
  {
    id: "soul-souvlaki-sandton",
    name: "Soul Souvlaki, Sandton",
    area: "Sandton",
    cuisines: ["Grills", "Vegetarian", "Chicken"],
    routeBrandId: "harvest",
    rating: 4.6,
    ratingCount: 1100,
    deliveryFee: 3900,
    etaMinutes: [30, 45],
  },
  {
    id: "akhalz-midrand",
    name: "Akhalz, Midrand",
    area: "Midrand",
    cuisines: ["Burgers", "Grills", "Spicy"],
    routeBrandId: "ember",
    rating: 4.3,
    ratingCount: 1700,
    deliveryFee: 2900,
    etaMinutes: [25, 40],
    offer: "Save on selected items",
  },
  {
    id: "honchos-tembisa",
    name: "Honchos, Tembisa",
    area: "Tembisa",
    cuisines: ["Chicken", "Grills", "Spicy"],
    routeBrandId: "ember",
    rating: 4.1,
    ratingCount: 1300,
    deliveryFee: 3900,
    etaMinutes: [30, 50],
  },
  {
    id: "pizza-perfect-lonehill",
    name: "Pizza Perfect, Lonehill",
    area: "Lonehill",
    cuisines: ["Pizza"],
    routeBrandId: "dough",
    rating: 4.4,
    ratingCount: 900,
    deliveryFee: 3900,
    etaMinutes: [30, 45],
  },
  {
    id: "fego-caffe-sandton",
    name: "Fego Caffe, Sandton",
    area: "Sandton",
    cuisines: ["Coffee", "Bakery", "Desserts"],
    routeBrandId: "harvest",
    rating: 4.4,
    ratingCount: 720,
    deliveryFee: 3500,
    etaMinutes: [25, 40],
  },
  {
    id: "bootlegger-coffee-bryanston",
    name: "Bootlegger Coffee, Bryanston",
    area: "Bryanston",
    cuisines: ["Coffee", "Bakery"],
    routeBrandId: "harvest",
    rating: 4.6,
    ratingCount: 840,
    deliveryFee: 3900,
    etaMinutes: [30, 45],
  },
  {
    id: "andiccio24-waterfall",
    name: "Andiccio24, Waterfall",
    area: "Waterfall",
    cuisines: ["Pizza"],
    routeBrandId: "dough",
    rating: 4.5,
    ratingCount: 2000,
    deliveryFee: 2900,
    etaMinutes: [20, 35],
    offer: "Buy 1 get 1 free",
  },
  {
    id: "fishmonger-sandton",
    name: "The Fishmonger, Sandton",
    area: "Sandton",
    cuisines: ["Seafood", "Grills"],
    routeBrandId: "harvest",
    rating: 4.6,
    ratingCount: 1200,
    deliveryFee: 4500,
    etaMinutes: [35, 50],
  },
  {
    id: "the-baron-woodmead",
    name: "The Baron, Woodmead",
    area: "Woodmead",
    cuisines: ["Grills", "Burgers", "Salads"],
    routeBrandId: "ember",
    rating: 4.5,
    ratingCount: 1400,
    deliveryFee: 3900,
    etaMinutes: [30, 45],
  },
  {
    id: "piza-e-vino-waterfall",
    name: "Piza e Vino, Waterfall",
    area: "Waterfall",
    cuisines: ["Pizza", "Salads"],
    routeBrandId: "dough",
    rating: 4.6,
    ratingCount: 1600,
    deliveryFee: 3500,
    etaMinutes: [25, 40],
  },
  {
    id: "adega-express-midrand",
    name: "Adega Express, Midrand",
    area: "Midrand",
    cuisines: ["Chicken", "Seafood", "Grills"],
    routeBrandId: "ember",
    rating: 4.3,
    ratingCount: 760,
    deliveryFee: 3500,
    etaMinutes: [25, 40],
  },
  {
    id: "milky-lane-sandton",
    name: "Milky Lane, Sandton",
    area: "Sandton",
    cuisines: ["Desserts", "Shakes"],
    routeBrandId: "dough",
    rating: 4.4,
    ratingCount: 980,
    deliveryFee: 3900,
    etaMinutes: [30, 45],
    offer: "Save on selected items",
  },
];

function restaurantText(restaurant: RestaurantResult) {
  return [restaurant.name, restaurant.area, restaurant.offer, ...restaurant.cuisines]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function restaurantMatchesCategory(category: string, restaurant: RestaurantResult) {
  const terms = CATEGORY_TERMS[category] ?? [category.toLowerCase()];
  const text = restaurantText(restaurant);
  return restaurant.cuisines.includes(category) || terms.some((term) => text.includes(term));
}

function getRestaurantCover(routeBrandId: string) {
  return BRANDS.find((brand) => brand.id === routeBrandId)?.cover ?? BRANDS[0].cover;
}

function getRestaurantLogo(restaurant: RestaurantResult) {
  const cleanName = restaurant.name.split(",")[0].replace(/^the\s+/i, "").trim();
  const initials = cleanName.includes("&")
    ? cleanName.slice(0, 3).toUpperCase()
    : cleanName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0])
        .join("")
        .toUpperCase();
  const color = BRANDS.find((brand) => brand.id === restaurant.routeBrandId)?.logoColor ?? "#111111";
  const logoUrl = BRANDS.find((brand) => brand.id === restaurant.routeBrandId)?.logoUrl;
  return { initials, color, logoUrl };
}

function formatRatingCount(count: number) {
  return `(${new Intl.NumberFormat("en-US").format(count)}${count >= 100 ? "+" : ""})`;
}

function formatDistance(distanceKm: number) {
  return `${distanceKm.toFixed(1).replace(".", ",")} km`;
}

function ratingFilterLabel(filter: RatingFilter) {
  if (filter === "any") return "Any rating";
  return RATING_OPTIONS.find((option) => option.value === filter)?.label ?? "Rating";
}

function ratingMatchesFilter(rating: number, filter: RatingFilter) {
  if (filter === "any") return true;
  return rating >= Number(filter);
}

function readSearchQuery() {
  return new URLSearchParams(window.location.search).get("q")?.trim() ?? "";
}

const LOCATION_DISTANCE_KM: Record<string, number> = {
  "mall-of-africa-food-court": 4.2,
  "waterfall-corner": 3.1,
  "the-zone-rosebank": 8.6,
};

const SERVICE_RADIUS_KM = 30;

const LOCATION_TILES = STORE_LOCATIONS.map((location) => {
  const brands = BRANDS.filter((brand) => brand.storeLocationId === location.id);
  const restaurantCount = RESTAURANT_RESULTS.filter((restaurant) =>
    brands.some((brand) => brand.id === restaurant.routeBrandId),
  ).length;
  const cover = brands[0]?.cover ?? BRANDS[0].cover;
  const route = FULFILLMENT_ROUTES.find((r) => location.routeIds.includes(r.id));
  const sharedLocationIds = route ? route.locationIds.filter((id) => id !== location.id) : [];
  const sharedLocationNames = sharedLocationIds
    .map((id) => STORE_LOCATIONS.find((l) => l.id === id)?.name)
    .filter((name): name is string => Boolean(name));
  const typeLabel = location.type === "mall" ? "Mall" : location.type === "complex" ? "Complex" : "Cluster";
  const distanceKm = LOCATION_DISTANCE_KM[location.id] ?? 0;
  return {
    location,
    brands,
    restaurantCount,
    cover,
    typeLabel,
    sharedLocationNames,
    distanceKm,
  };
}).sort((a, b) => a.distanceKm - b.distanceKm);

function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export default function MenuPage() {
  const cartLines = useCart((s) => s.lines);
  const hubId = useCart((s) => s.hub);
  const setHub = useCart((s) => s.setHub);
  const address = useCart((s) => s.address);
  const coords = useCart((s) => s.coords);
  const cartHydrated = useCart((s) => s.hydrated);
  const [mobileFulfillment, setMobileFulfillment] = React.useState<"delivery" | "pickup">("delivery");
  const [fulfillmentMenuOpen, setFulfillmentMenuOpen] = React.useState(false);
  const [fulfillmentDraft, setFulfillmentDraft] = React.useState<"delivery" | "pickup">("delivery");
  const [locationSheetOpen, setLocationSheetOpen] = React.useState(false);
  const categoryScrollerRef = React.useRef<HTMLDivElement>(null);
  const bundleScrollerRef = React.useRef<HTMLDivElement>(null);
  const storeScrollerRef = React.useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [categoryScroll, setCategoryScroll] = React.useState({
    canScrollLeft: false,
    canScrollRight: false,
  });
  const [bundleScroll, setBundleScroll] = React.useState({
    canScrollLeft: false,
    canScrollRight: false,
  });
  const [storeScroll, setStoreScroll] = React.useState({
    canScrollLeft: false,
    canScrollRight: false,
  });
  const [activeCategory, setActiveCategory] = React.useState<string | null>(null);
  const [activeLocationId, setActiveLocationId] = React.useState<string | null>(null);
  const [activeFilters, setActiveFilters] = React.useState<FilterKey[]>([]);
  const [sortMode, setSortMode] = React.useState<SortMode>("recommended");
  const [ratingFilter, setRatingFilter] = React.useState<RatingFilter>("any");
  const [draftSortMode, setDraftSortMode] = React.useState<SortMode>("recommended");
  const [draftRatingFilter, setDraftRatingFilter] = React.useState<RatingFilter>("any");
  const [bundleTypeFilter, setBundleTypeFilter] = React.useState<BundleType[]>([]);
  const [draftBundleTypeFilter, setDraftBundleTypeFilter] = React.useState<BundleType[]>([]);
  const [activePopup, setActivePopup] = React.useState<FilterPopup | null>(null);
  const [popupPosition, setPopupPosition] = React.useState<{ top: number; left: number } | null>(null);
  const [likedRestaurants, setLikedRestaurants] = React.useState<Set<string>>(() => new Set());
  const filterPopupRef = React.useRef<HTMLDivElement>(null);

  const origin = React.useMemo(() => {
    const hubCoords = hubId ? HUBS.find((hub) => hub.id === hubId)?.coordinates ?? null : null;
    return hubCoords ?? coords;
  }, [hubId, coords]);

  const locationTiles = React.useMemo(() => {
    if (!origin) {
      return LOCATION_TILES.map((tile) => ({ ...tile, distanceKm: null as number | null }));
    }
    return LOCATION_TILES.map((tile) => {
      const d = haversineKm(origin, tile.location.coordinates);
      return { ...tile, distanceKm: (d <= SERVICE_RADIUS_KM ? d : null) as number | null };
    }).sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
  }, [origin]);

  const updateCategoryScroll = React.useCallback(() => {
    const scroller = categoryScrollerRef.current;
    if (!scroller) return;
    const maxScrollLeft = scroller.scrollWidth - scroller.clientWidth;
    setCategoryScroll({
      canScrollLeft: scroller.scrollLeft > 2,
      canScrollRight: scroller.scrollLeft < maxScrollLeft - 2,
    });
  }, []);

  const updateBundleScroll = React.useCallback(() => {
    const scroller = bundleScrollerRef.current;
    if (!scroller) return;
    const maxScrollLeft = scroller.scrollWidth - scroller.clientWidth;
    setBundleScroll({
      canScrollLeft: scroller.scrollLeft > 2,
      canScrollRight: scroller.scrollLeft < maxScrollLeft - 2,
    });
  }, []);

  const updateStoreScroll = React.useCallback(() => {
    const scroller = storeScrollerRef.current;
    if (!scroller) return;
    const maxScrollLeft = scroller.scrollWidth - scroller.clientWidth;
    setStoreScroll({
      canScrollLeft: scroller.scrollLeft > 2,
      canScrollRight: scroller.scrollLeft < maxScrollLeft - 2,
    });
  }, []);

  React.useEffect(() => {
    const syncSearch = () => setSearchQuery(readSearchQuery());
    syncSearch();
    window.addEventListener("gawula-searchchange", syncSearch);
    window.addEventListener("popstate", syncSearch);
    return () => {
      window.removeEventListener("gawula-searchchange", syncSearch);
      window.removeEventListener("popstate", syncSearch);
    };
  }, []);

  const updateSearch = React.useCallback((value: string) => {
    const params = new URLSearchParams(window.location.search);
    if (value.trim()) {
      params.set("q", value);
    } else {
      params.delete("q");
    }
    const queryString = params.toString();
    window.history.replaceState(null, "", `/menu${queryString ? `?${queryString}` : ""}`);
    window.dispatchEvent(new Event("gawula-searchchange"));
  }, []);

  React.useEffect(() => {
    if (!locationSheetOpen) return;
    const originalOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLocationSheetOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [locationSheetOpen]);

  React.useEffect(() => {
    if (!fulfillmentMenuOpen) return;
    const onPointerDown = () => setFulfillmentMenuOpen(false);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFulfillmentMenuOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [fulfillmentMenuOpen]);

  const activeLocation =
    DELIVERY_LOCATIONS.find((location) => location.hubId === hubId) ?? DELIVERY_LOCATIONS[0];
  const activeHub = HUBS.find((hub) => hub.id === hubId) ?? HUBS[0];
  const isCustomAddress =
    Boolean(address) && !DELIVERY_LOCATIONS.some((location) => location.address === address);
  const deliveryName = isCustomAddress
    ? (address as string).split(",")[0].trim()
    : activeLocation.name;
  const fulfillmentLocationName =
    mobileFulfillment === "delivery" ? deliveryName : activeHub.name;

  const chooseLocation = (nextHubId: string) => {
    const location = DELIVERY_LOCATIONS.find((option) => option.hubId === nextHubId);
    setHub(nextHubId, location?.address ?? activeHub.area);
    setLocationSheetOpen(false);
  };

  React.useEffect(() => {
    const scroller = categoryScrollerRef.current;
    if (!scroller) return;
    updateCategoryScroll();
    scroller.addEventListener("scroll", updateCategoryScroll, { passive: true });
    window.addEventListener("resize", updateCategoryScroll);
    return () => {
      scroller.removeEventListener("scroll", updateCategoryScroll);
      window.removeEventListener("resize", updateCategoryScroll);
    };
  }, [updateCategoryScroll]);

  React.useEffect(() => {
    const scroller = bundleScrollerRef.current;
    if (!scroller) return;
    updateBundleScroll();
    scroller.addEventListener("scroll", updateBundleScroll, { passive: true });
    window.addEventListener("resize", updateBundleScroll);
    return () => {
      scroller.removeEventListener("scroll", updateBundleScroll);
      window.removeEventListener("resize", updateBundleScroll);
    };
  }, [updateBundleScroll]);

  React.useEffect(() => {
    const scroller = storeScrollerRef.current;
    if (!scroller) return;
    updateStoreScroll();
    scroller.addEventListener("scroll", updateStoreScroll, { passive: true });
    window.addEventListener("resize", updateStoreScroll);
    return () => {
      scroller.removeEventListener("scroll", updateStoreScroll);
      window.removeEventListener("resize", updateStoreScroll);
    };
  }, [updateStoreScroll]);

  React.useEffect(() => {
    if (!activePopup) return;
    const onPointerDown = (event: PointerEvent) => {
      if (filterPopupRef.current?.contains(event.target as Node)) return;
      setActivePopup(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActivePopup(null);
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activePopup]);

  const scrollCategories = (direction: "left" | "right") => {
    const scroller = categoryScrollerRef.current;
    if (!scroller) return;
    const distance = Math.max(scroller.clientWidth * 0.75, 260);
    scroller.scrollBy({
      left: direction === "left" ? -distance : distance,
      behavior: "smooth",
    });
  };

  const scrollBundles = (direction: "left" | "right") => {
    const scroller = bundleScrollerRef.current;
    if (!scroller) return;
    const distance = Math.max(scroller.clientWidth * 0.75, 260);
    scroller.scrollBy({
      left: direction === "left" ? -distance : distance,
      behavior: "smooth",
    });
  };

  const scrollStores = (direction: "left" | "right") => {
    const scroller = storeScrollerRef.current;
    if (!scroller) return;
    const distance = Math.max(scroller.clientWidth * 0.75, 260);
    scroller.scrollBy({
      left: direction === "left" ? -distance : distance,
      behavior: "smooth",
    });
  };

  const visibleRestaurants = React.useMemo(() => {
    const query = searchQuery.toLowerCase();
    return RESTAURANT_RESULTS.map((restaurant, index) => ({
      ...restaurant,
      rank: index,
      searchText: restaurantText(restaurant),
    }))
      .filter((restaurant) => {
        if (query && !restaurant.searchText.includes(query)) return false;
        if (activeCategory && !restaurantMatchesCategory(activeCategory, restaurant)) return false;
        if (activeLocationId) {
          const brand = BRANDS.find((b) => b.id === restaurant.routeBrandId);
          if (!brand || brand.storeLocationId !== activeLocationId) return false;
        }
        if (activeFilters.includes("offers") && !restaurant.offer) return false;
        if (activeFilters.includes("deliveryFee") && restaurant.deliveryFee > 3500) return false;
        if (!ratingMatchesFilter(restaurant.rating, ratingFilter)) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortMode === "rating" || activeFilters.includes("highestRated")) {
          return b.rating - a.rating || b.ratingCount - a.ratingCount || a.rank - b.rank;
        }
        return a.rank - b.rank;
      });
  }, [activeCategory, activeLocationId, activeFilters, ratingFilter, searchQuery, sortMode]);

  const activeLocationArea = activeLocationId
    ? STORE_LOCATIONS.find((location) => location.id === activeLocationId)?.area ?? null
    : null;
  const visibleNearbyShops = activeLocationArea
    ? SHOPS_NEAR_YOU.filter((shop) => shop.area === activeLocationArea)
    : SHOPS_NEAR_YOU;

  const currentBrandIds = React.useMemo(() => cartBrandIds(cartLines), [cartLines]);
  const currentEffortFee = React.useMemo(
    () => (cartLines.length === 0 ? 0 : deliveryQuoteForLines(cartLines).effortFee),
    [cartLines],
  );

  const addCostByRestaurant = React.useMemo(() => {
    const map = new Map<string, { delta: number; quote: ReturnType<typeof deliveryQuoteForBrandIds>; alreadyIn: boolean }>();
    if (cartLines.length === 0) return map;
    const quoteCache = new Map<string, ReturnType<typeof deliveryQuoteForBrandIds>>();
    for (const restaurant of visibleRestaurants) {
      const brandId = restaurant.routeBrandId;
      const alreadyIn = currentBrandIds.includes(brandId);
      const key = alreadyIn ? currentBrandIds.join(",") : [...currentBrandIds, brandId].join(",");
      let quote = quoteCache.get(key);
      if (!quote) {
        quote = deliveryQuoteForBrandIds(alreadyIn ? currentBrandIds : [...currentBrandIds, brandId]);
        quoteCache.set(key, quote);
      }
      map.set(restaurant.id, { delta: quote.effortFee - currentEffortFee, quote, alreadyIn });
    }
    return map;
  }, [cartLines.length, currentBrandIds, currentEffortFee, visibleRestaurants]);

  const tieredRestaurants = React.useMemo(() => {
    if (cartLines.length === 0) return visibleRestaurants;
    const tierOf = (id: string) => {
      const info = addCostByRestaurant.get(id);
      if (!info) return 4;
      if (info.alreadyIn) return 0;
      if (info.delta <= 0) return 1;
      if (info.delta < 1500) return 2;
      if (info.delta < 4000) return 3;
      return 4;
    };
    return [...visibleRestaurants].sort((a, b) => tierOf(a.id) - tierOf(b.id));
  }, [addCostByRestaurant, cartLines.length, visibleRestaurants]);


  const openFilterPopup = (popup: FilterPopup, event: React.MouseEvent<HTMLButtonElement>) => {
    if (activePopup === popup) {
      setActivePopup(null);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const popupWidth = 240;
    const left = Math.min(Math.max(16, rect.left), window.innerWidth - popupWidth - 16);
    setDraftRatingFilter(ratingFilter);
    setDraftSortMode(sortMode);
    setDraftBundleTypeFilter(bundleTypeFilter);
    setPopupPosition({ top: rect.bottom + 8, left });
    setActivePopup(popup);
  };

  const toggleFilter = (key: FilterKey) => {
    setActiveFilters((current) =>
      current.includes(key) ? current.filter((activeKey) => activeKey !== key) : [...current, key]
    );
  };

  const filterIsActive = (key: FilterKey) => {
    if (key === "rating") return ratingFilter !== "any";
    if (key === "sort") return sortMode !== "recommended";
    if (key === "bundleType") return bundleTypeFilter.length > 0;
    return activeFilters.includes(key);
  };

  const filterLabel = (key: FilterKey, label: string) => {
    if (key === "rating" && ratingFilter !== "any") return `Rating: ${ratingFilterLabel(ratingFilter)}`;
    if (key === "sort" && sortMode !== "recommended") return "Sort by Rating";
    return label;
  };

  const resetPopupChoice = () => {
    if (activePopup === "rating") {
      setDraftRatingFilter("any");
      return;
    }
    if (activePopup === "bundleType") {
      setDraftBundleTypeFilter([]);
      return;
    }
    setDraftSortMode("recommended");
  };

  const applyPopupChoice = () => {
    if (activePopup === "rating") {
      setRatingFilter(draftRatingFilter);
    }
    if (activePopup === "sort") {
      setSortMode(draftSortMode);
    }
    if (activePopup === "bundleType") {
      setBundleTypeFilter(draftBundleTypeFilter);
    }
    setActivePopup(null);
  };

  const resetControls = () => {
    setActiveCategory(null);
    setActiveLocationId(null);
    setActiveFilters([]);
    setRatingFilter("any");
    setSortMode("recommended");
    setBundleTypeFilter([]);
    setActivePopup(null);
    if (searchQuery) {
      window.history.replaceState(null, "", "/menu");
      window.dispatchEvent(new Event("gawula-searchchange"));
    }
  };

  const toggleLike = (restaurantId: string) => {
    setLikedRestaurants((current) => {
      const next = new Set(current);
      if (next.has(restaurantId)) {
        next.delete(restaurantId);
      } else {
        next.add(restaurantId);
      }
      return next;
    });
  };

  const hasActiveControls = Boolean(
    activeCategory || activeLocationId || activeFilters.length || ratingFilter !== "any" || sortMode !== "recommended" || bundleTypeFilter.length > 0 || searchQuery,
  );

  if (!cartHydrated) {
    return (
      <div
        role="status"
        aria-label="Loading"
        className="fixed inset-0 z-[60] grid place-items-center bg-background text-foreground"
      >
        <LoadingDots />
      </div>
    );
  }

  return (
    <div className="overflow-x-clip pb-32">
      <section className="container pt-4 sm:pt-1 lg:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-haspopup="dialog"
            aria-expanded={locationSheetOpen}
            className="mr-auto flex min-w-0 items-center gap-2 text-left"
            onClick={() => setLocationSheetOpen(true)}
          >
            <span className="flex min-w-0 flex-col">
              <span className="text-[11px] font-medium text-muted-foreground">
                {mobileFulfillment === "delivery" ? "Deliver now" : "Pickup now"}
              </span>
              <span className="truncate text-sm font-semibold">{fulfillmentLocationName}</span>
            </span>
            <ChevronDown className="ml-1 h-4 w-4 shrink-0" />
          </button>
          <div className="relative shrink-0">
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={fulfillmentMenuOpen}
              className="inline-flex h-9 items-center gap-1 rounded-full bg-secondary px-4 text-sm font-semibold"
              onClick={(event) => {
                event.stopPropagation();
                setFulfillmentDraft(mobileFulfillment);
                setFulfillmentMenuOpen((open) => !open);
              }}
            >
              {mobileFulfillment === "delivery" ? "Delivery" : "Pickup"}
              <ChevronDown className="h-4 w-4" />
            </button>
            {fulfillmentMenuOpen ? (
              <div
                role="menu"
                aria-label="Fulfilment options"
                className="absolute right-0 top-full z-50 mt-2 w-60 rounded-lg bg-background p-2 shadow-[0_0_28px_rgba(0,0,0,0.18)]"
                onPointerDown={(event) => event.stopPropagation()}
              >
                <div className="flex items-center justify-between px-3 py-2">
                  <div className="text-lg font-semibold">Fulfilment</div>
                  <button
                    type="button"
                    aria-label="Close fulfilment options"
                    className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:text-foreground"
                    onClick={() => setFulfillmentMenuOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid gap-1">
                  {(["delivery", "pickup"] as const).map((mode) => (
                    <OptionRow
                      key={mode}
                      selected={fulfillmentDraft === mode}
                      label={mode === "delivery" ? "Delivery" : "Pickup"}
                      onClick={() => setFulfillmentDraft(mode)}
                    />
                  ))}
                </div>
                <div className="mt-2 flex items-center justify-between gap-2 px-1 pt-2">
                  <button
                    type="button"
                    className="h-10 rounded-full px-4 text-sm font-semibold hover:bg-secondary"
                    onClick={() => setFulfillmentMenuOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="h-10 rounded-full bg-foreground px-5 text-sm font-semibold text-background"
                    onClick={() => {
                      setMobileFulfillment(fulfillmentDraft);
                      setFulfillmentMenuOpen(false);
                    }}
                  >
                    Apply
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="container pt-4 md:hidden">
        <form role="search" onSubmit={(event) => event.preventDefault()}>
          <div className="flex h-10 items-center gap-3 rounded-full bg-secondary px-4">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              type="search"
              aria-label="Search Gawula"
              placeholder="Search Gawula"
              value={searchQuery}
              onChange={(event) => updateSearch(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
            />
            {searchQuery ? (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => updateSearch("")}
                className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </form>
      </section>

      {locationSheetOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Choose location">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setLocationSheetOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-background p-5 pb-8 shadow-xl">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-secondary" />
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight">
                {mobileFulfillment === "delivery" ? "Delivery location" : "Pickup near"}
              </h2>
              <button
                type="button"
                aria-label="Close"
                className="grid h-9 w-9 place-items-center rounded-full hover:bg-secondary"
                onClick={() => setLocationSheetOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="-mx-3 mt-3 grid gap-1">
              {mobileFulfillment === "delivery" && isCustomAddress ? (
                <div className="flex items-start gap-3 rounded-2xl px-3 py-3 text-left">
                  <span
                    className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border-2 border-foreground bg-background"
                    aria-hidden="true"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{deliveryName}</span>
                    <span className="mt-0.5 block text-sm leading-snug text-muted-foreground">
                      {(address as string)
                        .split(",")
                        .slice(1)
                        .join(",")
                        .trim() || address}
                    </span>
                  </span>
                </div>
              ) : null}
              {DELIVERY_LOCATIONS.map((location) => {
                const selected = !isCustomAddress && location.hubId === hubId;
                return (
                  <button
                    key={location.hubId}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    className="flex items-start gap-3 rounded-2xl px-3 py-3 text-left hover:bg-secondary"
                    onClick={() => chooseLocation(location.hubId)}
                  >
                    <span
                      className={cn(
                        "mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border-2 bg-background",
                        selected ? "border-foreground" : "border-muted-foreground/70",
                      )}
                      aria-hidden="true"
                    >
                      {selected ? <span className="h-1.5 w-1.5 rounded-full bg-foreground" /> : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{location.name}</span>
                      <span className="mt-0.5 block text-sm leading-snug text-muted-foreground">
                        {location.address}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      <section>
        <div className="container">
          <div className="relative -mx-4 sm:mx-0">
            <button
              type="button"
              aria-label="Scroll categories left"
              className="absolute left-4 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-secondary shadow-sm disabled:opacity-35 sm:left-0 sm:grid"
              disabled={!categoryScroll.canScrollLeft}
              onClick={() => scrollCategories("left")}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div
              ref={categoryScrollerRef}
              className="overflow-x-auto px-4 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-12"
            >
            <div className="flex min-w-max gap-5 py-5">
              {CUISINES.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  aria-pressed={activeCategory === c.name}
                  className={cn(
                    "flex w-[76px] flex-col items-center gap-2 text-muted-foreground",
                    activeCategory === c.name && "text-foreground",
                  )}
                  onClick={() => setActiveCategory((current) => current === c.name ? null : c.name)}
                >
                  <span
                    className={cn(
                      "grid h-10 w-10 place-items-center rounded-full",
                      activeCategory === c.name && "bg-secondary",
                    )}
                  >
                    <c.Icon className="h-8 w-8" />
                  </span>
                  <span className="text-center text-[13px] font-medium leading-tight">
                    {c.name}
                  </span>
                </button>
              ))}
            </div>
            </div>
            <button
              type="button"
              aria-label="Scroll categories right"
              className="absolute right-4 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-secondary shadow-sm disabled:opacity-35 sm:right-0 sm:grid"
              disabled={!categoryScroll.canScrollRight}
              onClick={() => scrollCategories("right")}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </section>

      <section className="sticky top-0 z-30 bg-background sm:top-16">
        <div className="container">
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {FILTERS.map((f) => {
              const active = filterIsActive(f.key);
              return (
              <button
                key={f.key}
                type="button"
                aria-pressed={active}
                aria-haspopup={f.key === "rating" || f.key === "sort" || f.key === "bundleType" ? "menu" : undefined}
                aria-expanded={f.key === "rating" || f.key === "sort" || f.key === "bundleType" ? activePopup === f.key : undefined}
                className={cn(
                  "inline-flex h-9 shrink-0 items-center gap-1 rounded-full px-4 text-sm font-semibold",
                  active ? "bg-foreground text-background" : "bg-secondary text-foreground",
                )}
                onClick={(event) => {
                  if (f.key === "rating" || f.key === "sort" || f.key === "bundleType") {
                    openFilterPopup(f.key, event);
                    return;
                  }
                  toggleFilter(f.key);
                }}
              >
                {f.Icon ? <f.Icon className="h-4 w-4" /> : null}
                {filterLabel(f.key, f.label)}
                {f.trailing ? <ChevronDown className="h-4 w-4" /> : null}
              </button>
              );
            })}
            {hasActiveControls ? (
              <button
                type="button"
                onClick={resetControls}
                className="inline-flex h-9 shrink-0 items-center rounded-full px-4 text-sm font-semibold text-muted-foreground"
              >
                Reset
              </button>
            ) : null}
          </div>
        </div>
      </section>

      {activePopup && popupPosition ? (
        <FilterPopover
          popupRef={filterPopupRef}
          title={activePopup === "rating" ? "Rating" : activePopup === "bundleType" ? "Bundle type" : "Sort"}
          top={popupPosition.top}
          left={popupPosition.left}
          onClose={() => setActivePopup(null)}
          onReset={resetPopupChoice}
          onApply={applyPopupChoice}
        >
          {activePopup === "rating" ? (
            <div className="grid gap-1">
              {RATING_OPTIONS.map((option) => (
                <OptionRow
                  key={option.value}
                  selected={draftRatingFilter === option.value}
                  label={option.label}
                  onClick={() => setDraftRatingFilter(option.value)}
                />
              ))}
            </div>
          ) : activePopup === "bundleType" ? (
            <div className="grid gap-1">
              {BUNDLE_TYPE_OPTIONS.map((option) => (
                <OptionRow
                  key={option.value}
                  checkbox
                  selected={draftBundleTypeFilter.includes(option.value)}
                  label={option.label}
                  onClick={() =>
                    setDraftBundleTypeFilter((current) =>
                      current.includes(option.value)
                        ? current.filter((value) => value !== option.value)
                        : [...current, option.value],
                    )
                  }
                />
              ))}
            </div>
          ) : (
            <div className="grid gap-1">
              {SORT_OPTIONS.map((option) => (
                <OptionRow
                  key={option.value}
                  selected={draftSortMode === option.value}
                  label={option.label}
                  onClick={() => setDraftSortMode(option.value)}
                />
              ))}
            </div>
          )}
        </FilterPopover>
      ) : null}

      <section className="container pt-7">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold tracking-tight">Bundle stores near you</h2>
          <div className="flex shrink-0 items-center gap-2">
            <Link href="/menu/bundles" className="hidden text-sm font-semibold sm:inline">
              Show all
            </Link>
            <button
              type="button"
              aria-label="Scroll bundles left"
              className="hidden h-8 w-8 place-items-center rounded-full bg-secondary disabled:opacity-35 sm:grid"
              disabled={!bundleScroll.canScrollLeft}
              onClick={() => scrollBundles("left")}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Scroll bundles right"
              className="hidden h-8 w-8 place-items-center rounded-full bg-secondary disabled:opacity-35 sm:grid"
              disabled={!bundleScroll.canScrollRight}
              onClick={() => scrollBundles("right")}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <Link
              href="/menu/bundles"
              aria-label="Show all bundle stores"
              className="grid h-8 w-8 place-items-center rounded-full bg-secondary sm:hidden"
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
        <div
          ref={bundleScrollerRef}
          className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0"
        >
          {locationTiles.filter(
            (tile) => bundleTypeFilter.length === 0 || bundleTypeFilter.includes(tile.location.type),
          ).map((tile) => {
            const isActive = activeLocationId === tile.location.id;
            return (
              <div key={tile.location.id} className="flex w-[200px] shrink-0 flex-col gap-3 sm:w-[260px]">
                <button
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => {
                    setActiveLocationId((current) => (current === tile.location.id ? null : tile.location.id));
                  }}
                  className={cn(
                    "relative flex aspect-[5/4] w-full items-center justify-center overflow-hidden rounded-3xl bg-[#FFF1E6] p-6 text-center text-[#3D1D00] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-black/10",
                    isActive && "ring-4 ring-inset ring-black/5",
                  )}
                >
                  <div className="flex flex-col items-center gap-1">
                    <h3 className="max-w-[170px] text-xl font-semibold leading-tight tracking-tight sm:text-2xl">
                      {tile.location.name}
                    </h3>
                    <p className="text-sm font-medium opacity-70">
                      {tile.location.type === "mall" ? "Mall" : tile.location.type === "complex" ? "Complex" : "Cluster"}
                    </p>
                  </div>
                </button>
                <div className="flex flex-col items-center gap-0.5 text-center">
                  <p className="text-sm font-medium text-foreground">
                    {tile.restaurantCount} stores in this bundle
                  </p>
                  <p className="text-sm tabular-nums text-muted-foreground">
                    {tile.distanceKm != null
                      ? `${tile.distanceKm.toFixed(1)} km away`
                      : tile.location.area}
                  </p>
                </div>
              </div>
            );
          })}
          {(bundleTypeFilter.length === 0 ? SHOP_CLUSTERS : []).map((cluster) => {
            const total = cluster.members.length + 1;
            const clusterDistance = origin ? haversineKm(origin, cluster.anchor.coordinates) : null;
            const showClusterDistance = clusterDistance != null && clusterDistance <= SERVICE_RADIUS_KM;
            return (
              <div key={cluster.id} className="flex w-[200px] shrink-0 flex-col gap-3 sm:w-[260px]">
                <Link
                  href={`/menu/bundles#${cluster.id}`}
                  className="relative flex aspect-[5/4] w-full items-center justify-center overflow-hidden rounded-3xl bg-[#FFF1E6] p-6 text-center text-[#3D1D00] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-black/10"
                >
                  <div className="flex flex-col items-center gap-1">
                    <h3 className="max-w-[180px] text-xl font-semibold leading-tight tracking-tight sm:text-2xl">
                      Around {cluster.anchor.name}
                    </h3>
                    <p className="text-sm font-medium opacity-70">Cluster</p>
                  </div>
                </Link>
                <div className="flex flex-col items-center gap-0.5 text-center">
                  <p className="text-sm font-medium text-foreground">{total} stores nearby</p>
                  <p className="text-sm tabular-nums text-muted-foreground">
                    {showClusterDistance
                      ? `${clusterDistance.toFixed(1)} km · ${cluster.anchor.area}`
                      : cluster.anchor.area}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="container pt-8">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold tracking-tight">Individual stores near you</h2>
            {activeLocationId ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-foreground">
                <MapPin className="h-3 w-3" />
                {STORE_LOCATIONS.find((l) => l.id === activeLocationId)?.name}
                <button
                  type="button"
                  aria-label="Clear bundle filter"
                  onClick={() => setActiveLocationId(null)}
                  className="-mr-1 grid h-4 w-4 place-items-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link href="/menu/stores" className="hidden text-sm font-semibold text-foreground sm:inline">
              Show all
            </Link>
            <button
              type="button"
              aria-label="Scroll stores left"
              className="hidden h-8 w-8 place-items-center rounded-full bg-secondary disabled:opacity-35 sm:grid"
              disabled={!storeScroll.canScrollLeft}
              onClick={() => scrollStores("left")}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Scroll stores right"
              className="hidden h-8 w-8 place-items-center rounded-full bg-secondary disabled:opacity-35 sm:grid"
              disabled={!storeScroll.canScrollRight}
              onClick={() => scrollStores("right")}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <Link
              href="/menu/stores"
              aria-label="Show all individual stores"
              className="grid h-8 w-8 place-items-center rounded-full bg-secondary sm:hidden"
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
        <div
          ref={storeScrollerRef}
          className="-mx-4 flex gap-6 overflow-x-auto px-4 pb-2 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0"
        >
          {visibleNearbyShops.map((shop) => (
            <Link key={shop.name} href={`/menu/stores/${shopSlug(shop.name)}`} className="block w-24 shrink-0 sm:w-32">
              <div className="grid h-24 place-items-center sm:h-36">
                <NearbyShopLogo shop={shop} />
              </div>
              <div className="mt-1 min-h-[3rem] text-center">
                <div className="truncate text-sm font-semibold leading-snug">{shop.name}</div>
                {shop.badge ? (
                  <div className="mt-1 text-xs font-semibold text-[#e11900]">{shop.badge}</div>
                ) : null}
              </div>
            </Link>
          ))}
          {visibleNearbyShops.length === 0 ? (
            <p className="py-8 text-sm text-muted-foreground">
              No individual stores in this bundle yet.
            </p>
          ) : null}
        </div>
      </section>

      <section id="all-stores" className="container scroll-mt-28 pt-8">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold tracking-tight">All stores</h2>
            {activeLocationId ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-foreground">
                <MapPin className="h-3 w-3" />
                {STORE_LOCATIONS.find((l) => l.id === activeLocationId)?.name}
                <button
                  type="button"
                  aria-label="Clear bundle filter"
                  onClick={() => setActiveLocationId(null)}
                  className="-mr-1 grid h-4 w-4 place-items-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ) : null}
          </div>
        </div>
        {visibleRestaurants.length === 0 ? (
          <div className="rounded-2xl border bg-card p-10 text-center text-sm text-muted-foreground">
            No restaurants match those choices.
          </div>
        ) : (
          <div className="grid gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
          {tieredRestaurants.map((restaurant) => {
            const liked = likedRestaurants.has(restaurant.id);
            const logo = getRestaurantLogo(restaurant);
            const addCost = addCostByRestaurant.get(restaurant.id);
            const location = getBrandLocation(restaurant.routeBrandId);
            const closed = restaurant.closed ?? false;
            let chip: { label: string; tone: "in" | "free" | "small" | "medium" | "far" } | null = null;
            if (addCost && !closed) {
              if (addCost.alreadyIn) {
                chip = { label: "Already in cart", tone: "in" };
              } else if (addCost.delta <= 0) {
                chip = { label: "Free to add", tone: "free" };
              } else if (addCost.delta < 1500) {
                chip = { label: `+${formatPrice(addCost.delta)}`, tone: "small" };
              } else if (addCost.delta < 4000) {
                chip = { label: `+${formatPrice(addCost.delta)}`, tone: "medium" };
              } else {
                chip = {
                  label: `${addCost.quote.distanceKm.toFixed(1)} km · +${formatPrice(addCost.delta)}`,
                  tone: "far",
                };
              }
            }
            return (
              <div key={restaurant.id} className="group">
                <Link
                  href={`/menu/${restaurant.routeBrandId}`}
                  className={cn("block", closed && "pointer-events-none")}
                  aria-disabled={closed || undefined}
                  tabIndex={closed ? -1 : undefined}
                >
                  <div className="relative aspect-[2/1] overflow-hidden rounded-lg bg-secondary">
                    <Image
                      src={getRestaurantCover(restaurant.routeBrandId)}
                      alt={restaurant.name}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className={cn(
                        "object-cover transition-transform duration-300 group-hover:scale-[1.03]",
                        closed && "grayscale group-hover:scale-100",
                      )}
                    />
                    {closed ? (
                      <>
                        <span className="absolute inset-0 bg-background/55" aria-hidden />
                        <span className="absolute left-1/2 top-1/2 inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-full bg-background px-3 py-1.5 text-sm font-semibold text-foreground shadow-sm">
                          <Moon className="h-4 w-4" />
                          Closed
                        </span>
                      </>
                    ) : restaurant.pickup ? (
                      <span className="absolute left-1/2 top-1/2 inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-full bg-background px-3 py-1.5 text-sm font-semibold text-foreground shadow-sm">
                        <WalkingPickupIcon className="h-4 w-4" />
                        Pick it up
                      </span>
                    ) : null}
                    {restaurant.offer && !closed ? (
                      <span className="absolute left-3 top-3 max-w-[calc(100%-1.5rem)] rounded bg-[#e11900] px-2.5 py-1 text-xs font-normal text-white shadow-sm">
                        {restaurant.offer}
                      </span>
                    ) : null}
                    </div>
                  </Link>
                  <div className={cn("relative pt-3 pr-8", closed && "opacity-60")}>
                    <div className="flex items-start gap-3">
                      <Link
                        href={`/menu/${restaurant.routeBrandId}`}
                        className={cn("shrink-0", closed && "pointer-events-none")}
                        aria-label={`${restaurant.name} menu`}
                        aria-disabled={closed || undefined}
                        tabIndex={closed ? -1 : undefined}
                      >
                        <StoreLogo
                          name={restaurant.name}
                          initials={logo.initials}
                          color={logo.color}
                          logoUrl={logo.logoUrl}
                          className="h-10 w-10"
                        />
                      </Link>
                      <Link
                        href={`/menu/${restaurant.routeBrandId}`}
                        className={cn("block min-w-0 flex-1", closed && "pointer-events-none")}
                        aria-disabled={closed || undefined}
                        tabIndex={closed ? -1 : undefined}
                      >
                        <h3 className="text-base font-semibold leading-tight sm:text-lg">{restaurant.name}</h3>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                          <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                            <Star className="h-3.5 w-3.5" />
                            {restaurant.rating.toFixed(1)}
                          </span>
                          <span>{formatRatingCount(restaurant.ratingCount)}</span>
                          {location ? <span>{location.proximityLabel}</span> : null}
                        </div>
                        {chip ? (
                          <div
                            className={cn(
                              "mt-2 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold",
                              chip.tone === "in" && "bg-secondary text-muted-foreground",
                              chip.tone === "free" && "bg-[#116B35]/10 text-[#116B35]",
                              chip.tone === "small" && "bg-[#116B35]/10 text-[#116B35]",
                              chip.tone === "medium" && "bg-[#f5a623]/15 text-[#8a5a00]",
                              chip.tone === "far" && "bg-secondary text-foreground",
                            )}
                            aria-label={
                              chip.tone === "in"
                                ? "Already in cart"
                                : chip.tone === "free"
                                  ? "Free to add to your cart"
                                  : `Adds ${chip.label.replace("+", "")} to delivery`
                            }
                          >
                            <span
                              aria-hidden
                              className={cn(
                                "h-1.5 w-1.5 rounded-full",
                                chip.tone === "in" && "bg-muted-foreground",
                                chip.tone === "free" && "bg-[#116B35]",
                                chip.tone === "small" && "bg-[#116B35]",
                                chip.tone === "medium" && "bg-[#f5a623]",
                                chip.tone === "far" && "bg-foreground",
                              )}
                            />
                            {chip.label}
                          </div>
                        ) : null}
                      </Link>
                    </div>
                    <button
                      type="button"
                      aria-label={liked ? `Unlike ${restaurant.name}` : `Like ${restaurant.name}`}
                      aria-pressed={liked}
                      className={cn(
                        "absolute right-0 top-3 grid h-6 w-6 place-items-center transition-transform hover:scale-110",
                        liked ? "text-[#e11900]" : "text-foreground",
                      )}
                      onClick={() => toggleLike(restaurant.id)}
                    >
                      {liked ? <HeartFilled className="h-5 w-5" /> : <Heart className="h-5 w-5" />}
                    </button>
                  {restaurant.distanceKm ? (
                    <Link
                      href={`/menu/${restaurant.routeBrandId}`}
                      className={cn(
                        "mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 pl-[3.25rem] text-sm text-muted-foreground",
                        closed && "pointer-events-none opacity-60",
                      )}
                      aria-disabled={closed || undefined}
                      tabIndex={closed ? -1 : undefined}
                    >
                      <span>{formatDistance(restaurant.distanceKm)}</span>
                    </Link>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
        )}
      </section>

      <FloatingContactButton />
    </div>
  );
}

function FilterPopover({
  popupRef,
  title,
  top,
  left,
  onClose,
  onReset,
  onApply,
  children,
}: {
  popupRef: React.RefObject<HTMLDivElement>;
  title: string;
  top: number;
  left: number;
  onClose: () => void;
  onReset: () => void;
  onApply: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      ref={popupRef}
      role="menu"
      aria-label={`${title} options`}
      className="fixed z-50 w-60 rounded-lg bg-background p-2 shadow-[0_0_28px_rgba(0,0,0,0.18)]"
      style={{ top, left }}
    >
      <div className="flex items-center justify-between px-3 py-2">
        <div className="text-lg font-semibold">{title}</div>
        <button
          type="button"
          aria-label={`Close ${title} options`}
          className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:text-foreground"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="grid gap-1">
        {children}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 px-1 pt-2">
        <button
          type="button"
          className="h-10 rounded-full px-4 text-sm font-semibold hover:bg-secondary"
          onClick={onReset}
        >
          Reset
        </button>
        <button
          type="button"
          className="h-10 rounded-full bg-foreground px-5 text-sm font-semibold text-background"
          onClick={onApply}
        >
          Apply
        </button>
      </div>
    </div>
  );
}

function OptionRow({
  selected,
  label,
  onClick,
  checkbox = false,
}: {
  selected: boolean;
  label: string;
  onClick: () => void;
  checkbox?: boolean;
}) {
  return (
    <button
      type="button"
      role={checkbox ? "menuitemcheckbox" : "menuitemradio"}
      aria-checked={selected}
      className="flex h-11 items-center gap-3 rounded-lg px-3 text-left text-sm font-medium"
      onClick={onClick}
    >
      <span
        className={cn(
          "grid h-4 w-4 shrink-0 place-items-center border-2 bg-background",
          checkbox ? "rounded" : "rounded-full",
          selected ? "border-foreground" : "border-muted-foreground/70",
          checkbox && selected ? "bg-foreground" : "",
        )}
        aria-hidden="true"
      >
        {selected ? (
          checkbox ? (
            <Check className="h-3 w-3 text-background" />
          ) : (
            <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
          )
        ) : null}
      </span>
      <span>{label}</span>
    </button>
  );
}
