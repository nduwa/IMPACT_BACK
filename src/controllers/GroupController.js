import Group from "../models/rtc_groups.js";

class GroupController {
  static async getStationGroups(req, res) {
    try {
      const station = req.user?.__kp_Station;

      if (!station) {
        return res.status(400).json({
          success: false,
          message: "Station information is missing from user data.",
        });
      }

      const groupData = await Group.findAll({
        where: { _kf_Station: station },
      });

      return res.status(200).json({
        success: true,
        data: groupData,
      });
    } catch (error) {
      console.error("Error fetching station groups:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch station groups.",
        error: error.message,
      });
    }
  }

  static async getGeoJsonData(req, res) {

    const fs = require("fs");
    const csv = require("csv-parser");

    const features = [];

fs.createReadStream("Rwanda.csv")
  .pipe(csv())
  .on("data", (row) => {
    const lon = parseFloat(row.Longitude);
    const lat = parseFloat(row.Latitude);

    // Build properties ignoring Latitude and Longitude
    const { Latitude, Longitude, ...props } = row;

    features.push({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [lon, lat] // coordinates still use lat/lon
      },
      properties: props // lat/lon excluded here
    });
  })
  .on("end", () => {
    const geojson = {
      type: "FeatureCollection",
      features
    };

    fs.writeFileSync(
      "Rwanda_CAFE_practices_EUDR_data_updated.geojson",
      JSON.stringify(geojson, null, 2)
    );

    console.log("GeoJSON created successfully! Latitude and Longitude are ignored in properties.");
  });

  }
}

export default GroupController;
