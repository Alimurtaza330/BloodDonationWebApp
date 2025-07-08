const BloodRequest = require('../models/BloodRequest');
const UserProfile = require('../models/UserProfile');
const Notification = require('../models/Notification');

// Send blood request
exports.sendBloodRequest = async (req, res) => {
  try {
    const { donorId, bloodGroup, urgency, message, hospitalName, hospitalAddress, requiredDate } = req.body;
    const requesterId = req.userId;

    // Validate required fields
    if (!donorId || !bloodGroup || !requiredDate) {
      return res.status(400).json({ message: 'Donor, blood group, and required date are required' });
    }

    // Check if donor exists and is available
    const donor = await UserProfile.findOne({ userId: donorId });
    if (!donor) {
      return res.status(404).json({ message: 'Donor not found' });
    }

    if (!donor.checkAvailability()) {
      return res.status(400).json({ message: 'Donor is not available for donation' });
    }

    // Check if there's already a pending request
    const existingRequest = await BloodRequest.findOne({
      requesterId,
      donorId,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'You already have a pending request to this donor' });
    }

    // Create new request
    const bloodRequest = new BloodRequest({
      requesterId,
      donorId,
      bloodGroup,
      urgency: urgency || 'medium',
      message,
      hospitalName,
      hospitalAddress,
      requiredDate: new Date(requiredDate)
    });

    await bloodRequest.save();

    // Create notification for donor
    const requesterProfile = await UserProfile.findOne({ userId: requesterId });
    if (requesterProfile) {
      const notification = new Notification({
        userId: donorId,
        type: 'blood_request',
        title: 'New Blood Request',
        message: `${requesterProfile.name} has requested ${bloodGroup} blood donation`,
        data: {
          requestId: bloodRequest._id,
          requesterName: requesterProfile.name,
          bloodGroup,
          urgency
        }
      });

      await notification.save();
    }

    res.json({ 
      message: 'Blood request sent successfully',
      request: {
        id: bloodRequest._id,
        donorId: bloodRequest.donorId,
        bloodGroup: bloodRequest.bloodGroup,
        status: bloodRequest.status,
        urgency: bloodRequest.urgency,
        createdAt: bloodRequest.createdAt
      }
    });
  }
  catch (error) {
    console.error('Send blood request error:', error);
    res.status(500).json({ message: 'Server error while sending blood request' });
  }
};

// Get requests sent by user
exports.getSentRequests = async (req, res) => {
  try {
    const requesterId = req.userId;
    const { status, page = 1, limit = 10 } = req.query;

    let query = { requesterId };
    if (status) {
      query.status = status;
    }

    const requests = await BloodRequest.find(query)
      .populate('donorId', 'name city bloodGroup phoneNum whatsappNum')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await BloodRequest.countDocuments(query);

    res.json({
      requests: requests.map(req => ({
        _id: req._id,
        donorName: req.donorId?.name || 'Unknown',
        donor: req.donorId,
        bloodGroup: req.bloodGroup,
        status: req.status,
        urgency: req.urgency,
        message: req.message,
        hospitalName: req.hospitalName,
        hospitalAddress: req.hospitalAddress,
        requiredDate: req.requiredDate,
        createdAt: req.createdAt,
        acceptedAt: req.acceptedAt,
        completedAt: req.completedAt,
        donationCompleted: req.donationCompleted
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalRequests: total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get sent requests error:', error);
    res.status(500).json({ message: 'Server error while fetching sent requests' });
  }
};

// Get requests received by user
exports.getReceivedRequests = async (req, res) => {
  try {
    const donorId = req.userId;
    const { status, page = 1, limit = 10 } = req.query;

    let query = { donorId };
    if (status) {
      query.status = status;
    }

    const requests = await BloodRequest.find(query)
      .populate('requesterId', 'name city bloodGroup phoneNum whatsappNum')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await BloodRequest.countDocuments(query);

    res.json({
      requests: requests.map(req => ({
        _id: req._id,
        requesterName: req.requesterId?.name || 'Unknown',
        requester: req.requesterId,
        bloodGroup: req.bloodGroup,
        status: req.status,
        urgency: req.urgency,
        message: req.message,
        hospitalName: req.hospitalName,
        hospitalAddress: req.hospitalAddress,
        requiredDate: req.requiredDate,
        createdAt: req.createdAt,
        acceptedAt: req.acceptedAt,
        completedAt: req.completedAt,
        donationCompleted: req.donationCompleted
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalRequests: total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get received requests error:', error);
    res.status(500).json({ message: 'Server error while fetching received requests' });
  }
};

// Accept blood request
exports.acceptRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const donorId = req.userId;



    // First find the request by ID only
    const anyRequest = await BloodRequest.findById(requestId);
    if (!anyRequest) {
      return res.status(404).json({ message: 'Request not found with this ID' });
    }

    if (!anyRequest.donorId) {
      return res.status(400).json({ message: 'Request does not have a donor.' });
    }

    // Convert ObjectId to string for comparison
    const requestDonorIdStr = anyRequest.donorId.toString();
    const userIdStr = donorId.toString();

    // Check if the authenticated user is the donor for this request
    if (requestDonorIdStr !== userIdStr) {
      return res.status(403).json({ message: 'You are not authorized to accept this request' });
    }

    if (anyRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Request is not pending' });
    }

    // Update request status
    anyRequest.status = 'accepted';
    anyRequest.acceptedAt = new Date();
    await anyRequest.save();

    // Create notification for requester
    if (anyRequest.requesterId) {
      const donorProfile = await UserProfile.findOne({ userId: donorId });
      if (donorProfile) {
        const notification = new Notification({
          userId: anyRequest.requesterId,
          type: 'request_accepted',
          title: 'Blood Request Accepted',
          message: `${donorProfile.name} has accepted your blood request`,
          data: {
            requestId: anyRequest._id,
            donorName: donorProfile.name,
            donorPhone: donorProfile.phoneNum,
            donorWhatsApp: donorProfile.whatsappNum
          }
        });

        await notification.save();
      } else {
        // This case should ideally not happen if the request was created correctly
        // but as a safeguard:
        console.error(`Donor profile not found for userId: ${donorId}`);
        // For now, let's skip notification and still consider the request accepted
      }
    } else {
      console.error(`Requester ID not found on request: ${anyRequest._id}`);
    }

    res.json({ 
      message: 'Request accepted successfully',
      request: {
        id: anyRequest._id,
        status: anyRequest.status,
        acceptedAt: anyRequest.acceptedAt
      }
    });
  } catch (error) {
    console.error('Accept request error:', error);
    res.status(500).json({ message: 'Server error while accepting request' });
  }
};

// Reject blood request
exports.rejectRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const donorId = req.userId;



    // First find the request by ID only
    const anyRequest = await BloodRequest.findById(requestId);
    if (!anyRequest) {
      return res.status(404).json({ message: 'Request not found with this ID' });
    }

    if (!anyRequest.donorId) {
      return res.status(400).json({ message: 'Request does not have a donor.' });
    }

    // Convert ObjectId to string for comparison
    const requestDonorIdStr = anyRequest.donorId.toString();
    const userIdStr = donorId.toString();
    
    // Check if the authenticated user is the donor for this request
    if (requestDonorIdStr !== userIdStr) {
      return res.status(403).json({ message: 'You are not authorized to reject this request' });
    }

    if (anyRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Request is not pending' });
    }

    // Update request status
    anyRequest.status = 'rejected';
    await anyRequest.save();

    // Create notification for requester
    if (anyRequest.requesterId) {
      const donorProfile = await UserProfile.findOne({ userId: donorId });
      if (donorProfile) {
        const notification = new Notification({
          userId: anyRequest.requesterId,
          type: 'request_rejected',
          title: 'Blood Request Rejected',
          message: `${donorProfile.name} has rejected your blood request`,
          data: {
            requestId: anyRequest._id,
            donorName: donorProfile.name
          }
        });

        await notification.save();
      } else {
        console.error(`Donor profile not found for userId: ${donorId}`);
      }
    } else {
      console.error(`Requester ID not found on request: ${anyRequest._id}`);
    }

    res.json({ 
      message: 'Request rejected successfully',
      request: {
        id: anyRequest._id,
        status: anyRequest.status
      }
    });
  } catch (error) {
    console.error('Reject request error:', error);
    res.status(500).json({ message: 'Server error while rejecting request' });
  }
};

// Mark donation as completed
exports.markDonationCompleted = async (req, res) => {
  try {
    const { requestId } = req.params;
    const requesterId = req.userId;



    // First find the request by ID only
    const anyRequest = await BloodRequest.findById(requestId);
    if (!anyRequest) {
      return res.status(404).json({ message: 'Request not found with this ID' });
    }

    if (!anyRequest.requesterId) {
      return res.status(400).json({ message: 'Request does not have a requester.' });
    }

    // Convert ObjectId to string for comparison
    const requestRequesterIdStr = anyRequest.requesterId.toString();
    const userIdStr = requesterId.toString();
    
    // Check if the authenticated user is the requester for this request
    if (requestRequesterIdStr !== userIdStr) {
      return res.status(403).json({ message: 'You are not authorized to mark this donation as completed' });
    }

    if (anyRequest.status !== 'accepted') {
      return res.status(400).json({ message: 'Request is not accepted' });
    }

    // Update request status
    anyRequest.status = 'completed';
    anyRequest.donationCompleted = true;
    anyRequest.completedAt = new Date();
    await anyRequest.save();

    // Update donor profile - mark as unavailable for 5 months
    const donorProfile = await UserProfile.findOne({ userId: anyRequest.donorId });
    if (donorProfile) {
      await donorProfile.markAsDonated();
    }

    // Create notification for donor
    const requesterProfile = await UserProfile.findOne({ userId: requesterId });
    if (requesterProfile) {
      const notification = new Notification({
        userId: anyRequest.donorId,
        type: 'donation_completed',
        title: 'Donation Completed',
        message: `${requesterProfile.name} has marked the donation as completed. You will be available for donation again in 5 months.`,
        data: {
          requestId: anyRequest._id,
          requesterName: requesterProfile.name
        }
      });
      await notification.save();
    } else {
      console.error(`Requester profile not found for userId: ${requesterId}`);
    }

    res.json({ 
      message: 'Donation marked as completed successfully',
      request: {
        id: anyRequest._id,
        status: anyRequest.status,
        completedAt: anyRequest.completedAt
      }
    });
  } catch (error) {
    console.error('Mark donation completed error:', error);
    res.status(500).json({ message: 'Server error while marking donation as completed' });
  }
};