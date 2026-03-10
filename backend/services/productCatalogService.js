const Product = require('../models/Product');

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 50;
const RECOMMENDATION_WEIGHTS = Object.freeze({
  sameCategory: 30,
  samePlatform: 22,
  samePublisher: 14,
  sameGenre: 12,
  sameRegion: 8,
  sameType: 8,
  sameDeliveryType: 6,
  sharedKeyword: 4,
  maxKeywordScore: 16,
  veryClosePrice: 10,
  closePrice: 6,
  broadPrice: 3,
  popularityBoostMax: 10
});

const SORT_KEYS = new Set([
  'newest',
  'oldest',
  'price-low',
  'price-high',
  'rating',
  'name',
  'popularity',
  'bestselling',
  'best-selling',
  'top-sellers',
  'trending'
]);

function toInt(value, fallback) {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function escapeRegex(value = '') {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeSort(rawSort, rawOrder) {
  const sort = String(rawSort || 'newest').trim().toLowerCase();
  const order = String(rawOrder || '').trim().toLowerCase();

  if (!SORT_KEYS.has(sort)) {
    if (sort === 'createdat') return { key: order === 'asc' ? 'oldest' : 'newest' };
    if (sort === 'price') return { key: order === 'desc' ? 'price-high' : 'price-low' };
    return { key: 'newest' };
  }

  if (sort === 'price-low' || sort === 'price-high') {
    return { key: order === 'asc' ? 'price-low' : order === 'desc' ? 'price-high' : sort };
  }

  if (sort === 'newest' || sort === 'oldest') {
    return { key: order === 'asc' ? 'oldest' : order === 'desc' ? 'newest' : sort };
  }

  if (sort === 'best-selling') return { key: 'bestselling' };

  return { key: sort };
}

function buildKeywordSet(product) {
  const tokens = new Set();
  const sources = [
    product.title,
    product.description,
    product.platform,
    product.genre,
    product.publisher,
    product.developer,
    product.region,
    product.delivery_type,
    ...(Array.isArray(product.features) ? product.features : []),
    ...(Array.isArray(product.tags) ? product.tags : [])
  ];

  for (const source of sources) {
    String(source || '')
      .toLowerCase()
      .split(/[^a-z0-9]+/i)
      .filter((token) => token && token.length >= 3)
      .forEach((token) => tokens.add(token));
  }

  return tokens;
}

function getPopularityScore(product) {
  const reviewScore = (Number(product.reviewCount) || 0) * 2;
  const ratingScore = (Number(product.rating) || 0) * 12;
  const badgeScore = product.badge === 'BESTSELLER' ? 12 : product.badge === 'HOT' ? 8 : 0;
  const flagScore =
    (product.isBestSelling ? 30 : 0) +
    (product.isTopSeller ? 26 : 0) +
    (product.isTrending ? 20 : 0) +
    (product.isFeatured ? 8 : 0);

  return reviewScore + ratingScore + badgeScore + flagScore;
}

function getPriceSimilarityScore(targetPrice, candidatePrice) {
  if (!(targetPrice > 0 && candidatePrice > 0)) {
    return 0;
  }

  const deltaRatio = Math.abs(candidatePrice - targetPrice) / targetPrice;
  if (deltaRatio <= 0.1) return RECOMMENDATION_WEIGHTS.veryClosePrice;
  if (deltaRatio <= 0.25) return RECOMMENDATION_WEIGHTS.closePrice;
  if (deltaRatio <= 0.4) return RECOMMENDATION_WEIGHTS.broadPrice;
  return 0;
}

function getSortStage(sortKey) {
  switch (sortKey) {
    case 'price-low':
      return { effectivePrice: 1, createdAt: -1, _id: 1 };
    case 'price-high':
      return { effectivePrice: -1, createdAt: -1, _id: 1 };
    case 'rating':
      return { rating: -1, reviewCount: -1, createdAt: -1, _id: 1 };
    case 'name':
      return { title: 1, createdAt: -1, _id: 1 };
    case 'oldest':
      return { createdAt: 1, _id: 1 };
    case 'popularity':
    case 'bestselling':
    case 'top-sellers':
    case 'trending':
      return { popularityScore: -1, rating: -1, reviewCount: -1, createdAt: -1, _id: 1 };
    case 'newest':
    default:
      return { createdAt: -1, _id: 1 };
  }
}

function buildBaseMatch(query = {}, { admin = false } = {}) {
  const match = admin ? {} : { isActive: true };

  if (query.category) match.category = query.category;
  if (query.platform) match.platform = query.platform;
  if (query.genre) match.genre = query.genre;
  if (query.featured !== undefined) match.isFeatured = String(query.featured) === 'true';
  if (query.isTopSeller !== undefined) match.isTopSeller = String(query.isTopSeller) === 'true';
  if (query.isTrending !== undefined) match.isTrending = String(query.isTrending) === 'true';
  if (query.isBestSelling !== undefined) match.isBestSelling = String(query.isBestSelling) === 'true';
  if (query.isPreOrder !== undefined) match.isPreOrder = String(query.isPreOrder) === 'true';
  if (query.isDealOfTheDay !== undefined) match.isDealOfTheDay = String(query.isDealOfTheDay) === 'true';

  const rating = toNumber(query.rating);
  if (rating !== undefined) {
    match.rating = { $gte: rating };
  }

  return match;
}

function buildCatalogQuery(query = {}, { admin = false } = {}) {
  const page = Math.max(toInt(query.page, 1), 1);
  const limit = Math.min(Math.max(toInt(query.limit, DEFAULT_LIMIT), 1), MAX_LIMIT);
  const { key: sortKey } = normalizeSort(query.sort, query.order);
  const match = buildBaseMatch(query, { admin });

  if (sortKey === 'bestselling') match.isBestSelling = true;
  if (sortKey === 'top-sellers') match.isTopSeller = true;
  if (sortKey === 'trending') match.isTrending = true;

  return {
    page,
    limit,
    skip: (page - 1) * limit,
    sortKey,
    sortStage: getSortStage(sortKey),
    match,
    search: String(query.search || '').trim(),
    minPrice: toNumber(query.minPrice),
    maxPrice: toNumber(query.maxPrice)
  };
}

function buildCatalogPipeline(parsedQuery) {
  const pipeline = [{ $match: parsedQuery.match }];

  if (parsedQuery.search) {
    const regex = new RegExp(escapeRegex(parsedQuery.search), 'i');
    pipeline.push({
      $match: {
        $or: [
          { title: { $regex: regex } },
          { description: { $regex: regex } },
          { platform: { $regex: regex } },
          { genre: { $regex: regex } },
          { publisher: { $regex: regex } },
          { developer: { $regex: regex } },
          { tags: { $elemMatch: { $regex: regex } } }
        ]
      }
    });
  }

  pipeline.push({
    $addFields: {
      effectivePrice: { $ifNull: ['$salePrice', '$price'] },
      popularityScore: {
        $add: [
          { $multiply: [{ $ifNull: ['$reviewCount', 0] }, 2] },
          { $multiply: [{ $ifNull: ['$rating', 0] }, 12] },
          { $cond: ['$isBestSelling', 30, 0] },
          { $cond: ['$isTopSeller', 26, 0] },
          { $cond: ['$isTrending', 20, 0] },
          { $cond: ['$isFeatured', 8, 0] },
          {
            $switch: {
              branches: [
                { case: { $eq: ['$badge', 'BESTSELLER'] }, then: 12 },
                { case: { $eq: ['$badge', 'HOT'] }, then: 8 }
              ],
              default: 0
            }
          }
        ]
      }
    }
  });

  if (parsedQuery.minPrice !== undefined || parsedQuery.maxPrice !== undefined) {
    const priceMatch = {};
    if (parsedQuery.minPrice !== undefined) priceMatch.$gte = parsedQuery.minPrice;
    if (parsedQuery.maxPrice !== undefined) priceMatch.$lte = parsedQuery.maxPrice;
    pipeline.push({ $match: { effectivePrice: priceMatch } });
  }

  return pipeline;
}

async function fetchCatalog(query = {}, options = {}) {
  const parsedQuery = buildCatalogQuery(query, options);
  const basePipeline = buildCatalogPipeline(parsedQuery);

  const [products, totalRows] = await Promise.all([
    Product.aggregate([
      ...basePipeline,
      { $sort: parsedQuery.sortStage },
      { $skip: parsedQuery.skip },
      { $limit: parsedQuery.limit }
    ]),
    Product.aggregate([...basePipeline, { $count: 'total' }])
  ]);

  const total = totalRows[0]?.total || 0;

  return {
    parsedQuery,
    products,
    total,
    totalPages: Math.max(Math.ceil(total / parsedQuery.limit), 1)
  };
}

function scoreRecommendation(targetProduct, candidate) {
  let score = 0;
  const reasons = [];
  const breakdown = {
    category: 0,
    platform: 0,
    publisher: 0,
    genre: 0,
    region: 0,
    type: 0,
    deliveryType: 0,
    keywords: 0,
    price: 0,
    popularity: 0
  };
  const targetPrice = Number(targetProduct.salePrice || targetProduct.price || 0);
  const candidatePrice = Number(candidate.salePrice || candidate.price || 0);

  if (candidate.category === targetProduct.category) {
    score += RECOMMENDATION_WEIGHTS.sameCategory;
    breakdown.category = RECOMMENDATION_WEIGHTS.sameCategory;
    reasons.push('same category');
  }

  if (candidate.platform && targetProduct.platform && candidate.platform === targetProduct.platform) {
    score += RECOMMENDATION_WEIGHTS.samePlatform;
    breakdown.platform = RECOMMENDATION_WEIGHTS.samePlatform;
    reasons.push('same platform');
  }

  if (candidate.genre && targetProduct.genre && candidate.genre === targetProduct.genre) {
    score += RECOMMENDATION_WEIGHTS.sameGenre;
    breakdown.genre = RECOMMENDATION_WEIGHTS.sameGenre;
    reasons.push('same genre');
  }

  if (candidate.publisher && targetProduct.publisher && candidate.publisher === targetProduct.publisher) {
    score += RECOMMENDATION_WEIGHTS.samePublisher;
    breakdown.publisher = RECOMMENDATION_WEIGHTS.samePublisher;
    reasons.push('same publisher');
  }

  if (candidate.region && targetProduct.region && candidate.region === targetProduct.region) {
    score += RECOMMENDATION_WEIGHTS.sameRegion;
    breakdown.region = RECOMMENDATION_WEIGHTS.sameRegion;
    reasons.push('same region');
  }

  if (candidate.type && targetProduct.type && candidate.type === targetProduct.type) {
    score += RECOMMENDATION_WEIGHTS.sameType;
    breakdown.type = RECOMMENDATION_WEIGHTS.sameType;
    reasons.push('same product type');
  }

  if (candidate.delivery_type && targetProduct.delivery_type && candidate.delivery_type === targetProduct.delivery_type) {
    score += RECOMMENDATION_WEIGHTS.sameDeliveryType;
    breakdown.deliveryType = RECOMMENDATION_WEIGHTS.sameDeliveryType;
    reasons.push('same delivery type');
  }

  if (candidate.developer && targetProduct.developer && candidate.developer === targetProduct.developer) {
    score += Math.floor(RECOMMENDATION_WEIGHTS.samePublisher / 2);
    breakdown.publisher += Math.floor(RECOMMENDATION_WEIGHTS.samePublisher / 2);
    reasons.push('same developer');
  }

  const targetKeywords = buildKeywordSet(targetProduct);
  const candidateKeywords = buildKeywordSet(candidate);
  const overlap = [...candidateKeywords].filter((keyword) => targetKeywords.has(keyword)).length;
  if (overlap > 0) {
    const keywordScore = Math.min(
      overlap * RECOMMENDATION_WEIGHTS.sharedKeyword,
      RECOMMENDATION_WEIGHTS.maxKeywordScore
    );
    score += keywordScore;
    breakdown.keywords = keywordScore;
    reasons.push('shared keywords');
  }

  const priceScore = getPriceSimilarityScore(targetPrice, candidatePrice);
  if (priceScore > 0) {
    score += priceScore;
    breakdown.price = priceScore;
    reasons.push(priceScore >= RECOMMENDATION_WEIGHTS.veryClosePrice ? 'similar price' : 'close price');
  }

  const popularityBoost = Math.min(getPopularityScore(candidate) / 25, RECOMMENDATION_WEIGHTS.popularityBoostMax);
  score += popularityBoost;
  breakdown.popularity = Math.round(popularityBoost * 100) / 100;

  return {
    ...candidate,
    recommendationScore: Math.round(score * 100) / 100,
    recommendationReason: reasons[0] || 'popular alternative',
    recommendationBreakdown: breakdown
  };
}

async function getRecommendedProducts(productId, limit = 8) {
  const targetProduct = await Product.findById(productId).lean();
  if (!targetProduct || !targetProduct.isActive) {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }

  const baseMatch = {
    _id: { $ne: targetProduct._id },
    isActive: true,
    stock: { $gt: 0 }
  };

  const candidatePool = await Product.find({
    ...baseMatch,
    $or: [
      { category: targetProduct.category },
      { platform: targetProduct.platform },
      { publisher: targetProduct.publisher },
      { developer: targetProduct.developer },
      { delivery_type: targetProduct.delivery_type },
      { genre: targetProduct.genre },
      { region: targetProduct.region },
      { type: targetProduct.type },
      { tags: { $in: Array.isArray(targetProduct.tags) ? targetProduct.tags : [] } }
    ]
  }).lean();

  const scored = candidatePool
    .map((candidate) => scoreRecommendation(targetProduct, candidate))
    .filter((candidate) => candidate.recommendationScore > 0)
    .sort((left, right) => {
      if (right.recommendationScore !== left.recommendationScore) {
        return right.recommendationScore - left.recommendationScore;
      }
      if ((right.rating || 0) !== (left.rating || 0)) {
        return (right.rating || 0) - (left.rating || 0);
      }
      if ((right.reviewCount || 0) !== (left.reviewCount || 0)) {
        return (right.reviewCount || 0) - (left.reviewCount || 0);
      }
      return new Date(right.createdAt || 0) - new Date(left.createdAt || 0);
    });

  if (scored.length >= limit) {
    return scored.slice(0, limit);
  }

  const usedIds = [targetProduct._id, ...scored.map((item) => item._id)];
  const fallbackStages = [
    {
      label: 'same category fallback',
      query: { ...baseMatch, _id: { $nin: usedIds }, category: targetProduct.category }
    },
    {
      label: 'same platform fallback',
      query: { ...baseMatch, _id: { $nin: usedIds }, platform: targetProduct.platform }
    },
    {
      label: 'popular fallback',
      query: { ...baseMatch, _id: { $nin: usedIds } }
    }
  ];

  const fallback = [];
  for (const stage of fallbackStages) {
    if (scored.length + fallback.length >= limit) break;

    const needed = limit - scored.length - fallback.length;
    const stageItems = await Product.find(stage.query)
      .sort({ isBestSelling: -1, isTopSeller: -1, isTrending: -1, rating: -1, reviewCount: -1, createdAt: -1 })
      .limit(needed)
      .lean();

    stageItems.forEach((candidate) => {
      fallback.push({
        ...candidate,
        recommendationScore: getPopularityScore(candidate),
        recommendationReason: stage.label
      });
      usedIds.push(candidate._id);
    });
  }

  return [...scored, ...fallback].slice(0, limit);
}

module.exports = {
  buildCatalogQuery,
  fetchCatalog,
  getRecommendedProducts,
  normalizeSort,
  getPopularityScore,
  RECOMMENDATION_WEIGHTS
};
