import * as dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Users from '../models/rtc_users.js';
import Staff from '../models/rtc_staff.js';
import Station from '../models/rtc_station.js';
import { where } from 'sequelize';

const JWT_SECRET = process.env.JWT_SECRET;

class UserController {
  // Get all users
  static async getAllUsers(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const search = req.query.search ? req.query.search.trim().toLowerCase() : '';

      // Fetch all users and their staff
      const users = await Users.findAll({
        order: [['created_at', 'DESC']],
      });

      const userKeys = users.map((u) => u.__kp_User);
      const staffList = await Staff.findAll({
        where: { _kf_User: userKeys },
      });

      // Merge staff info
      let usersWithStaff = users.map((user) => {
        const staff = staffList.find((s) => s._kf_User === user.__kp_User);
        return {
          ...user.toJSON(),
          staff,
        };
      });

      // 🔍 In-memory search on combined user + staff fields
      if (search) {
        usersWithStaff = usersWithStaff.filter((u) => {
          const valuesToSearch = [
            u.Name_Full,
            u.Name_User,
            u.Email,
            u.staff?.Name,
            u.staff?.Phone,
            u.staff?.Role,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

          return valuesToSearch.includes(search);
        });
      }

      // 📄 Manual pagination
      const totalUsers = usersWithStaff.length;
      const totalPages = Math.ceil(totalUsers / limit);
      const paginatedUsers = usersWithStaff.slice((page - 1) * limit, page * limit);

      return res.status(200).json({
        status: 'success',
        currentPage: page,
        totalPages,
        totalUsers,
        users: paginatedUsers,
      });
    } catch (error) {
      return res.status(500).json({ status: 'fail', error: error.message });
    }
  }
  // Login user and return JWT token
  static async loginUser(req, res) {
    try {
      const Name_user = req.body.username?.trim();
      const { password } = req.body;

      if (!Name_user || !password) {
        return res.status(400).json({ message: 'All fields are required' });
      }

      // 🔹 Find user
      const user = await Users.findOne({ where: { Name_User: Name_user } });
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid username or password' });
      }

      // 🔹 Check password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid username or password' });
      }

      // 🔹 Ensure user is active
      if (user.status != 1) {
        return res.status(401).json({ success: false, message: 'Inactive user please contact admin' });
      }

      // 🔹 Find staff record
      const staff = await Staff.findOne({ where: { _kf_User: user.__kp_User } });
      if (!staff) {
        return res.status(404).json({ success: false, message: 'Staff record not found for this user' });
      }

      // 🔹 Ensure staff is active
      // if (staff.status != 1) {
      //   return res.status(401).json({ success: false, message: 'Inactive staff record, please contact admin' });
      // }

      // 🔹 Find station
      const station = await Station.findOne({ where: { __kp_Station: staff._kf_Station } });
      if (!station) {
        return res.status(404).json({ success: false, message: 'Station record not found for this user' });
      }

      // 🔹 Build payload
      const payload = {
        userid: user.id,
        __kp_User: user.__kp_User,
        userName: user.Name_Full,
        userRole: user.Role,
        staffid: staff.id,
        user_code: staff.userID,
        __kp_Staff: staff.__kp_Staff,
        staffName: staff.Name,
        staffRole: staff.Role,
        __kp_Station: station.__kp_Station,
        supplier: station._kf_Supplier,
        station_name: station.Name,
        station_ID: station.StationID,
        station_location: station.Area_Big,
      };

      // 🔹 Generate token
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

      return res.json({
        success: true,
        message: 'Login successful',
        token,
        user: payload,
      });

    } catch (error) {
      console.error("Login error:", error.message);
      return res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
    }
  }

  static async UserActivation(req, res) {
    try {
      const userId = req.params.userId;

      const user = await Users.findOne({ where: { __kp_User: userId } });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Toggle logic: if status is 1, set to 0; if 0, set to 1
      const newStatus = user.status === 1 ? 0 : 1;

      await Users.update(
        { status: newStatus },
        { where: { __kp_User: userId } }
      );

      return res.status(200).json({ message: 'User status toggled', status: newStatus });
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
  // PATCH /users/:userId/update-credentials
  static async updateCredentials(req, res) {
    const { userId } = req.params;
    const { password } = req.body;

    try {
      const hashed = await bcrypt.hash(password, 10); // use bcrypt
      await Users.update(
        { password: hashed },
        { where: { __kp_User: userId } }
      );
      res.json({ message: 'Credentials updated successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update user credentials' });
    }
  }
}

export default UserController;
