const { prisma } = require('../config/database');

const createTeam = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Team name is required' });

    const team = await prisma.team.create({
      data: {
        name,
        ownerId: req.user.userId,
        members: {
          create: {
            userId: req.user.userId,
            role: 'OWNER'
          }
        }
      },
      include: {
        members: true
      }
    });

    res.status(201).json({ message: 'Team created successfully', team });
  } catch (error) {
    console.error('Error creating team:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getTeams = async (req, res) => {
  try {
    const teams = await prisma.team.findMany({
      where: {
        members: {
          some: {
            userId: req.user.userId
          }
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        _count: {
          select: { apiKeys: true, usageLogs: true }
        }
      }
    });

    res.json({ teams });
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const inviteMember = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team || team.ownerId !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to invite members to this team' });
    }

    const invitee = await prisma.user.findUnique({ where: { email } });
    if (!invitee) {
      return res.status(404).json({ message: 'User with this email not found' });
    }

    const existing = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId: invitee.id
        }
      }
    });
    if (existing) {
      return res.status(400).json({ message: 'User is already a member of this team' });
    }

    const member = await prisma.teamMember.create({
      data: {
        teamId,
        userId: invitee.id,
        role: 'MEMBER'
      },
      include: {
        user: { select: { id: true, name: true, email: true } }
      }
    });

    res.status(200).json({ message: 'Member invited successfully', member });
  } catch (error) {
    console.error('Error inviting member:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  createTeam,
  getTeams,
  inviteMember
};
