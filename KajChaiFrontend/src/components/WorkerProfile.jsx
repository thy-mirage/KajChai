import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import authService from '../services/authService';
import './Profile.css';

const WorkerProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    photo: '',
    phone: '',
    gender: '',
    city: '',
    upazila: '',
    district: '',
    division: '',
    field: '',
    experience: ''
  });

  const jobFields = [
    'Electrician',
    'Plumber', 
    'Carpenter',
    'Painter',
    'Maid',
    'Chef',
    'Driver',
    'Photographer'
  ];

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await authService.getWorkerProfile();
      if (response.success) {
        setProfile(response.data);
        setFormData({
          name: response.data.name || '',
          photo: response.data.photo || '',
          phone: response.data.phone || '',
          gender: response.data.gender || '',
          city: response.data.city || '',
          upazila: response.data.upazila || '',
          district: response.data.district || '',
          division: response.data.division || '',
          field: response.data.field || '',
          experience: response.data.experience ? response.data.experience.toString() : ''
        });
      }
    } catch (err) {
      setError('Failed to load profile');
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Convert experience to number if provided
      const submitData = {
        ...formData,
        experience: formData.experience ? parseFloat(formData.experience) : null
      };

      const response = await authService.updateWorkerProfile(submitData);
      if (response.success) {
        setProfile(response.data);
        setSuccess('Profile updated successfully!');
        setIsEditing(false);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update profile';
      setError(errorMessage);
      console.error('Error updating profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError('');
    setSuccess('');
    // Reset form data to current profile
    if (profile) {
      setFormData({
        name: profile.name || '',
        photo: profile.photo || '',
        phone: profile.phone || '',
        gender: profile.gender || '',
        city: profile.city || '',
        upazila: profile.upazila || '',
        district: profile.district || '',
        division: profile.division || '',
        field: profile.field || '',
        experience: profile.experience ? profile.experience.toString() : ''
      });
    }
  };

  if (loading && !profile) {
    return <div className="loading">Loading profile...</div>;
  }

  if (!profile) {
    return <div className="error">Profile not found</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>My Profile</h1>
        <div className="user-type-badge worker">Worker</div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="profile-content">
        {!isEditing ? (
          <div className="profile-view">
            <div className="profile-photo">
              {profile.photo ? (
                <img src={profile.photo} alt="Profile" />
              ) : (
                <div className="photo-placeholder">
                  {profile.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
            </div>

            <div className="profile-info">
              <div className="info-group">
                <label>Name:</label>
                <span>{profile.name}</span>
              </div>
              <div className="info-group">
                <label>Email:</label>
                <span>{profile.gmail}</span>
              </div>
              <div className="info-group">
                <label>Phone:</label>
                <span>{profile.phone}</span>
              </div>
              <div className="info-group">
                <label>Gender:</label>
                <span>{profile.gender}</span>
              </div>
              <div className="info-group">
                <label>City:</label>
                <span>{profile.city}</span>
              </div>
              <div className="info-group">
                <label>Upazila:</label>
                <span>{profile.upazila}</span>
              </div>
              <div className="info-group">
                <label>District:</label>
                <span>{profile.district}</span>
              </div>
              <div className="info-group">
                <label>Division:</label>
                <span>{profile.division}</span>
              </div>
              <div className="info-group">
                <label>Field of Work:</label>
                <span>{profile.field}</span>
              </div>
              <div className="info-group">
                <label>Experience:</label>
                <span>{profile.experience} years</span>
              </div>
              <div className="info-group">
                <label>Rating:</label>
                <span className="rating">
                  {profile.rating ? `${profile.rating}/5 ⭐` : 'Not rated yet'}
                </span>
              </div>
            </div>

            <button 
              className="edit-btn" 
              onClick={() => setIsEditing(true)}
            >
              Edit Profile
            </button>
          </div>
        ) : (
          <div className="profile-edit">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="photo">Photo URL</label>
                <input
                  type="url"
                  id="photo"
                  name="photo"
                  value={formData.photo}
                  onChange={handleChange}
                  placeholder="Enter photo URL"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone *</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="gender">Gender *</label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                  disabled={loading}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="city">City *</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="upazila">Upazila *</label>
                <input
                  type="text"
                  id="upazila"
                  name="upazila"
                  value={formData.upazila}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="district">District *</label>
                <input
                  type="text"
                  id="district"
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="division">Division *</label>
                <input
                  type="text"
                  id="division"
                  name="division"
                  value={formData.division}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="field">Field of Work *</label>
                <select
                  id="field"
                  name="field"
                  value={formData.field}
                  onChange={handleChange}
                  required
                  disabled={loading}
                >
                  <option value="">Select Field</option>
                  {jobFields.map(field => (
                    <option key={field} value={field}>{field}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="experience">Experience (years)</label>
                <input
                  type="number"
                  id="experience"
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  min="0"
                  step="0.5"
                  disabled={loading}
                />
              </div>

              <div className="form-actions">
                <button 
                  type="submit" 
                  className="save-btn" 
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button 
                  type="button" 
                  className="cancel-btn" 
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkerProfile;
