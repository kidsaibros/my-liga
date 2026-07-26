import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // `"use cache"` direktivasini yoqadi. Next 16'da `unstable_cache` endi
    // keshlamaydi (o'lchov: keshlangan chaqiruv ham har safar ~440ms olardi),
    // shuning uchun `lib/cache.ts` shu direktivaga o'tkazildi.
    useCache: true,
  },
};

export default nextConfig;
