const { prisma } = require('../config/database');

const getAlerts = async (req, res) => {
  try {
    const alerts = await prisma.alert.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    res.json({ alerts });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const markAlertAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const alert = await prisma.alert.update({
      where: { id, userId: req.user.userId },
      data: { isRead: true }
    });
    res.json({ message: 'Alert marked as read', alert });
  } catch (error) {
    console.error('Error marking alert read:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const markAllAlertsAsRead = async (req, res) => {
  try {
    await prisma.alert.updateMany({
      where: { userId: req.user.userId, isRead: false },
      data: { isRead: true }
    });
    res.json({ message: 'All alerts marked as read' });
  } catch (error) {
    console.error('Error marking alerts read:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getAlerts,
  markAlertAsRead,
  markAllAlertsAsRead
};
