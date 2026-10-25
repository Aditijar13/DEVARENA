const Event = require('../models/Event');
const User = require('../models/User');

/**
 * DevArena AI Event Recommendation Engine
 * Scores events based on: skill match, category history, location, popularity, recency
 */

const WEIGHTS = {
  skillMatch: 40,
  categoryMatch: 25,
  locationMatch: 10,
  popularity: 10,
  recency: 10,
  pricePreference: 5,
};

const getRecommendedEvents = async (user, limit = 12) => {
  try {
    const now = new Date();

    // Get upcoming events not yet registered for
    const registeredEventIds = user.participationHistory?.map(e =>
      typeof e === 'object' ? e._id?.toString() : e?.toString()
    ) || [];

    const bookmarkedIds = user.bookmarkedEvents?.map(e =>
      typeof e === 'object' ? e._id?.toString() : e?.toString()
    ) || [];

    const candidateEvents = await Event.find({
      isPublished: true,
      isRemoved: false,
      status: { $in: ['upcoming', 'ongoing'] },
      registrationDeadline: { $gte: now },
      _id: { $nin: [...registeredEventIds, ...bookmarkedIds] },
    })
      .populate('organizer', 'name avatar')
      .select('-registrations -reports')
      .limit(100)
      .lean();

    if (!candidateEvents.length) return [];

    // Analyze user's history for category preferences
    const categoryHistory = await analyzeCategoryHistory(user._id);

    // Score each event
    const scoredEvents = candidateEvents.map((event) => {
      let score = 0;
      const reasons = [];

      // 1. Skill Match (40 points)
      const userSkills = (user.skills || []).map(s => s.toLowerCase());
      const eventSkills = (event.skills || []).map(s => s.toLowerCase());
      const eventTags = (event.tags || []).map(t => t.toLowerCase());

      const matchingSkills = userSkills.filter(
        skill => eventSkills.includes(skill) || eventTags.some(tag => tag.includes(skill))
      );

      if (matchingSkills.length > 0) {
        const skillScore = Math.min(WEIGHTS.skillMatch, (matchingSkills.length / Math.max(eventSkills.length, 1)) * WEIGHTS.skillMatch);
        score += skillScore;
        reasons.push(`Matches your skills: ${matchingSkills.slice(0, 2).join(', ')}`);
      }

      // 2. Category History Match (25 points)
      const categoryScore = categoryHistory[event.category] || 0;
      if (categoryScore > 0) {
        const catScore = Math.min(WEIGHTS.categoryMatch, categoryScore * WEIGHTS.categoryMatch);
        score += catScore;
        reasons.push(`Based on your ${event.category} activity`);
      }

      // 3. Interest Match
      const userInterests = (user.interests || []).map(i => i.toLowerCase());
      const hasInterestMatch = userInterests.some(
        interest => eventTags.includes(interest) || event.category.includes(interest)
      );
      if (hasInterestMatch) {
        score += 10;
        reasons.push('Matches your interests');
      }

      // 4. Location Match (10 points)
      if (event.mode === 'online') {
        score += WEIGHTS.locationMatch * 0.5;
      } else if (user.location?.city && event.location?.city) {
        if (event.location.city.toLowerCase() === user.location.city.toLowerCase()) {
          score += WEIGHTS.locationMatch;
          reasons.push('Near your location');
        } else if (event.location.state?.toLowerCase() === user.location?.state?.toLowerCase()) {
          score += WEIGHTS.locationMatch * 0.5;
        }
      }

      // 5. Popularity (10 points)
      const popularityScore = Math.min(
        WEIGHTS.popularity,
        (event.registeredCount / Math.max(event.maxParticipants || 100, 1)) * WEIGHTS.popularity
      );
      score += popularityScore;
      if (event.registeredCount > 50) reasons.push('Popular event');

      // 6. Recency - prefer events starting soon (10 points)
      const daysUntilStart = (new Date(event.startDate) - now) / (1000 * 60 * 60 * 24);
      if (daysUntilStart <= 7) {
        score += WEIGHTS.recency;
        reasons.push('Starting soon!');
      } else if (daysUntilStart <= 30) {
        score += WEIGHTS.recency * 0.5;
      }

      // 7. Price preference (5 points) - free events get slight boost for new users
      if (!event.isPaid && (user.stats?.eventsJoined || 0) < 5) {
        score += WEIGHTS.pricePreference;
      }

      // 8. Featured events boost
      if (event.isFeatured) score += 5;

      return { ...event, recommendationScore: Math.round(score), recommendationReasons: reasons };
    });

    // Sort by score, diversify by category
    scoredEvents.sort((a, b) => b.recommendationScore - a.recommendationScore);
    const diversified = diversifyByCategory(scoredEvents, limit);

    return diversified;
  } catch (error) {
    console.error('Recommendation engine error:', error.message);
    // Fallback: return trending events
    return Event.find({ isPublished: true, status: { $in: ['upcoming', 'ongoing'] } })
      .sort({ views: -1 })
      .limit(limit)
      .select('-registrations')
      .lean();
  }
};

// Analyze user's past participation to determine category preferences
const analyzeCategoryHistory = async (userId) => {
  try {
    const participatedEvents = await Event.find({
      'registrations': { $elemMatch: { user: userId, status: 'approved' } },
    }).select('category').lean();

    const categoryCounts = {};
    participatedEvents.forEach(({ category }) => {
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    // Normalize scores (0-1)
    const total = Object.values(categoryCounts).reduce((a, b) => a + b, 0);
    const normalized = {};
    Object.keys(categoryCounts).forEach((cat) => {
      normalized[cat] = categoryCounts[cat] / total;
    });

    return normalized;
  } catch {
    return {};
  }
};

// Ensure category diversity in recommendations
const diversifyByCategory = (events, limit) => {
  const result = [];
  const categoryCount = {};
  const maxPerCategory = Math.ceil(limit / 4);

  for (const event of events) {
    if (result.length >= limit) break;
    const count = categoryCount[event.category] || 0;
    if (count < maxPerCategory) {
      result.push(event);
      categoryCount[event.category] = count + 1;
    }
  }

  // Fill remaining slots with top-scored events
  if (result.length < limit) {
    for (const event of events) {
      if (result.length >= limit) break;
      if (!result.find(e => e._id.toString() === event._id.toString())) {
        result.push(event);
      }
    }
  }

  return result;
};

module.exports = { getRecommendedEvents };
