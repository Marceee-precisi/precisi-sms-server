// Install: npm install express twilio dotenv
const express = require('express');
const twilio = require('twilio');
require('dotenv').config(); // Load environment variables from .env

const app = express();
app.use(express.json()); // For parsing JSON request bodies

// Your Twilio Account SID and Auth Token
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER; // Your Twilio phone number (sender)
const yourPersonalPhoneNumber = process.env.YOUR_PERSONAL_PHONE_NUMBER; // Your phone number (recipient)

// Ensure all required environment variables are set
if (!accountSid || !authToken || !twilioPhoneNumber || !yourPersonalPhoneNumber) {
    console.error("Critical Error: Missing one or more Twilio environment variables. Please check your .env file.");
    console.error("Required: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, YOUR_PERSONAL_PHONE_NUMBER");
    process.exit(1);
}

const client = new twilio(accountSid, authToken);

app.post('/send-appointment-sms', async (req, res) => {
    // We now expect the client's phone number as well
    const { clientName, appointmentDate, appointmentTime, clientPhoneNumber } = req.body;

    if (!clientName || !appointmentDate || !appointmentTime || !clientPhoneNumber) {
        return res.status(400).json({ success: false, message: 'Missing required parameters (clientName, appointmentDate, appointmentTime, clientPhoneNumber).' });
    }

    // Message to be sent to the owner
    const ownerMessage = `New Appointment Request! Client: ${clientName}, Phone: ${clientPhoneNumber}, Date: ${appointmentDate}, Time: ${appointmentTime}.`;

    // Message to be sent to the client
    const clientMessage = `Hello ${clientName}, your appointment request has been received. Please wait for an approved text message confirmation for your appointment.`;

    try {
        // Send a message to the owner
        await client.messages.create({
            body: ownerMessage,
            to: yourPersonalPhoneNumber,
            from: twilioPhoneNumber
        });

        // Send a message to the client
        await client.messages.create({
            body: clientMessage,
            to: clientPhoneNumber,
            from: twilioPhoneNumber
        });

        console.log('SMS notifications sent successfully!');
        res.status(200).json({ success: true, message: 'SMS notifications sent.' });
    } catch (error) {
        console.error('Error sending SMS:', error);
        if (error.code) {
            console.error(`Twilio Error Code: ${error.code}`);
        }
        res.status(500).json({ success: false, message: 'Failed to send SMS notifications.', error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Node.js SMS server running on port ${PORT}`);
});