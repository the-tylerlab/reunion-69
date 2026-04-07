// State Management
const firebaseConfig = {
  apiKey: "AIzaSyArUTuBsE0K6HN-_X84pV3AspkJ31Llux8",
  authDomain: "reunion-69.firebaseapp.com",
  databaseURL: "https://reunion-69-default-rtdb.firebaseio.com",
  projectId: "reunion-69",
  storageBucket: "reunion-69.firebasestorage.app",
  messagingSenderId: "9929222848",
  appId: "1:9929222848:web:40bee69a0baed362a05b25"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let appData = {
    participants: [],
    winners: []
};

// Listen to server for data sync
db.ref('/').on('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
        appData = {
            participants: data.participants || [],
            winners: data.winners || []
        };
    } else {
        appData = { participants: [], winners: [] };
    }
    renderLists();
    if (canvas) drawWheel();
});

// Password Modal Helper
function askPassword(msg, callback) {
    const modal = document.getElementById('password-modal');
    if (!modal) {
        // Fallback if HTML not present
        const p = prompt(msg);
        callback(p);
        return;
    }
    const msgEl = document.getElementById('password-modal-msg');
    const input = document.getElementById('password-input');
    const confirmBtn = document.getElementById('password-confirm-btn');
    const cancelBtn = document.getElementById('password-cancel-btn');
    
    msgEl.textContent = msg;
    input.value = '';
    modal.classList.add('show');
    input.style.borderColor = '#e2e8f0';
    setTimeout(() => input.focus(), 100);
    
    // Clean old listeners
    const newConfirmBtn = confirmBtn.cloneNode(true);
    const newCancelBtn = cancelBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
    
    newConfirmBtn.addEventListener('click', () => {
        modal.classList.remove('show');
        callback(input.value);
    });
    
    newCancelBtn.addEventListener('click', () => {
        modal.classList.remove('show');
        callback(null);
    });
    
    input.onkeypress = (e) => {
        if (e.key === 'Enter') newConfirmBtn.click();
    };
}

// Colors for wheel wedges (Premium Palette)
const colorPalette = [
    "#FF416C", "#8e2de2", "#00b09b", "#f39c12", 
    "#e74c3c", "#3498db", "#9b59b6", "#1abc9c",
    "#f1c40f", "#e67e22", "#FF4B2B", "#4a00e0"
];

// Elements
const form = document.getElementById('registration-form');
const participantsList = document.getElementById('participants-list');
const winnersList = document.getElementById('winners-list');
const totalCountSpan = document.getElementById('total-count');
const eligibleCountSpan = document.getElementById('eligible-count');

const canvas = document.getElementById('wheel-canvas');
const ctx = canvas ? canvas.getContext('2d') : null;
const spinBtn = document.getElementById('spin-btn');

const modal = document.getElementById('winner-modal');
const modalWinnerName = document.getElementById('modal-winner-name');
const modalWinnerFamily = document.getElementById('modal-winner-family');
const modalCloseBtn = document.getElementById('modal-close-btn');

// --- Initialization ---
function init() {
    setupNavigation();
    
    // Check if fonts are loaded before drawing wheel to prevent layout issues
    if (canvas) {
        document.fonts.ready.then(() => {
            drawWheel();
        });
        window.addEventListener('resize', drawWheel);
    }

    // Form submission
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const name = document.getElementById('name').value.trim();
            const familyLine = document.getElementById('family-line').value.trim();
            const phone = document.getElementById('phone').value.trim();
            
            if (!name || !familyLine) return;
            
            const newParticipant = {
                id: Date.now().toString(),
                name,
                familyLine,
                phone,
                won: false
            };
            
            // Send to Firebase instead of local storage
            db.ref('/').transaction((data) => {
                let currentData = data || { participants: [], winners: [] };
                if (!currentData.participants) currentData.participants = [];
                currentData.participants.push(newParticipant);
                return currentData;
            });
            
            form.reset();
            document.getElementById('name').focus();
        });
    }

    // Clear data logic moved exclusively to admin dashboard

    // Modal close
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', () => {
            modal.classList.remove('show');
            if (canvas) drawWheel(); 
        });
    }
}

// --- UI Rendering ---

function renderLists() {
    // Render Participants
    if (participantsList) {
        participantsList.innerHTML = '';
        
        appData.participants.forEach((p, index) => {
            const li = document.createElement('li');
            // If won, make it slightly opaque in the main list
            if(p.won) li.style.opacity = '0.6';
            
            li.innerHTML = `
                <div class="participant-info">
                    <span class="p-name">${p.name} ${p.won ? '🎯 (ได้รางวัลแล้ว)' : ''}</span>
                    <span class="p-family">สาย: ${p.familyLine}</span>
                    ${p.phone ? `<span class="p-phone"><i class="fa-solid fa-phone"></i> ${p.phone}</span>` : ''}
                </div>
            `;
            participantsList.appendChild(li);
        });

        if (totalCountSpan) totalCountSpan.textContent = appData.participants.length;
    }

    // Render Winners
    if (winnersList) {
        winnersList.innerHTML = '';
        appData.winners.forEach((w, i) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="participant-info">
                    <span class="p-name">🏆 ${w.name}</span>
                    <span class="p-family">สาย: ${w.familyLine}</span>
                </div>
            `;
            winnersList.appendChild(li);
        });
    }
}

// Removal capability shifted to Admin Dashboard

// --- Navigation Logic ---
function setupNavigation() {
    const pageRegister = document.getElementById('page-register');
    const pageWheel = document.getElementById('page-wheel');
    const btnNavToWheel = document.getElementById('nav-to-wheel');
    const btnNavToRegister = document.getElementById('nav-to-register');

    if (btnNavToWheel && pageRegister && pageWheel) {
        btnNavToWheel.addEventListener('click', () => {
            askPassword('🔒 กรุณาใส่รหัสผ่าน Admin สำหรับเข้าถึงวงล้อรางวัล:', (pwd) => {
                if (pwd !== 'admin69') {
                    if (pwd !== null) alert('❌ รหัสผ่านไม่ถูกต้อง ไม่สามารถเข้าถึงได้');
                    return;
                }
                
                pageRegister.classList.remove('active');
                pageWheel.classList.add('active');
                if (canvas) drawWheel(); // Redraw
            });
        });
    }

    if (btnNavToRegister && pageRegister && pageWheel) {
        btnNavToRegister.addEventListener('click', () => {
            pageWheel.classList.remove('active');
            pageRegister.classList.add('active');
        });
    }
}

// --- Wheel Logic ---

let currentRotation = 0; // In radians
let isSpinning = false;
let wheelItems = []; // Those who haven't won

function getEligibleParticipants() {
    return appData.participants.filter(p => !p.won);
}

function drawWheel() {
    if (!canvas || !ctx) return;

    wheelItems = getEligibleParticipants();
    if (eligibleCountSpan) eligibleCountSpan.textContent = wheelItems.length;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (wheelItems.length === 0) {
        // Draw empty wheel
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fillStyle = '#e2e8f0';
        ctx.fill();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#64748b';
        ctx.font = '24px Kanit';
        ctx.fillText('ยังไม่มีรายชื่อในวงล้อ', centerX, centerY);
        spinBtn.disabled = true;
        return;
    }
    
    spinBtn.disabled = false || isSpinning;
    const sliceAngle = (2 * Math.PI) / wheelItems.length;

    for (let i = 0; i < wheelItems.length; i++) {
        const startAngle = currentRotation + i * sliceAngle;
        const endAngle = startAngle + sliceAngle;
        
        // Pick color deterministically
        const color = colorPalette[i % colorPalette.length];
        
        // Draw slice
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
        
        // Text
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(startAngle + sliceAngle / 2);
        
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        
        // Decide font size based on slice count
        const fontSize = wheelItems.length > 20 ? 12 : (wheelItems.length > 10 ? 16 : 20);
        ctx.font = `600 ${fontSize}px Kanit`;
        
        ctx.shadowColor = 'rgba(0,0,0,0.4)';
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        ctx.shadowBlur = 2;
        
        // Shorten long names if necessary
        let displayName = wheelItems[i].name;
        if (displayName.length > 15) {
            displayName = displayName.substring(0, 13) + '...';
        }
        
        ctx.fillText(displayName, radius - 20, 0);
        ctx.restore();
    }
    
    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.15, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#f1c40f';
    ctx.stroke();
}

// Spin Physics
let spinVelocity = 0;
let animationFrameId;

if (spinBtn) {
    spinBtn.addEventListener('click', () => {
        if (isSpinning || wheelItems.length === 0) return;
        
        // Check date: restrict until April 15 (assuming 2026 based on context)
        const currentDate = new Date();
        const targetDate = new Date('2026-04-15T00:00:00');
        
        if (currentDate < targetDate) {
            alert('⏳ วงล้อจะเปิดให้หมุนได้ในวันที่ 15 เมษายน เป็นต้นไปครับ!');
            return;
        }
        
        isSpinning = true;
        spinBtn.disabled = true;
        
        // Random initial speed between 0.4 and 0.7 radians per frame
        spinVelocity = 0.4 + Math.random() * 0.3; 
        
        // Extra random rotations
        const extraRotations = Math.PI * 2 * (3 + Math.random() * 5);
        
        animateSpin();
    });
}

function animateSpin() {
    currentRotation += spinVelocity;
    
    // Apply friction to gradually slow down
    // The closer velocity is to 0, the more friction takes over
    if (spinVelocity > 0.005) {
        spinVelocity *= 0.985; // Deceleration factor
        drawWheel();
        animationFrameId = requestAnimationFrame(animateSpin);
    } else {
        // Stopped
        spinVelocity = 0;
        isSpinning = false;
        determineWinner();
    }
}

function determineWinner() {
    cancelAnimationFrame(animationFrameId);
    
    const sliceAngle = (2 * Math.PI) / wheelItems.length;
    
    // Adjusting for the fact that pointer is at Top (Math.PI * 1.5)
    let pointerAngle = (Math.PI * 1.5 - currentRotation) % (2 * Math.PI);
    
    // Handle negative values
    if (pointerAngle < 0) pointerAngle += 2 * Math.PI;
    
    const winningIndex = Math.floor(pointerAngle / sliceAngle);
    const winner = wheelItems[winningIndex];
    
    if (winner) {
        showWinnerModal(winner);
        
        db.ref('/').transaction((data) => {
            let currentData = data || { participants: [], winners: [] };
            if (!currentData.participants) currentData.participants = [];
            if (!currentData.winners) currentData.winners = [];
            
            const pIndex = currentData.participants.findIndex(p => p.id === winner.id);
            if (pIndex !== -1) {
                currentData.participants[pIndex].won = true;
                currentData.winners.push(currentData.participants[pIndex]);
            }
            return currentData;
        });
    }
}

function showWinnerModal(winner) {
    modalWinnerName.textContent = winner.name;
    modalWinnerFamily.textContent = `สายตระกูล: ${winner.familyLine}`;
    modal.classList.add('show');
    
    // Confetti effect
    var duration = 3 * 1000;
    var animationEnd = Date.now() + duration;
    var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 10000 };

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    var interval = setInterval(function() {
      var timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      var particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults, particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults, particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);
}

// Initialize the app
init();
