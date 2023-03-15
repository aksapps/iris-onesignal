const express = require('express');
const bodyParser = require('body-parser');
const OneSignal = require('onesignal-node');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Set up OneSignal client
const oneSignalClient = new OneSignal.Client({
  app: { appAuthKey: process.env.onesignal_api_key, appId: '58565960-d135-41b4-b90b-a139f385b537' },
});

// Route to handle incoming requests from iOS device
app.post('/', async (req, res) => {
  // Get the device's APNS token from the request headers
  const apnsToken = req.headers['apns-token'];

  // Check if the device is already registered
  const existingDevice = await oneSignalClient.viewDevices({ app_id: '58565960-d135-41b4-b90b-a139f385b537', push: { include_external_user_ids: [apnsToken] } });

  if (!existingDevice || existingDevice.length === 0) {
    // If the device is not registered, add it to OneSignal using the APNS token as the external user ID
    const newDevice = new OneSignal.Device({ 
      app_id: '58565960-d135-41b4-b90b-a139f385b537', 
      identifier: apnsToken,
      external_user_id: apnsToken,
      device_type: 0 // 0 is for iOS devices
    });
    
    try {
      const result = await oneSignalClient.addDevice(newDevice);
      console.log('Device added:', result);
    } catch (err) {
      console.error('Error adding device:', err);
      res.status(500).send('Error adding device');
      return;
    }
  }

  // Create a notification object to send
  const notification = {
    headings: { en: 'Iris AI' },
    contents: { en: 'Your video is ready to download!' },
    ios_badgeType: 'Increase',
    ios_badgeCount: 1,
    include_external_user_ids: [apnsToken],
  };

  // Send the notification using the OneSignal API
  try {
    const result = await oneSignalClient.createNotification(notification);
    console.log('Notification sent:', result);
    res.status(200).send('Notification sent!');
  } catch (err) {
    console.error('Error sending notification:', err);
    res.status(500).send('Error sending notification');
  }
});

// Start the server
app.listen(3000, () => {
  console.log('Server started on port 3000');
});
