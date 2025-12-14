import Mobile_App_Modules from '../models/rtc_mobile_app_modules.js';
import Mobile_App from '../models/rtc_mobile_app_access_control.js';

class AccessModulesController {
  static async AccessModules(req, res) {
    try {
      const modules = await Mobile_App_Modules.findAll();

      res.status(200).json(modules);
    } catch (error) {
      console.error('Error fetching mobile app modules:', error);
      res.status(500).json({ message: 'Failed to fetch mobile app modules.' });
    }
  }

  static async assignPhoneAccess(req, res) {
    const { modules } = req.body;
    const { userId } = req.params;

    try {
      // Step 1: Delete existing access records
      await Mobile_App.destroy({ where: { userid: userId, platform: 'mobile' || '', } });

      // Step 2: Insert new access records
      const newAccessRecords = modules.map((moduleId) => ({
        moduleid: moduleId,
        userid: userId,
        view_record: 1,
        platform: 'mobile',
      }));

      await Mobile_App.bulkCreate(newAccessRecords);

      res.json({ success: true, message: 'Access updated successfully.' });
    } catch (err) {
      console.error("Error assigning phone access:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async assignWebAccess(req, res) {
    const { userid, moduleid } = req.body;

    if (!userid || !Array.isArray(moduleid)) {
      return res.status(400).json({
        error: "userid and moduleid[] are required"
      });
    }

    try {
      await Mobile_App.destroy({
        where: { userid, platform: 'dashboard', state: '1' }
      });

      const newAccessRecords = moduleid.map((modId) => ({
        moduleid: modId,
        userid: userid,
        view_record: 1,
        add_record: 1,
        delete_record: 1,
        edit_record: 1,
        platform: 'dashboard',
        state: '1'
      }));

      await Mobile_App.bulkCreate(newAccessRecords);

      res.json({ success: true, message: 'Web access updated successfully.' });
    } catch (err) {
      console.error("Error assigning web access:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // Get all modules + assigned flag for given user
  static async getAssignedAccess(req, res) {
    const { userId } = req.params;
    try {
      const access = await Mobile_App.findAll({
        where: { userid: userId },
        attributes: ['moduleid'],
        raw: true,
      });
      res.json(access);
    } catch (err) {
      console.error('Error fetching assigned access:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get all modules + assigned flag for given user
  static async getUserAssignedAccess(req, res) {
    const userId = req.user?.userid;
    try {
      console.log("userAccess", userId);

      const access = await Mobile_App.findAll({
        where: { userid: userId, platform: 'dashboard', state: '1' },
        attributes: ['moduleid'],
        raw: true,
      });
      res.json(access);
    } catch (err) {
      console.error('Error fetching assigned access:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default AccessModulesController;
