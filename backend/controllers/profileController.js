const UserProfile = require('../models/UserProfile');
const User = require('../models/User');

// Create or update user profile
exports.createProfile = async (req, res) => {
  try {
    const { name, phoneNum, whatsappNum, age, city, bloodGroup } = req.body;
    const userId = req.userId;

    // Validate required fields
    if (!name || !phoneNum || !whatsappNum || !age || !city || !bloodGroup) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate age
    if (age < 18 || age > 65) {
      return res.status(400).json({ message: 'Age must be between 18 and 65' });
    }

    // Validate blood group
    const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    if (!validBloodGroups.includes(bloodGroup)) {
      return res.status(400).json({ message: 'Invalid blood group' });
    }

    // Check if profile already exists
    let profile = await UserProfile.findOne({ userId });

    if (profile) {
      // Update existing profile
      profile.name = name;
      profile.phoneNum = phoneNum;
      profile.whatsappNum = whatsappNum;
      profile.age = age;
      profile.city = city;
      profile.bloodGroup = bloodGroup;
      await profile.save();
    } else {
      // Create new profile
      profile = new UserProfile({
        userId,
        name,
        phoneNum,
        whatsappNum,
        age,
        city,
        bloodGroup
      });
      await profile.save();
    }

    res.json({ 
      message: 'Profile saved successfully',
      profile: {
        id: profile._id,
        name: profile.name,
        phoneNum: profile.phoneNum,
        whatsappNum: profile.whatsappNum,
        age: profile.age,
        city: profile.city,
        bloodGroup: profile.bloodGroup,
        isAvailable: profile.isAvailable,
        totalDonations: profile.totalDonations
      }
    });
  } catch (error) {
    console.error('Profile creation error:', error);
    res.status(500).json({ message: 'Server error during profile creation' });
  }
};

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.userId;

    const profile = await UserProfile.findOne({ userId }).populate('userId', 'email');
    
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json({
      profile: {
        id: profile._id,
        name: profile.name,
        phoneNum: profile.phoneNum,
        whatsappNum: profile.whatsappNum,
        age: profile.age,
        city: profile.city,
        bloodGroup: profile.bloodGroup,
        isAvailable: profile.checkAvailability(),
        totalDonations: profile.totalDonations,
        rating: profile.rating,
        lastDonationDate: profile.lastDonationDate,
        availableAfter: profile.availableAfter,
        email: profile.userId.email
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error while fetching profile' });
  }
};

// Get all available donors
exports.getAllDonors = async (req, res) => {
  try {
    const { bloodGroup, city, page = 1, limit = 10 } = req.query;
    const userId = req.userId;

    // Build query
    let query = { userId: { $ne: userId } }; // Exclude current user
    
    if (bloodGroup) {
      query.bloodGroup = bloodGroup;
    }
    
    if (city) {
      query.city = new RegExp(city, 'i'); // Case insensitive search
    }

    // Get total count
    const total = await UserProfile.countDocuments(query);

    // Get paginated results
    const donors = await UserProfile.find(query)
      .populate('userId', 'email')
      .select('name city bloodGroup isAvailable totalDonations rating availableAfter')
      .sort({ totalDonations: -1, rating: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Filter available donors
    const availableDonors = donors.filter(donor => donor.checkAvailability());

    res.json({
      donors: availableDonors.map(donor => ({
        id: donor._id,
        name: donor.name,
        city: donor.city,
        bloodGroup: donor.bloodGroup,
        totalDonations: donor.totalDonations,
        rating: donor.rating,
        isAvailable: donor.checkAvailability(),
        userId: donor.userId._id
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalDonors: total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get donors error:', error);
    res.status(500).json({ message: 'Server error while fetching donors' });
  }
};

// Update availability status
exports.updateAvailability = async (req, res) => {
  try {
    const { isAvailable } = req.body;
    const userId = req.userId;

    const profile = await UserProfile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    profile.isAvailable = isAvailable;
    await profile.save();

    res.json({ 
      message: 'Availability updated successfully',
      isAvailable: profile.checkAvailability()
    });
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({ message: 'Server error while updating availability' });
  }
};