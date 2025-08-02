# Doctor Availability Management System

## Overview
This system implements a dynamic doctor availability management system that allows doctors to control their availability status and patients to book appointments only when doctors are available.

## 🏥 New Features

### 1. Doctor Availability Status
- **Available**: Doctor can accept new appointments
- **Busy**: Doctor is currently with a patient
- **Offline**: Doctor is not available for appointments

### 2. Doctor Panel (`/doctor`)
- **Dashboard**: View today's appointments and stats
- **My Appointments**: Manage appointments with start/complete actions
- **Availability**: Update availability status with notes
- **Real-time Status**: Visual indicators for current status

### 3. Enhanced Admin Panel
- **Doctor Availability Section**: Monitor all doctors' status
- **Manage Doctors**: Create user accounts for doctors
- **Real-time Updates**: See when doctors become available
- **Email Notifications**: Get notified when doctors become available

### 4. Improved Booking Flow
- **Availability Check**: Only available doctors can be booked
- **Visual Indicators**: Clear status display in listings
- **Smart Filtering**: Only show available doctors and slots

## 🔧 Backend Changes

### Updated Models

#### Doctor Model (`server/models/Doctor.js`)
```javascript
// New fields added:
availabilityStatus: {
  type: String,
  enum: ["available", "busy", "offline"],
  default: "available"
},
lastStatusUpdate: { type: Date, default: Date.now },
currentPatientId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
statusNotes: { type: String }
```

#### User Model (`server/models/User.js`)
```javascript
// New role and doctorId fields:
role: {
  type: String,
  enum: ["user", "admin", "doctor"],
  default: "user",
},
doctorId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Doctor",
  required: function() {
    return this.role === "doctor";
  }
}
```

### New API Routes

#### Doctor Routes (`server/routes/doctor.js`)
- `GET /api/doctors/me/availability` - Get current doctor's availability
- `PATCH /api/doctors/me/availability` - Update doctor's availability
- `GET /api/doctors/me/stats` - Get doctor's appointment stats
- `GET /api/doctors/admin/availability` - Admin view of all doctors' availability

#### Appointment Routes (`server/routes/appointment.js`)
- `GET /api/appointments/doctor/my` - Get doctor's appointments
- `PATCH /api/appointments/:id/start` - Start appointment (sets doctor to busy)
- `PATCH /api/appointments/:id/complete` - Complete appointment (sets doctor to available)

#### Auth Routes (`server/routes/auth.js`)
- `POST /api/auth/admin/doctor/register` - Create doctor user account
- `GET /api/auth/admin/doctors` - Get all doctors for admin

### Middleware Updates
- Added `doctor` middleware for doctor-specific routes
- Updated `admin` middleware to support doctor role

## 🎯 How It Works

### 1. Doctor Workflow
1. **Login**: Doctor logs into `/doctor` panel
2. **Set Status**: Update availability to available/busy/offline
3. **Manage Appointments**: Start/complete appointments
4. **Auto Status**: Status automatically changes when starting/completing appointments

### 2. Patient Workflow
1. **Browse Doctors**: See availability status in doctor listings
2. **Book Appointment**: Only available doctors can be booked
3. **Get Notifications**: Receive email confirmations

### 3. Admin Workflow
1. **Monitor**: View all doctors' availability in admin panel
2. **Create Users**: Create doctor user accounts
3. **Get Notifications**: Receive emails when doctors become available

## 🚀 Usage

### For Doctors
1. Admin creates doctor user account
2. Doctor logs in at `/doctor`
3. Update availability status
4. Manage appointments

### For Admins
1. Go to `/admin` → "Manage Doctors"
2. Create doctor user accounts
3. Monitor availability in "Doctor Availability" section

### For Patients
1. Browse doctors at `/doctors`
2. See availability status
3. Book only available doctors

## 🔄 Status Transitions

### Automatic Transitions
- **Start Appointment**: `available` → `busy`
- **Complete Appointment**: `busy` → `available`

### Manual Transitions
- **Set Available**: Doctor manually sets to available
- **Set Busy**: Doctor manually sets to busy
- **Set Offline**: Doctor manually sets to offline

## 📧 Email Notifications

### Admin Notifications
- When doctor becomes available
- Includes doctor name, previous status, and timestamp

### Patient Notifications
- Appointment booking confirmation
- Status change notifications

## 🛡️ Security Features

- **Role-based Access**: Doctor routes protected by doctor middleware
- **Email-based Identification**: Doctors identified by email matching
- **Authorization Checks**: Doctors can only manage their own appointments
- **Admin-only Routes**: Doctor user creation restricted to admins

## 🧪 Testing

Run the test script to verify backend functionality:
```bash
node server/test-backend.js
```

## 📝 Database Schema Changes

### New Fields in Doctor Collection
```javascript
{
  availabilityStatus: "available" | "busy" | "offline",
  lastStatusUpdate: Date,
  currentPatientId: ObjectId,
  statusNotes: String
}
```

### New Fields in User Collection
```javascript
{
  role: "user" | "admin" | "doctor",
  doctorId: ObjectId (required for doctor role)
}
```

## 🔧 Configuration

### Environment Variables
- `JWT_SECRET`: For authentication
- `MONGODB_URI`: Database connection
- Email service configuration for notifications

### Dependencies
- `mongoose`: Database ODM
- `jsonwebtoken`: Authentication
- `bcryptjs`: Password hashing
- `express-validator`: Input validation

## 🎉 Benefits

1. **Better Resource Management**: No double-booking when doctors are busy
2. **Real-time Status**: Patients see current availability
3. **Doctor Control**: Doctors manage their own availability
4. **Admin Oversight**: Complete visibility of doctor statuses
5. **Automated Workflow**: Status changes automatically with appointments
6. **Email Notifications**: Keep everyone informed

This system provides a much more efficient and user-friendly appointment booking experience compared to the previous slot-based system! 