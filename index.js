const express = require('express');
const OneSignal = require('@onesignal/node-onesignal');
const app = express();

// Replace with your OneSignal configuration
const onesignalAppId = '58565960-d135-41b4-b90b-a139f385b537';
const onesignalApiKey = process.env.onesignal_api_key;

const configuration = OneSignal.createConfiguration({
  authMethods: {
    app_key: {
      tokenProvider: {
        getToken() {
          return onesignalApiKey;
        },
      },
    },
  },
});

const client = new OneSignal.DefaultApi(configuration);

app.post('/send-notification/:callback_device_id', async (req, res) => {
  try {
    const callbackDeviceId = req.params.callback_device_id;

    // Get all registered players
    const playersResponse = await client.getPlayers(onesignalAppId);

    // Check if the callback device ID exists
    const existingPlayer = playersResponse.players.find(player => player.device_id === callbackDeviceId);

    let playerId;

    if (existingPlayer) {
      playerId = existingPlayer.id;
    } else {
      // Create a new player if not found
      const newPlayer = new OneSignal.Player();
      newPlayer.device_type = 1; // For iOS devices
      newPlayer.app_id = onesignalAppId;
      newPlayer.device_id = callbackDeviceId;

      const createPlayerResponse = await client.createPlayer(newPlayer);
      playerId = createPlayerResponse.id;
    }

    // Send notification to the found or newly created player
    const notification = new OneSignal.Notification();
    notification.app_id = onesignalAppId;
    notification.include_player_ids = [playerId];
    notification.contents = { en: 'Hello from Node.js server!' };

    const notificationResponse = await client.createNotification(notification);
    res.status(200).json({ success: true, response: notificationResponse });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
