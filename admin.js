const socket = io();

const adminPanel = document.getElementById('admin-panel');
const participantsTbody = document.getElementById('admin-participants-table');
const winnersTbody = document.getElementById('admin-winners-table');
const totalCountSpan = document.getElementById('admin-total-count');
const winnerCountSpan = document.getElementById('admin-winner-count');
const clearDataBtn = document.getElementById('admin-clear-data');

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
socket.on('sync_data', (appData) => {
    renderAdminTables(appData);
});

function renderAdminTables(data) {
    // Render Participants
    participantsTbody.innerHTML = '';
    data.participants.forEach(p => {
        const tr = document.createElement('tr');
        const statusBadge = p.won 
            ? '<span class="badge badge-won">✅ ได้รางวัลแล้ว</span>' 
            : '<span class="badge badge-pending">⏳ รอลุ้น</span>';
            
        tr.innerHTML = `
            <td><strong>${p.name}</strong></td>
            <td>${p.familyLine}</td>
            <td>${p.phone || '-'}</td>
            <td>${statusBadge}</td>
            <td>
                <button class="btn-danger" style="padding: 6px 12px; font-size: 0.8rem;" onclick="adminRemove('${p.id}')">
                    <i class="fa-solid fa-trash"></i> ลบ
                </button>
            </td>
        `;
        participantsTbody.appendChild(tr);
    });
    totalCountSpan.textContent = data.participants.length;

    // Render Winners
    winnersTbody.innerHTML = '';
    data.winners.forEach(w => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${w.name}</strong></td>
            <td>${w.familyLine}</td>
        `;
        winnersTbody.appendChild(tr);
    });
    winnerCountSpan.textContent = data.winners.length;
}

window.adminRemove = function(id) {
    if(confirm('⚠️ คุณแน่ใจหรือไม่ที่จะลบรายชื่อนี้? ข้อมูลจะถูกลบออกจากระบบและทุกหน้าจอทันที')) {
        socket.emit('remove_participant', id);
    }
};

if (clearDataBtn) {
    clearDataBtn.addEventListener('click', () => {
        askPassword('🛑 พิมพ์รหัสผ่านอีกครั้งเพื่อยืนยันการล้างข้อมูลทั้งหมด (admin69):', (confirmPwd) => {
            if (confirmPwd === 'admin69') {
                if(confirm('🚨 การกระทำนี้ไม่สามารถย้อนกลับได้! คุณแน่ใจหรือไม่ที่จะล้างฐานข้อมูลผู้ร่วมงานทั้งหมด?')) {
                    socket.emit('clear_data');
                }
            } else {
                if (confirmPwd !== null) alert('รหัสผ่านไม่ถูกต้อง ล้มเหลว');
            }
        });
    });
}
