'use strict';
const User = require('../models/User');

const BADGE_DEFINITIONS = {
  register: [
    { name: 'Code Starter', description: 'Created your DevArena account', icon: 'code-starter', category: 'participation', pointsReward: 50 },
  ],
  verify_email: [
    { name: 'Verified Dev', description: 'Verified your email address', icon: 'verified', category: 'participation', pointsReward: 25 },
  ],
  register_event: [
    { name: 'First Step',          description: 'Registered for your first event', icon: 'first-step',   category: 'participation', pointsReward: 20 },
    { name: 'Event Explorer',      description: 'Registered for 5 events',         icon: 'explorer',     category: 'participation', pointsReward: 100, eventsRequired: 5  },
    { name: 'Hackathon Enthusiast',description: 'Participated in 10 events',       icon: 'enthusiast',   category: 'achievement',   pointsReward: 250, eventsRequired: 10 },
    { name: 'Arena Legend',        description: 'Participated in 25 events',       icon: 'legend',       category: 'achievement',   pointsReward: 500, eventsRequired: 25 },
  ],
  create_event: [
    { name: 'Event Organizer',   description: 'Created your first event', icon: 'organizer',       category: 'contribution', pointsReward: 100 },
    { name: 'Community Builder', description: 'Created 5 events',         icon: 'builder',         category: 'contribution', pointsReward: 300, eventsRequired: 5 },
  ],
  create_team: [
    { name: 'Team Player',   description: 'Created a team',   icon: 'team-player',  category: 'participation', pointsReward: 30 },
  ],
  join_team: [
    { name: 'Collaborator', description: 'Joined a team',    icon: 'collaborator', category: 'participation', pointsReward: 15 },
  ],
  bookmark_event: [
    { name: 'Bookmarker', description: 'Bookmarked 10 events', icon: 'bookmarker', category: 'participation', pointsReward: 20, eventsRequired: 10 },
  ],
  complete_profile: [
    { name: 'Profile Pro', description: 'Completed your profile to 100%', icon: 'profile-pro', category: 'achievement', pointsReward: 75 },
  ],
  points_milestone: [
    { name: 'Rising Star',   description: 'Earned 500 points',  icon: 'rising-star',  category: 'milestone', pointsRequired: 500  },
    { name: 'Dev Champion',  description: 'Earned 1000 points', icon: 'champion',     category: 'milestone', pointsRequired: 1000 },
    { name: 'Arena Master',  description: 'Earned 2500 points', icon: 'master',       category: 'milestone', pointsRequired: 2500 },
    { name: 'Top Performer', description: 'Earned 5000 points', icon: 'top-performer',category: 'milestone', pointsRequired: 5000 },
  ],
};

const POINTS_ACTIONS = {
  register:         50,
  verify_email:     25,
  register_event:   20,
  create_event:     100,
  create_team:      30,
  join_team:        15,
  bookmark_event:   5,
  comment:          5,
  complete_profile: 75,
  win_event:        200,
  get_certificate:  50,
};

const checkAndAwardBadges = async (userId, action, metadata = {}) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    const definitions = BADGE_DEFINITIONS[action] || [];
    const newBadges   = [];
    let   pointsEarned = POINTS_ACTIONS[action] || 0;

    for (const badge of definitions) {
      const alreadyHas = user.badges.some(b => b.name === badge.name);
      if (alreadyHas) continue;

      let qualifies = true;
      if (badge.eventsRequired) {
        const count = metadata.eventCount || user.stats?.eventsJoined || 0;
        if (count < badge.eventsRequired) qualifies = false;
      }
      if (badge.pointsRequired && user.points < badge.pointsRequired) {
        qualifies = false;
      }

      if (qualifies) {
        user.badges.push({
          name:        badge.name,
          description: badge.description,
          icon:        badge.icon,
          category:    badge.category,
          earnedAt:    new Date(),
        });
        newBadges.push(badge);
        pointsEarned += badge.pointsReward || 0;
      }
    }

    // Points milestones — check after adding action points
    const newTotal = (user.points || 0) + pointsEarned;
    for (const badge of (BADGE_DEFINITIONS.points_milestone || [])) {
      const alreadyHas = user.badges.some(b => b.name === badge.name);
      if (!alreadyHas && newTotal >= badge.pointsRequired) {
        user.badges.push({
          name:        badge.name,
          description: badge.description,
          icon:        badge.icon,
          category:    badge.category,
          earnedAt:    new Date(),
        });
        newBadges.push(badge);
      }
    }

    if (pointsEarned > 0) {
      user.points = newTotal;
      if (!user.stats) user.stats = {};
      if (!user.stats.totalPointsEarned) user.stats.totalPointsEarned = 0;
      user.stats.totalPointsEarned += pointsEarned;
    }

    await user.save();
    return { newBadges, pointsEarned };
  } catch (err) {
    // Non-fatal — log and continue
    console.error('[gamification] error:', err.message);
    return { newBadges: [], pointsEarned: 0 };
  }
};

module.exports = { checkAndAwardBadges, BADGE_DEFINITIONS, POINTS_ACTIONS };
