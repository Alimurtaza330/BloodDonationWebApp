import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaTint, FaUser, FaUsers, FaBell, FaHandHoldingMedical, FaPhoneAlt, FaWhatsapp, FaCheckCircle } from 'react-icons/fa';

const DetailPage = () => {
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Add these missing state variables
  const [activeTab, setActiveTab] = useState('profile');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [shakeNotif, setShakeNotif] = useState(false);
  const prevUnreadCount = useRef(0);

  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [requestLoading, setRequestLoading] = useState(false);
  
  // Enhanced request form state
  const [requestForm, setRequestForm] = useState({
    message: '',
    urgency: 'medium',
    hospitalName: '',
    hospitalAddress: '',
    requiredDate: ''
  });

  const [formData, setFormData] = useState({
    name: '',
    phoneNum: '',
    whatsappNum: '',
    age: '',
    city: '',
    bloodGroup: ''
  });
  const [donors, setDonors] = useState([]);
  const [donorsLoading, setDonorsLoading] = useState(false);
  const [donorFilters, setDonorFilters] = useState({
    bloodGroup: '',
    city: '',
    page: 1
  });

  // Add state for managing requests
  const [sentRequests, setSentRequests] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [showRequestsTab, setShowRequestsTab] = useState('sent');

  const navigate = useNavigate();
  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  // Get token from localStorage
  const getToken = () => {
    return localStorage.getItem('token');
  };

  // Set up axios defaults
  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate('/');
      return;
    }
    
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    fetchProfile();
    fetchNotifications();
  }, [navigate]);

  // Fetch user profile
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await axios.get('https://bloodonationwebapp.vercel.app/api/profile/me');
      setProfile(response.data.profile);
      setFormData({
        name: response.data.profile.name || '',
        phoneNum: response.data.profile.phoneNum || '',
        whatsappNum: response.data.profile.whatsappNum || '',
        age: response.data.profile.age || '',
        city: response.data.profile.city || '',
        bloodGroup: response.data.profile.bloodGroup || ''
      });
      setIsEditing(false);
      // Fetch all donors after profile is loaded
      fetchDonors();
      // Fetch user's requests
      fetchUserRequests();
    } catch (err) {
      console.error('Fetch profile error:', err);
      if (err.response?.status === 404) {
        // Profile doesn't exist, show create form
        setIsEditing(true);
      } else if (err.response?.status === 401) {
        // Token invalid, redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
      } else {
        setError('Failed to fetch profile');
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch available donors
  const fetchDonors = async () => {
    try {
      setDonorsLoading(true);
      const queryParams = new URLSearchParams();
      if (donorFilters.bloodGroup) queryParams.append('bloodGroup', donorFilters.bloodGroup);
      if (donorFilters.city) queryParams.append('city', donorFilters.city);
      queryParams.append('page', donorFilters.page);
      queryParams.append('limit', '10');

      const response = await axios.get(`https://bloodonationwebapp.vercel.app/api/profile/donors?${queryParams}`);
      setDonors(response.data.donors);
    } catch (err) {
      console.error('Fetch donors error:', err);
      setError('Failed to fetch donors');
    } finally {
      setDonorsLoading(false);
    }
  };

  // NEW: Fetch user's sent and received requests
  const fetchUserRequests = async () => {
    try {
      // Fetch sent requests
      const sentResponse = await axios.get('https://bloodonationwebapp.vercel.app/api/requests/sent');
      setSentRequests(sentResponse.data.requests);

      // Fetch received requests
      const receivedResponse = await axios.get('https://bloodonationwebapp.vercel.app/api/requests/received');
      setReceivedRequests(receivedResponse.data.requests);
    } catch (err) {
      console.error('Fetch requests error:', err);
      setError('Failed to fetch requests');
    }
  };

  // NEW: Send blood request
  const sendBloodRequest = async () => {
    if (!selectedDonor) return;

    try {
      setRequestLoading(true);
      setError('');
      
      const requestData = {
        donorId: selectedDonor.userId,
        bloodGroup: selectedDonor.bloodGroup,
        urgency: requestForm.urgency,
        message: requestForm.message,
        hospitalName: requestForm.hospitalName,
        hospitalAddress: requestForm.hospitalAddress,
        requiredDate: requestForm.requiredDate
      };

      const response = await axios.post('https://bloodonationwebapp.vercel.app/api/requests/send', requestData);
      
      setSuccess('Blood request sent successfully!');
      setShowRequestModal(false);
      resetRequestForm();
      
      // Refresh requests
      fetchUserRequests();
    } catch (err) {
      console.error('Send request error:', err);
      const errorMessage = err.response?.data?.message || 'Failed to send request';
      setError(errorMessage);
    } finally {
      setRequestLoading(false);
    }
  };

  // NEW: Accept blood request
  const acceptRequest = async (requestId) => {
    try {
      setRequestLoading(true);
      const response = await axios.put(`https://bloodonationwebapp.vercel.app/api/requests/accept/${requestId}`);
      setSuccess('Request accepted successfully!');
      // Refresh both requests and notifications to ensure we have the latest data
      fetchUserRequests();
      fetchNotifications();
    } catch (err) {
      console.error('Accept request error:', err);
      setError(err.response?.data?.message || 'Failed to accept request');
    } finally {
      setRequestLoading(false);
    }
  };

  // NEW: Reject blood request
  const rejectRequest = async (requestId) => {
    try {
      setRequestLoading(true);
      await axios.put(`https://bloodonationwebapp.vercel.app/api/requests/reject/${requestId}`);
      setSuccess('Request rejected successfully!');
      fetchUserRequests();
    } catch (err) {
      console.error('Reject request error:', err);
      setError(err.response?.data?.message || 'Failed to reject request');
    } finally {
      setRequestLoading(false);
    }
  };

  // NEW: Mark donation as completed
  const markDonationCompleted = async (requestId) => {
    try {
      setRequestLoading(true);
      await axios.put(`https://bloodonationwebapp.vercel.app/api/requests/complete/${requestId}`);
      setSuccess('Donation marked as completed!');
      fetchUserRequests();
    } catch (err) {
      console.error('Complete donation error:', err);
      setError(err.response?.data?.message || 'Failed to mark donation as completed');
    } finally {
      setRequestLoading(false);
    }
  };

  // NEW: Handle request form changes
  const handleRequestFormChange = (e) => {
    setRequestForm({
      ...requestForm,
      [e.target.name]: e.target.value
    });
  };

  // NEW: Reset request form
  const resetRequestForm = () => {
    setRequestForm({
      message: '',
      urgency: 'medium',
      hospitalName: '',
      hospitalAddress: '',
      requiredDate: ''
    });
    setSelectedDonor(null);
  };

  // NEW: Open request modal
  const openRequestModal = (donor) => {
    setSelectedDonor(donor);
    setShowRequestModal(true);
    setError('');
    setSuccess('');
  };

  // NEW: Close request modal
  const closeRequestModal = () => {
    setShowRequestModal(false);
    resetRequestForm();
  };

  // NEW: Get status color for requests
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // NEW: Get urgency color
  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle form input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      setLoading(true);
      const response = await axios.post('https://bloodonationwebapp.vercel.app/api/profile/create', formData);
      setProfile(response.data.profile);
      setSuccess('Profile saved successfully!');
      setIsEditing(false);
      // Fetch donors after profile creation
      fetchDonors();
    } catch (err) {
      console.error('Profile save error:', err);
      const errorMessage = err.response?.data?.message || 'Failed to save profile';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Toggle availability
  const toggleAvailability = async () => {
    try {
      const response = await axios.put('https://bloodonationwebapp.vercel.app/api/profile/availability', {
        isAvailable: !profile.isAvailable
      });
      setProfile({ ...profile, isAvailable: response.data.isAvailable });
      setSuccess(`You're now ${response.data.isAvailable ? 'available' : 'unavailable'} for donations!`);
    } catch (err) {
      console.error('Update availability error:', err);
      setError('Failed to update availability');
    }
  };

  // Handle search
  const handleSearch = () => {
    fetchDonors();
  };

  // Clear search filters
  const clearFilters = () => {
    setDonorFilters({
      bloodGroup: '',
      city: '',
      page: 1
    });
    // Reset filters and fetch all donors
    setTimeout(() => {
      fetchDonors();
    }, 0);
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };


    // Fetch notifications
    const fetchNotifications = async () => {
      try {
        const response = await axios.get('https://bloodonationwebapp.vercel.app/api/notifications');
        setNotifications(response.data.notifications);
        
        // Get unread count
        const unreadResponse = await axios.get('https://bloodonationwebapp.vercel.app/api/notifications/unread-count');
        setUnreadCount(unreadResponse.data.count);
      } catch (err) {
        console.error('Fetch notifications error:', err);
      }
    };
  
    // Mark a notification as read
    const markAsRead = async (notificationId) => {
      try {
        await axios.put(`https://bloodonationwebapp.vercel.app/api/notifications/read/${notificationId}`);
        fetchNotifications();
      } catch (err) {
        console.error('Mark as read error:', err);
      }
    };

  useEffect(() => {
    // Fetch initial data
    fetchUserRequests();
    fetchNotifications();

    // Set up interval to refresh every second
    const interval = setInterval(() => {
      fetchUserRequests();
      fetchNotifications();
    }, 1000);

    // Clean up interval on unmount
    return () => clearInterval(interval);
  }, []);

  // When profile is loaded or updated, sync formData
  useEffect(() => {
    if (profile && isEditing) {
      setFormData({
        name: profile.name || '',
        phoneNum: profile.phoneNum || '',
        whatsappNum: profile.whatsappNum || '',
        age: profile.age || '',
        city: profile.city || '',
        bloodGroup: profile.bloodGroup || ''
      });
    }
  }, [profile, isEditing]);

  // Watch for unreadCount changes to trigger shake
  useEffect(() => {
    if (unreadCount > prevUnreadCount.current) {
      setShakeNotif(true);
      setTimeout(() => setShakeNotif(false), 600); // duration of shake
    }
    prevUnreadCount.current = unreadCount;
  }, [unreadCount]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }


  return (
    
<div className="min-h-screen text-black bg-gradient-to-br from-red-50 via-white to-red-100 bg-fixed rounded-2xl md:rounded-[3rem] shadow-xl overflow-hidden">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-2">
              <FaTint className="text-red-600 text-3xl" />
              <h1 className="text-2xl font-bold text-red-600 tracking-wide">BloodDonation</h1>
            </div>
            <div className="flex items-center">
              <div className="relative mr-4">
                <button onClick={() => setActiveTab('notifications')} className="text-gray-600 hover:text-red-600">
                  <FaBell className="h-6 w-6" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 flex items-center space-x-2"
              >
                <FaHandHoldingMedical className="mr-2" /> Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Alerts */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded shadow">
            <div className="flex">
              <div className="py-1">
                <svg className="h-6 w-6 text-red-500 mr-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>{error}</div>
            </div>
          </div>
        )}
        {success && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded shadow">
            <div className="flex">
              <div className="py-1">
                <svg className="h-6 w-6 text-green-500 mr-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>{success}</div>
            </div>
          </div>
        )}
        
        {isEditing ? (
          <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
            <h2 className="text-xl font-semibold mb-4">Create / Edit Profile</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
    
            <input
              type="text"
              name="name"
              placeholder="Name"
              value={formData.name}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
            />
            <input
              type="text"
              name="phoneNum"
              placeholder="Phone Number"
              value={formData.phoneNum}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
            />
            <input
              type="text"
              name="whatsappNum"
              placeholder="WhatsApp Number"
              value={formData.whatsappNum}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
            />
            <input
              type="number"
              name="age"
              placeholder="Age"
              value={formData.age}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
            />
            <input
              type="text"
              name="city"
              placeholder="City"
              value={formData.city}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
            />
            <select
              name="bloodGroup"
              value={formData.bloodGroup}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
            >
              <option value="">Select Blood Group</option>
              {bloodGroups.map(bg => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
            <button
                type="submit"
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 w-full"
              >
                Save Profile
              </button>
            </form>
          </div>
        ) : (
          <div>
            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6 bg-white rounded-t-lg shadow-sm">
              <nav className="-mb-px flex space-x-8 justify-center">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`${activeTab === 'profile' ? 'border-red-500 text-red-600 bg-red-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm flex items-center space-x-2 rounded-t-lg`}
                >
                  <FaUser /> <span>My Profile</span>
                </button>
                <button
                  onClick={() => setActiveTab('donors')}
                  className={`${activeTab === 'donors' ? 'border-red-500 text-red-600 bg-red-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm flex items-center space-x-2 rounded-t-lg`}
                >
                  <FaUsers /> <span>Find Donors</span>
                </button>
                <button
                  onClick={() => setActiveTab('requests')}
                  className={`${activeTab === 'requests' ? 'border-red-500 text-red-600 bg-red-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm flex items-center space-x-2 rounded-t-lg`}
                >
                  <FaHandHoldingMedical /> <span>My Requests</span>
                </button>
                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`${activeTab === 'notifications' ? 'border-red-500 text-red-600 bg-red-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm flex items-center space-x-2 rounded-t-lg relative`}
                >
                  <span className={shakeNotif ? 'shake-notif' : ''}><FaBell /></span> <span>Notifications</span>
                  {unreadCount > 0 && (
                    <>
                      <span className="ml-2 bg-red-600 text-white rounded-full w-5 h-5 inline-flex items-center justify-center text-xs">
                        {unreadCount}
                      </span>
                      <span className="absolute top-2 right-2 animate-ping inline-flex h-3 w-3 rounded-full bg-red-500 opacity-75 z-10"></span>
                    </>
                  )}
                </button>
              </nav>
            </div>
            
            {/* Profile Tab */}
            {activeTab === 'profile' && !isEditing && profile && (
              <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-lg flex flex-col items-center space-y-6 mt-8 border border-red-100 relative">
                {/* Avatar with blood drop background */}
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-red-200 to-red-400 flex items-center justify-center text-5xl font-bold text-white shadow-lg border-4 border-white relative">
                  <FaTint className="absolute text-red-500 text-6xl opacity-30 -z-10" style={{top: '-10px', left: '-10px'}} />
                  {profile.name ? profile.name[0] : '?'}
                </div>
                <div className="flex flex-col items-center space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-semibold text-gray-800">{profile.name}</span>
                    <span className="bg-red-600 text-white px-4 py-1 rounded-full text-base font-bold shadow">{profile.bloodGroup}</span>
                  </div>
                  {profile.email && (
                    <span className="text-gray-500 text-sm">{profile.email}</span>
                  )}
                  <span className="text-gray-600 text-base">{profile.city}</span>
                  <span className="text-gray-600 text-base">Age: {profile.age}</span>
                </div>
                <div className="flex flex-col w-full space-y-2 mt-2">
                  <div className="flex items-center space-x-2">
                    <FaPhoneAlt className="text-gray-400" />
                    <span className="text-gray-700 font-medium">{profile.phoneNum}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FaWhatsapp className="text-green-500" />
                    <span className="text-gray-700 font-medium">{profile.whatsappNum}</span>
                  </div>
                </div>
                <div className="flex space-x-3 mt-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium shadow ${profile.isAvailable ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-500'}`}>{profile.isAvailable ? 'Available' : 'Unavailable'}</span>
                </div>
                <div className="flex space-x-4 mt-6 w-full justify-center">
                  <button
                    onClick={toggleAvailability}
                    className={`px-5 py-2 rounded-lg font-semibold shadow transition-colors duration-200 ${profile.isAvailable ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-green-600 text-white hover:bg-green-700'}`}
                  >
                    {profile.isAvailable ? 'Mark as Unavailable' : 'Mark as Available'}
                  </button>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold shadow hover:bg-blue-700"
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
            )}
            
            {/* Donors Tab */}
            {activeTab === 'donors' && (
              <div className="max-w-4xl mx-auto bg-white p-6 rounded-2xl shadow-lg mb-6">
                <h3 className="text-2xl font-bold mb-4 flex items-center text-red-700"><FaUsers className="mr-2 text-red-500" /> Find Blood Donors</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <select
                    value={donorFilters.bloodGroup}
                    onChange={e => setDonorFilters({ ...donorFilters, bloodGroup: e.target.value })}
                    className="border px-3 py-2 rounded w-full"
                  >
                    <option value="">All Blood Groups</option>
                    {bloodGroups.map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="City"
                    value={donorFilters.city}
                    onChange={e => setDonorFilters({ ...donorFilters, city: e.target.value })}
                    className="border px-3 py-2 rounded w-full"
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSearch}
                      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 flex-1"
                    >
                      Search
                    </button>
                    <button
                      onClick={clearFilters}
                      className="bg-gray-200 text-white px-4 py-2 rounded hover:bg-gray-300"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                {donorsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                  </div>
                ) : donors.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No donors found matching your criteria
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {donors.map(donor => (
                      <div key={donor._id} className="border rounded-2xl shadow-md bg-white hover:shadow-xl transition-shadow duration-200 p-6 flex flex-col items-center space-y-3 relative">
                        <div className="absolute top-4 right-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold shadow ${donor.isAvailable ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-500'}`}>{donor.isAvailable ? 'Available' : 'Unavailable'}</span>
                        </div>
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-200 to-red-400 flex items-center justify-center text-3xl font-bold text-white shadow-lg border-4 border-white">
                          <FaTint className="text-red-500 text-3xl" />
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-semibold text-gray-800">{donor.name}</span>
                          <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow">{donor.bloodGroup}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 12.414a4 4 0 10-5.657 5.657l4.243 4.243a8 8 0 1011.314-11.314l-4.243 4.243a4 4 0 00-5.657 5.657z" /></svg>
                          <span>{donor.city}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-blue-700">
                          <FaHandHoldingMedical className="text-blue-500" />
                          <span className="font-medium">Total Donations: {donor.totalDonations}</span>
                        </div>
                        <button
                          onClick={() => openRequestModal(donor)}
                          className="mt-3 bg-red-600 text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-red-700 flex items-center space-x-2"
                        >
                          <FaHandHoldingMedical />
                          <span>Request Blood</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Requests Tab */}
            {activeTab === 'requests' && (
              <div className="max-w-4xl mx-auto bg-white p-6 rounded-2xl shadow-lg">
                <h3 className="text-2xl font-bold mb-6 flex items-center text-red-700"><FaHandHoldingMedical className="mr-2 text-red-500" /> My Blood Requests</h3>
                <div className="bg-gray-100 rounded-lg p-1 flex mb-6">
                  <button
                    onClick={() => setShowRequestsTab('sent')}
                    className={`flex-1 py-2 ms-1 text-white px-4 rounded-md ${showRequestsTab === 'sent' ? 'bg-red-600 shadow font-bold' : 'bg-white text-red-600'}`}
                  >
                    Sent Requests
                  </button>
                  <button
                    onClick={() => setShowRequestsTab('received')}
                    className={`flex-1 py-2 ml-1 text-white px-4 rounded-md ${showRequestsTab === 'received' ? 'bg-red-600 shadow font-bold' : 'bg-white text-red-600'}`}
                  >
                    Received Requests
                  </button>
                </div>
                {showRequestsTab === 'sent' ? (
                  <div>
                    {sentRequests.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        You haven't sent any blood requests yet
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {sentRequests.map(req => (
                          <div key={req._id} className={`border rounded-2xl shadow-md overflow-hidden transition-shadow duration-200 ${req.status === 'accepted' ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-white'}`}> 
                            <div className="px-6 py-4 flex justify-between items-center border-b bg-gradient-to-r from-red-50 to-white">
                              <div className="flex flex-col">
                                <span className="font-semibold text-lg flex items-center">
                                  <FaTint className="text-red-400 mr-2" /> To: {req.donorName}
                                </span>
                                <span className="text-xs text-gray-500">{new Date(req.createdAt).toLocaleDateString()}</span>
                              </div>
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow ${getStatusColor(req.status)}`}> 
                                {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                              </span>
                            </div>
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <div className="flex items-center space-x-2 mb-2">
                                  <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold">{req.bloodGroup}</span>
                                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getUrgencyColor(req.urgency)}`}>{req.urgency.charAt(0).toUpperCase() + req.urgency.slice(1)}</span>
                                </div>
                                <div className="text-gray-700 text-sm mb-1"><span className="font-medium">Required Date:</span> {new Date(req.requiredDate).toLocaleDateString()}</div>
                                <div className="text-gray-700 text-sm mb-1"><span className="font-medium">Hospital:</span> {req.hospitalName || 'Not specified'}</div>
                                {req.message && (
                                  <div className="mt-2 p-2 bg-gray-50 rounded-lg border text-gray-600 text-sm">
                                    <span className="font-medium text-gray-500">Message:</span> {req.message}
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col justify-between h-full">
                                {/* Timeline/status icons */}
                                <div className="flex items-center space-x-4 mb-4">
                                  <div className="flex flex-col items-center">
                                    <FaHandHoldingMedical className="text-red-400 text-xl mb-1" />
                                    <span className="text-xs text-gray-500">Requested</span>
                                  </div>
                                  <div className={`w-8 h-1 rounded-full ${req.status === 'accepted' || req.status === 'completed' ? 'bg-green-400' : 'bg-gray-300'}`}></div>
                                  <div className="flex flex-col items-center">
                                    <FaCheckCircle className={`${req.status === 'accepted' || req.status === 'completed' ? 'text-green-500' : 'text-gray-300'} text-xl mb-1`} />
                                    <span className="text-xs text-gray-500">Accepted</span>
                                  </div>
                                  <div className={`w-8 h-1 rounded-full ${req.status === 'completed' ? 'bg-blue-400' : 'bg-gray-300'}`}></div>
                                  <div className="flex flex-col items-center">
                                    <FaTint className={`${req.status === 'completed' ? 'text-blue-600' : 'text-gray-300'} text-xl mb-1`} />
                                    <span className="text-xs text-gray-500">Completed</span>
                                  </div>
                                </div>
                                {/* Donor contact info */}
                                {req.status === 'accepted' && (
                                  <>
                                    <div className="mt-2 border-t pt-2 bg-green-50 p-3 rounded-xl flex flex-col space-y-2 shadow-inner">
                                      <p className="text-sm font-bold text-green-800 flex items-center"><FaCheckCircle className="mr-1 text-green-600" /> Donor Contact Information</p>
                                      <div className="flex items-center space-x-3">
                                        <FaPhoneAlt className="text-gray-500" />
                                        <span className="text-base font-semibold text-gray-800">{req.donor?.phoneNum || 'Provided in Notification tab'}</span>
                                      </div>
                                      <div className="flex items-center space-x-3">
                                        <FaWhatsapp className="text-green-500" />
                                        <span className="text-base font-semibold text-gray-800">{req.donor?.whatsappNum || 'Provided in Notification tab'}</span>
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => markDonationCompleted(req._id)}
                                      className="mt-4 w-full bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 font-semibold shadow"
                                    >
                                      Mark Donation Completed
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    {receivedRequests.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        You haven't received any blood requests yet
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {receivedRequests.map(req => (
                          <div key={req._id} className={`border rounded-2xl shadow-md overflow-hidden transition-shadow duration-200 ${req.status === 'accepted' ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-white'}`}> 
                            <div className="px-6 py-4 flex justify-between items-center border-b bg-gradient-to-r from-red-50 to-white">
                              <div className="flex flex-col">
                                <span className="font-semibold text-lg flex items-center">
                                  <FaTint className="text-red-400 mr-2" /> From: {req.requester?.name || 'Unknown'}
                                </span>
                                <span className="text-xs text-gray-500">{new Date(req.createdAt).toLocaleDateString()}</span>
                              </div>
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow ${getStatusColor(req.status)}`}> 
                                {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                              </span>
                            </div>
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <div className="flex items-center space-x-2 mb-2">
                                  <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold">{req.bloodGroup}</span>
                                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getUrgencyColor(req.urgency)}`}>{req.urgency.charAt(0).toUpperCase() + req.urgency.slice(1)}</span>
                                </div>
                                <div className="text-gray-700 text-sm mb-1"><span className="font-medium">Required Date:</span> {new Date(req.requiredDate).toLocaleDateString()}</div>
                                <div className="text-gray-700 text-sm mb-1"><span className="font-medium">Hospital:</span> {req.hospitalName || 'Not specified'}</div>
                                {req.message && (
                                  <div className="mt-2 p-2 bg-gray-50 rounded-lg border text-gray-600 text-sm">
                                    <span className="font-medium text-gray-500">Message:</span> {req.message}
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col justify-between h-full">
                                <div className="flex items-center space-x-4 mb-4">
                                  <div className="flex flex-col items-center">
                                    <FaHandHoldingMedical className="text-red-400 text-xl mb-1" />
                                    <span className="text-xs text-gray-500">Requested</span>
                                  </div>
                                  <div className={`w-8 h-1 rounded-full ${req.status === 'accepted' || req.status === 'completed' ? 'bg-green-400' : 'bg-gray-300'}`}></div>
                                  <div className="flex flex-col items-center">
                                    <FaCheckCircle className={`${req.status === 'accepted' || req.status === 'completed' ? 'text-green-500' : 'text-gray-300'} text-xl mb-1`} />
                                    <span className="text-xs text-gray-500">Accepted</span>
                                  </div>
                                  <div className={`w-8 h-1 rounded-full ${req.status === 'completed' ? 'bg-blue-400' : 'bg-gray-300'}`}></div>
                                  <div className="flex flex-col items-center">
                                    <FaTint className={`${req.status === 'completed' ? 'text-blue-600' : 'text-gray-300'} text-xl mb-1`} />
                                    <span className="text-xs text-gray-500">Completed</span>
                                  </div>
                                </div>
                                {req.status === 'pending' && (
                                  <div className="mt-4 flex space-x-2">
                                    <button
                                      onClick={() => acceptRequest(req._id)}
                                      className="flex-1 bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700"
                                    >
                                      Accept
                                    </button>
                                    <button
                                      onClick={() => rejectRequest(req._id)}
                                      className="flex-1 bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700"
                                    >
                                      Reject
                                    </button>
                                  </div>
                                )}
                                {req.status === 'accepted' && (
                                  <button
                                    onClick={() => markDonationCompleted(req._id)}
                                    className="mt-4 w-full bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700"
                                  >
                                    Mark Donation Completed
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="max-w-4xl mx-auto bg-white p-6 rounded-2xl shadow-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-2xl font-bold flex items-center text-red-700"><FaBell className="mr-2 text-red-500" /> Notifications</h3>
                  {notifications.length > 0 && (
                    <button 
                      onClick={async () => {
                        try {
                          await axios.put('https://bloodonationwebapp.vercel.app/api/notifications/read-all');
                          fetchNotifications();
                        } catch (err) {
                          console.error('Mark all as read error:', err);
                        }
                      }}
                      className="text-sm text-red-600 hover:text-red-800 font-semibold px-4 py-2 rounded shadow border border-red-200 bg-red-50"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                
                {notifications.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    You don't have any notifications
                  </div>
                ) : (
                  <div className="space-y-4">
                    {notifications.map(notification => {
                      let icon, color;
                      switch (notification.type) {
                        case 'request_accepted':
                          icon = <FaCheckCircle className="text-green-500 text-xl" />;
                          color = 'border-green-300 bg-green-50';
                          break;
                        case 'request_rejected':
                          icon = <FaHandHoldingMedical className="text-red-500 text-xl" />;
                          color = 'border-red-200 bg-red-50';
                          break;
                        case 'donation_completed':
                          icon = <FaTint className="text-blue-600 text-xl" />;
                          color = 'border-blue-200 bg-blue-50';
                          break;
                        case 'reminder':
                          icon = <FaBell className="text-yellow-500 text-xl" />;
                          color = 'border-yellow-200 bg-yellow-50';
                          break;
                        default:
                          icon = <FaBell className="text-gray-400 text-xl" />;
                          color = 'border-gray-200 bg-white';
                      }
                      return (
                        <div 
                          key={notification._id} 
                          className={`border-l-4 ${color} rounded-xl p-4 shadow flex items-start space-x-4 cursor-pointer transition-all duration-150 ${!notification.isRead ? 'ring-2 ring-red-200' : ''}`}
                          onClick={() => markAsRead(notification._id)}
                        >
                          <div className="mt-1">{icon}</div>
                          <div className="flex-1">
                            <div className="flex justify-between items-center">
                              <h4 className="font-semibold text-lg text-gray-800">{notification.title}</h4>
                              <span className="text-xs text-gray-500">{new Date(notification.createdAt).toLocaleString()}</span>
                            </div>
                            <p className="mt-1 text-gray-700">{notification.message}</p>
                            {/* Show donor info if present in notification.data */}
                            {notification.data && (
                              <div className="mt-2 text-sm text-gray-700 space-y-1">
                                {notification.data.donorName && (
                                  <div><span className="font-semibold">Donor Name:</span> {notification.data.donorName}</div>
                                )}
                                {notification.data.donorPhone && (
                                  <div><span className="font-semibold">Phone Number:</span> {notification.data.donorPhone}</div>
                                )}
                                {notification.data.donorWhatsApp && (
                                  <div><span className="font-semibold">WhatsApp:</span> {notification.data.donorWhatsApp}</div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Send Blood Request</h3>
              <button onClick={closeRequestModal} className="text-gray-500 hover:text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Requesting blood from</p>
              <div className="flex justify-between items-center">
                <p className="font-medium">{selectedDonor?.name}</p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {selectedDonor?.bloodGroup}
                </span>
              </div>
              <p className="text-sm">{selectedDonor?.city}</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Urgency Level</label>
                <select
                  name="urgency"
                  value={requestForm.urgency}
                  onChange={handleRequestFormChange}
                  className="w-full border px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Required Date</label>
                <input
                  type="date"
                  name="requiredDate"
                  value={requestForm.requiredDate}
                  onChange={handleRequestFormChange}
                  className="w-full border px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hospital Name</label>
                <input
                  type="text"
                  name="hospitalName"
                  placeholder="Hospital Name"
                  value={requestForm.hospitalName}
                  onChange={handleRequestFormChange}
                  className="w-full border px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hospital Address</label>
                <input
                  type="text"
                  name="hospitalAddress"
                  placeholder="Hospital Address"
                  value={requestForm.hospitalAddress}
                  onChange={handleRequestFormChange}
                  className="w-full border px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message (Optional)</label>
                <textarea
                  name="message"
                  placeholder="Additional details about your request"
                  value={requestForm.message}
                  onChange={handleRequestFormChange}
                  rows="3"
                  className="w-full border px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={closeRequestModal}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Cancel
              </button>
              <button
                onClick={sendBloodRequest}
                disabled={requestLoading || !requestForm.requiredDate}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {requestLoading ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};



export default DetailPage;
