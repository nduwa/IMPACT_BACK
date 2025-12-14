import jwt from 'jsonwebtoken';
import Users from '../models/rtc_users.js';
import Staff from '../models/rtc_staff.js';
import Station from '../models/rtc_station.js';
import Supplier from '../models/rtc_supplier.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

export const Routeguard = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "No authenticated token, access denied" });
    }

    const token = authHeader.split(" ")[1].trim();

    // 🔹 Verify JWT
    const decoded = jwt.verify(token, JWT_SECRET);

    // 🔹 Fetch user
    const user = await Users.findByPk(decoded.userid);
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found or token invalid" });
    }

    // 🔹 Fetch related staff
    const staff = await Staff.findOne({ where: { _kf_User: user.__kp_User } });

    // 🔹 Fetch related station (if staff exists)
    const station = staff ? await Station.findOne({ where: { __kp_Station: staff._kf_Station } }) : null;

    // 🔹 Fetch related supplier (if station exists)
    const supplier = station ? await Supplier.findOne({ where: { __kp_Supplier: station._kf_Supplier } }) : null;

    // 🔹 Attach full user info to request
    req.user = {
      ...decoded,
      userid: user.id,
      Name_User: user.Name_User,
      Name_Full: user.Name_Full,
      Role: user.Role,
      staffid: staff?.id || null,
      user_code: staff?.userID || null,
      staffName: staff?.Name || null,
      staffRole: staff?.Role || null,
      __kp_Station: station?.__kp_Station || null,
      station_name: station?.Name || null,
      station_ID: station?.StationID || null,
      station_location: station?.Area_Big || null,
      supplier_ID: supplier?.Supplier_ID_t || null,
      __kp_Supplier: supplier?.__kp_Supplier || null,
      supplier_name: supplier?.Name || null,
    };

    next();

  } catch (error) {
    console.error("Routeguard error:", error.message);

    // Handle JWT expiration or invalid signature
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Token expired. Please log in again." });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ success: false, message: "Invalid token. Access denied." });
    }

    return res.status(500).json({ success: false, message: "Authentication error." });
  }
};
