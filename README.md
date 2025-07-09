# Blood Donation Web App

## Table of Contents

* [Overview](#overview)
* [Features](#features)
* [Tech Stack](#tech-stack)
* [Getting Started](#getting-started)

  * [Prerequisites](#prerequisites)
  * [Installation](#installation)
  * [Environment Variables](#environment-variables)
  * [Running the App](#running-the-app)
* [Usage](#usage)
* [Folder Structure](#folder-structure)
* [Contributing](#contributing)
* [License](#license)

## Overview

This is a Blood Donation Web Application built with the MERN (MongoDB, Express, React, Node.js) stack. It allows users to register as blood donors, manage their availability, and search for other donors based on city and blood group. Users can send and receive donation requests and track notifications.

## Features

* **User Registration & Email Verification**: Sign up with email and password, receive a verification code, and verify your account.
* **User Profile**: Provide personal details (name, age, city, phone, WhatsApp, blood group) to create a donor profile.
* **Availability Toggle**: Mark yourself as available or unavailable for donations.
* **Search Donors**: Find donors by city or blood group.
* **Donation Requests**:

  * **Send Requests**: Request blood from other donors.
  * **Received Requests**: View requests from other users asking you to donate.
  * **Notifications**: Track request status (sent, accepted, rejected, completed).
* **Post-Donation Lockout**: After completing a donation, donors are automatically marked unavailable for 5 months to ensure their health.

## Tech Stack

* **Frontend**: React, React Router, Axios, Tailwind CSS (optional)
* **Backend**: Node.js, Express.js, MongoDB, Mongoose
* **Authentication**: JWT (JSON Web Tokens)
* **Email Service**: Nodemailer (for sending verification codes)

## Getting Started

Follow these instructions to set up and run the project locally.

### Prerequisites

* [Node.js](https://nodejs.org/) v22
* [npm](https://www.npmjs.com/) or [Yarn](https://yarnpkg.com/)
* [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account (or a local MongoDB instance)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Alimurtaza330/BloodDonationWebApp.git
   cd BloodDonationWebApp
   ```

2. **Install backend dependencies**

   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**

   ```bash
   cd ../frontend
   npm install
   ```

### Environment Variables

Create a `.env` file in the `backend` folder with the following variables:

```env
MONGO_URI
JWT_SECRET
JWT_EXPIRES
PORT
EMAIL_USER
EMAIL_PASS
NODE_ENV
CLIENT_URL

// No need of cloudinary but if you want to handle img file then required
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

### Running the App

1. **Start the backend server**

   ```bash
   cd backend
   npm start
   ```

2. **Start the frontend**

   ```bash
   cd ../frontend
   npm start
   ```

## Usage

1. **Register**: Create an account with your email and password. Check your email for the verification code.
2. **Verify Email**: Enter the code to activate your account.
3. **Login**: Sign in with your verified credentials.
4. **Create Profile**: Fill in your personal details to become a donor.
5. **Toggle Availability**: Use the button on "My Profile" to mark yourself as available or unavailable.
6. **Find Donors**: Go to "Find Donor" and search by city or blood group.
7. **Send Requests**: Click "Request" on a donor's card to ask for blood.
8. **Manage Requests**:

   * **Sent Requests**: Track requests you’ve sent and see if they’re accepted or rejected.
   * **Received Requests**: Accept or reject donation requests from others.
9. **Notifications**: View updates on request status and donation completion.
10. **Post-Donation**: After completing a donation, mark the request as "Completed". You’ll be automatically unavailable for 5 months.

## Folder Structure

```
BloodDonationWebApp/
├── backend/             # Express server and API
│   ├── controllers/     # Route handlers
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express routes
│   ├── middleware/      # Auth and error handlers
│   ├── utils/           # Token helpers
│   ├── .env             # Environment variables
│   └── server.js        # Entry point
├── frontend/            # React client
│   ├── public/          # Static assets
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── App.js       # Main app
│   │   └── index.js     # Entry point
│   └── package.json     # Frontend dependencies
└── README.md            # Project documentation
```

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch: `git checkout -b feature-name`.
3. Commit your changes: `git commit -m "Add feature description"`.
4. Push to branch: `git push origin feature-name`.
5. Open a Pull Request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

Contact Information 

Email : [alimurteza330@gmail.com](mailto:alimurteza330@gmail.com)

LinkedIn : [https://www.linkedin.com/in/alimurtaza330/](https://www.linkedin.com/in/alimurtaza330/)

Github : [https://github.com/Alimurtaza330](https://github.com/Alimurtaza330)

 
