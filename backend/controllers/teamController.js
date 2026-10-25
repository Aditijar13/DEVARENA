const Team = require('../models/Team');
const Event = require('../models/Event');
const User = require('../models/User');
const Chat = require('../models/Chat');
const { sendNotification } = require('../utils/notificationService');
const { checkAndAwardBadges } = require('../utils/gamification');

// @desc    Get teams for an event
// @route   GET /api/teams/event/:eventId
// @access  Public
const getTeamsByEvent = async (req, res) => {
  try {
    const { search, isOpen, requiredSkill, page = 1, limit = 10 } = req.query;
    const query = { event: req.params.eventId };

    if (isOpen !== undefined) query.isOpen = isOpen === 'true';
    if (search) query.$text = { $search: search };
    if (requiredSkill) query.requiredSkills = requiredSkill;

    const total = await Team.countDocuments(query);
    const teams = await Team.find(query)
      .populate('leader', 'name avatar skills headline')
      .populate('members.user', 'name avatar skills headline')
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    return res.status(200).json({
      success: true,
      total,
      teams,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create team
// @route   POST /api/teams
// @access  Private
const createTeam = async (req, res) => {
  try {
    const { name, description, eventId, maxSize, requiredSkills, openRoles, isOpen } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    if (!event.isTeamEvent) {
      return res.status(400).json({ success: false, message: 'This event does not support teams.' });
    }

    // Check if user already in a team for this event
    const existingTeam = await Team.findOne({
      event: eventId,
      'members.user': req.user.id,
    });
    if (existingTeam) {
      return res.status(400).json({
        success: false,
        message: 'You are already in a team for this event.',
      });
    }

    // Create team chat room
    const chatRoom = await Chat.create({
      type: 'team',
      name,
      participants: [req.user.id],
    });

    const team = await Team.create({
      name,
      description,
      event: eventId,
      leader: req.user.id,
      members: [{
        user: req.user.id,
        role: 'leader',
        skills: req.user.skills || [],
      }],
      maxSize: Math.min(maxSize || event.maxTeamSize, event.maxTeamSize),
      requiredSkills: requiredSkills || [],
      openRoles: openRoles || [],
      isOpen: isOpen !== undefined ? isOpen : true,
      chatRoom: chatRoom._id,
    });

    // Link chat to team
    chatRoom.team = team._id;
    await chatRoom.save();

    // Update user stats
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { 'stats.teamsCreated': 1, points: 30 },
    });

    await checkAndAwardBadges(req.user.id, 'create_team');

    return res.status(201).json({
      success: true,
      message: 'Team created successfully!',
      team: await team.populate('leader', 'name avatar skills'),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single team
// @route   GET /api/teams/:id
// @access  Public
const getTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('leader', 'name avatar skills headline bio socialLinks')
      .populate('members.user', 'name avatar skills headline')
      .populate('event', 'title slug startDate endDate status banner')
      .populate('joinRequests.user', 'name avatar skills');

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found.' });
    }

    return res.status(200).json({ success: true, team });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Send team invite
// @route   POST /api/teams/:id/invite
// @access  Private (Team Leader)
const inviteMember = async (req, res) => {
  try {
    const { userId } = req.body;
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found.' });
    }

    if (team.leader.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only the team leader can send invites.' });
    }

    if (team.members.length >= team.maxSize) {
      return res.status(400).json({ success: false, message: 'Team is full.' });
    }

    // Check if already a member
    if (team.members.some((m) => m.user.toString() === userId)) {
      return res.status(400).json({ success: false, message: 'User is already a team member.' });
    }

    // Check if invite already sent
    const existingInvite = team.invites.find(
      (inv) => inv.user && inv.user.toString() === userId && inv.status === 'pending'
    );
    if (existingInvite) {
      return res.status(400).json({ success: false, message: 'Invite already sent.' });
    }

    team.invites.push({
      user: userId,
      invitedBy: req.user.id,
    });
    await team.save();

    await sendNotification(req.io, userId, {
      type: 'team_invite',
      title: ' Team Invite!',
      message: `${req.user.name} invited you to join team "${team.name}"`,
      link: `/teams/${team._id}`,
      data: { teamId: team._id },
    });

    return res.status(200).json({
      success: true,
      message: 'Invite sent successfully!',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Respond to team invite
// @route   PUT /api/teams/:id/invite/respond
// @access  Private
const respondToInvite = async (req, res) => {
  try {
    const { accept } = req.body;
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found.' });
    }

    const invite = team.invites.find(
      (inv) => inv.user && inv.user.toString() === req.user.id && inv.status === 'pending'
    );

    if (!invite) {
      return res.status(404).json({ success: false, message: 'No pending invite found.' });
    }

    if (accept) {
      if (team.members.length >= team.maxSize) {
        return res.status(400).json({ success: false, message: 'Team is now full.' });
      }

      invite.status = 'accepted';
      team.members.push({
        user: req.user.id,
        role: 'member',
        skills: req.user.skills || [],
      });

      // Add to chat room
      if (team.chatRoom) {
        await Chat.findByIdAndUpdate(team.chatRoom, {
          $addToSet: { participants: req.user.id },
        });
      }

      await User.findByIdAndUpdate(req.user.id, {
        $inc: { 'stats.teamsJoined': 1, points: 15 },
      });

      await checkAndAwardBadges(req.user.id, 'join_team');

      // Notify leader
      await sendNotification(req.io, team.leader, {
        type: 'team_invite_accepted',
        title: 'Invite Accepted',
        message: `${req.user.name} has joined your team "${team.name}"!`,
        link: `/teams/${team._id}`,
      });
    } else {
      invite.status = 'rejected';
    }

    await team.save();

    return res.status(200).json({
      success: true,
      message: accept ? 'You have joined the team!' : 'Invite declined.',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Request to join team
// @route   POST /api/teams/:id/request
// @access  Private
const requestToJoin = async (req, res) => {
  try {
    const { message, skills } = req.body;
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found.' });
    }

    if (!team.isOpen) {
      return res.status(400).json({ success: false, message: 'This team is not accepting requests.' });
    }

    if (team.members.some((m) => m.user.toString() === req.user.id)) {
      return res.status(400).json({ success: false, message: 'You are already a member.' });
    }

    const existingRequest = team.joinRequests.find(
      (r) => r.user.toString() === req.user.id && r.status === 'pending'
    );
    if (existingRequest) {
      return res.status(400).json({ success: false, message: 'Request already sent.' });
    }

    team.joinRequests.push({
      user: req.user.id,
      message,
      skills: skills || [],
    });
    await team.save();

    await sendNotification(req.io, team.leader, {
      type: 'team_join_request',
      title: 'Join Request',
      message: `${req.user.name} wants to join your team "${team.name}"`,
      link: `/teams/${team._id}`,
    });

    return res.status(200).json({
      success: true,
      message: 'Join request sent successfully!',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Respond to join request
// @route   PUT /api/teams/:id/request/:requestId
// @access  Private (Team Leader)
const respondToRequest = async (req, res) => {
  try {
    const { accept } = req.body;
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found.' });
    }

    if (team.leader.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only leader can respond.' });
    }

    const request = team.joinRequests.id(req.params.requestId);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    if (accept) {
      if (team.members.length >= team.maxSize) {
        return res.status(400).json({ success: false, message: 'Team is full.' });
      }
      request.status = 'accepted';
      team.members.push({
        user: request.user,
        role: 'member',
      });

      if (team.chatRoom) {
        await Chat.findByIdAndUpdate(team.chatRoom, {
          $addToSet: { participants: request.user },
        });
      }
    } else {
      request.status = 'rejected';
    }

    await team.save();

    await sendNotification(req.io, request.user, {
      type: accept ? 'team_invite_accepted' : 'team_invite_rejected',
      title: accept ? 'Request Accepted!' : 'Request Update',
      message: accept
        ? `Your request to join "${team.name}" has been accepted!`
        : `Your request to join "${team.name}" was declined.`,
      link: `/teams/${team._id}`,
    });

    return res.status(200).json({
      success: true,
      message: accept ? 'Member added to team!' : 'Request rejected.',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Leave team
// @route   DELETE /api/teams/:id/leave
// @access  Private
const leaveTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found.' });
    }

    if (team.leader.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Leader cannot leave. Transfer leadership first or delete the team.',
      });
    }

    team.members = team.members.filter((m) => m.user.toString() !== req.user.id);

    if (team.chatRoom) {
      await Chat.findByIdAndUpdate(team.chatRoom, {
        $pull: { participants: req.user.id },
      });
    }

    await team.save();

    return res.status(200).json({ success: true, message: 'You have left the team.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update team
// @route   PUT /api/teams/:id
// @access  Private (Team Leader)
const updateTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found.' });
    }

    if (team.leader.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    const updatedTeam = await Team.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('members.user', 'name avatar skills');

    return res.status(200).json({ success: true, team: updatedTeam });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getTeamsByEvent,
  createTeam,
  getTeam,
  inviteMember,
  respondToInvite,
  requestToJoin,
  respondToRequest,
  leaveTeam,
  updateTeam,
};
