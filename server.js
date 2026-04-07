const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const DATA_FILE = path.join(__dirname, 'data.json');

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Admin Route
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Helper: Read Data
function readData() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            fs.writeFileSync(DATA_FILE, JSON.stringify({ participants: [], winners: [] }));
        }
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        return JSON.parse(raw);
    } catch (err) {
        console.error('Error reading data:', err);
        return { participants: [], winners: [] };
    }
}

// Helper: Write Data
function writeData(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Error writing data:', err);
    }
}

let appData = readData();

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    // Send current state to the newly connected user
    socket.emit('sync_data', appData);

    // Handle new participant registration
    socket.on('add_participant', (newParticipant) => {
        appData.participants.unshift(newParticipant);
        writeData(appData);
        // Broadcast the update to everyone
        io.emit('sync_data', appData);
    });

    // Handle removing a participant
    socket.on('remove_participant', (id) => {
        appData.participants = appData.participants.filter(p => p.id !== id);
        appData.winners = appData.winners.filter(w => w.id !== id);
        writeData(appData);
        io.emit('sync_data', appData);
    });

    // Handle when a participant wins
    socket.on('set_winner', (winnerId) => {
        const pIndex = appData.participants.findIndex(p => p.id === winnerId);
        if (pIndex !== -1 && !appData.participants[pIndex].won) {
            appData.participants[pIndex].won = true;
            appData.winners.unshift(appData.participants[pIndex]);
            writeData(appData);
            io.emit('sync_data', appData);
        }
    });

    // Handle clearing all data
    socket.on('clear_data', () => {
        appData = { participants: [], winners: [] };
        writeData(appData);
        io.emit('sync_data', appData);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running at http://localhost:${PORT}`);
    console.log(`Other devices on the same Wi-Fi can connect using your machine's IP address (e.g., http://192.168.x.x:${PORT})`);
});
