/**
 * utils/generateToken.js
 * -----------------------
 * JWT Access Token Generator.
 *
 * [Gujarati સમજણ]
 * આ utility function JWT token generate કરે છે.
 * Token payload માં user ID અને role store થાય છે.
 * Secret key (.env માંથી) વાપરીને sign કરવામાં આવે છે.
 * Expiry .env ની JWT_EXPIRES_IN value (default: 7d) use કરે છે.
 *
 * Token ઉઠાવ્યા વગર authenticated routes access ન થઈ શકે.
 * Token client (frontend) store કરે, server stateless રહે.
 */

const jwt = require("jsonwebtoken");

/**
 * Generates a signed JWT token.
 * @param {Object} payload  - { id: userId, role: userRole }
 * @returns {string}         - signed JWT string
 */
const generateToken = (payload) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables.");
  }

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

module.exports = generateToken;
