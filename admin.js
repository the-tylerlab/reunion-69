const firebaseConfig = {
  apiKey: "AIzaSyArUTuBsE0K6HN-_X84pV3AspkJ31Llux8",
  authDomain: "reunion-69.firebaseapp.com",
  databaseURL: "https://reunion-69-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "reunion-69",
  storageBucket: "reunion-69.firebasestorage.app",
  messagingSenderId: "9929222848",
  appId: "1:9929222848:web:40bee69a0baed362a05b25"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const adminPanel = document.getElementById('admin-panel');
const participantsTbody = document.getElementById('admin-participants-table');
const winnersTbody = document.getElementById('admin-winners-table');
const totalCountSpan = document.getElementById('admin-total-count');
const winnerCountSpan = document.getElementById('admin-winner-count');
const clearDataBtn = document.getElementById('admin-clear-data');

let currentPage = 1;
const itemsPerPage = 5;
let lastAppData = { participants: [], winners: [] };

// Password Modal Helper
function askPassword(msg, callback) {
    const modal = document.getElementById('password-modal');
    if (!modal) {
        callback(prompt(msg));
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

// Authenticate on load
window.onload = () => {
    setTimeout(() => {
        askPassword('🔒 กรุณาใส่รหัสผ่านเพื่อเข้าสู่ระบบจัดการหลังบ้าน:', (pwd) => {
            if (pwd === 'admin69') {
                adminPanel.style.display = 'block';
            } else {
                alert('❌ รหัสผ่านไม่ถูกต้อง');
                document.body.innerHTML = '<h2 style="text-align:center; margin-top:20vh; color:#e74c3c;">การเข้าถึงถูกปฏิเสธ</h2>';
            }
        });
    }, 100);
};

// Listen to data from server
db.ref('/').on('value', (snapshot) => {
    let appData = snapshot.val();
    if (!appData) appData = { participants: [], winners: [] };
    if (!appData.participants) appData.participants = [];
    if (!appData.winners) appData.winners = [];
    lastAppData = appData; // Store globally for pagination
    renderAdminTables(appData);
});

function renderAdminTables(data) {
    // Pagination Calculations
    const totalParticipants = data.participants.length;
    const totalPages = Math.ceil(totalParticipants / itemsPerPage) || 1;
    if (currentPage > totalPages) currentPage = totalPages;

    const pageInfo = document.getElementById('admin-page-info');
    const prevBtn = document.getElementById('admin-prev-page');
    const nextBtn = document.getElementById('admin-next-page');

    if (pageInfo) pageInfo.textContent = `หน้า ${currentPage} / ${totalPages}`;
    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = currentPage === totalPages;

    // Render Participants (Sliced for pagination)
    participantsTbody.innerHTML = '';
    const reversedParticipants = [...data.participants].reverse();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const pagedParticipants = reversedParticipants.slice(startIndex, startIndex + itemsPerPage);

    pagedParticipants.forEach(p => {
        const tr = document.createElement('tr');
        const statusBadge = p.won 
            ? '<span class="badge badge-won" title="ได้รางวัลแล้ว">✅</span>' 
            : '<span class="badge badge-pending" title="ยังไม่ได้รางวัล">⏳</span>';
            
        tr.innerHTML = `
            <td><strong>${p.name}</strong></td>
            <td>${p.nickname || '-'}</td>
            <td>${statusBadge}</td>
            <td>
                <button class="btn-danger" style="padding: 4px 10px; font-size: 0.75rem; border-radius: 6px;" onclick="adminRemove('${p.id}')">
                    <i class="fa-solid fa-trash"></i> ลบ
                </button>
            </td>
        `;
        participantsTbody.appendChild(tr);
    });
    totalCountSpan.textContent = data.participants.length;
    winnerCountSpan.textContent = data.winners.length;

    // Populate Stats Summary (Large numbers)
    const summaryTotal = document.getElementById('summary-total');
    const summaryWon = document.getElementById('summary-won');
    const summaryPending = document.getElementById('summary-pending');
    
    if (summaryTotal) summaryTotal.textContent = data.participants.length;
    if (summaryWon) summaryWon.textContent = data.winners.length;
    if (summaryPending) {
        summaryPending.textContent = data.participants.length - data.winners.length;
    }

    // Render Winners
    winnersTbody.innerHTML = '';
    const reversedWinners = [...data.winners].reverse();
    reversedWinners.forEach(w => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${w.name}</strong></td>
            <td>${w.nickname || '-'}</td>
        `;
        winnersTbody.appendChild(tr);
    });
    winnerCountSpan.textContent = data.winners.length;
}

window.adminRemove = function(id) {
    if(confirm('⚠️ คุณแน่ใจหรือไม่ที่จะลบรายชื่อนี้? ข้อมูลจะถูกลบออกจากระบบและทุกหน้าจอทันที')) {
        db.ref('/').transaction((data) => {
            let currentData = data || { participants: [], winners: [] };
            if (currentData.participants) {
                currentData.participants = currentData.participants.filter(p => p.id !== id);
            }
            if (currentData.winners) {
                currentData.winners = currentData.winners.filter(w => w.id !== id);
            }
            return currentData;
        });
    }
};

if (clearDataBtn) {
    clearDataBtn.addEventListener('click', () => {
        askPassword('⚠️ คำเตือน: คุณกำลังจะล้างข้อมูลทั้งหมดในระบบ! กรุณาใส่รหัสผ่านเพื่อยืนยัน:', (pwd) => {
            if (pwd === 'admin69') {
                if (confirm('‼️ ยืนยันอีกครั้ง: ข้อมูลการลงทะเบียนและรายชื่อผู้โชคดีทั้งหมดจะหายไปถาวร?')) {
                    db.ref('/').set({ participants: [], winners: [] });
                }
            } else if (pwd !== null) {
                alert('❌ รหัสผ่านไม่ถูกต้อง');
            }
        });
    });
}

// Pagination Event Listeners
document.getElementById('admin-prev-page')?.addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        renderAdminTables(lastAppData);
    }
});

document.getElementById('admin-next-page')?.addEventListener('click', () => {
    const totalPages = Math.ceil(lastAppData.participants.length / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        renderAdminTables(lastAppData);
    }
});
