function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebar-overlay').classList.toggle('active');
}

function switchMenu(evt, tabName) {
    // Ẩn toàn bộ tab nội dung
    const tabcontents = document.getElementsByClassName("tab-content");
    for (let i = 0; i < tabcontents.length; i++) {
        tabcontents[i].style.display = "none";
        tabcontents[i].classList.remove("active");
    }
    
    // Bỏ trạng thái kích hoạt trên toàn bộ nút Menu Sidebar
    const menuItems = document.getElementsByClassName("menu-item");
    for (let i = 0; i < menuItems.length; i++) {
        menuItems[i].classList.remove("active");
    }
    
    // Hiển thị Tab cần mở
    const targetTab = document.getElementById(tabName);
    if(targetTab) {
        targetTab.style.display = "block";
        targetTab.classList.add("active");
    }
    
    // Bật hiệu ứng active cho thanh Menu
    if (evt && evt.currentTarget) {
        evt.currentTarget.classList.add("active");
    } else {
        // Tìm nút tương ứng nếu chuyển tab gián tiếp bằng lệnh code tự động
        for (let i = 0; i < menuItems.length; i++) {
            if (menuItems[i].getAttribute("onclick")?.includes(tabName)) {
                menuItems[i].classList.add("active");
                break;
            }
        }
    }

    // Kích hoạt nạp cấu hình tùy chỉnh cột nếu người dùng chuyển vào Tab Cài Đặt
    if (tabName === "tab-settings" && typeof renderColumnSettingsUI === "function") {
        renderColumnSettingsUI();
    }

    // Đóng nhanh Sidebar nếu đang chạy ở chế độ Mobile
    if (window.innerWidth <= 992 && document.getElementById('sidebar').classList.contains('open')) {
        toggleSidebar();
    }
}

// Giữ lại hàm alias openTab đồng bộ với mã gọi cũ của bạn tránh lỗi phát sinh
function openTab(evt, tabName) {
    switchMenu(evt, tabName);
}