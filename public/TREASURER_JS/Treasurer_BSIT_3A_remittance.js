
function toggleDropdown(dropdownId, buttonId) {
    const dropdownContent = document.getElementById(dropdownId);
    const button = document.getElementById(buttonId);

    dropdownContent.classList.toggle("show");

    button.classList.toggle("active");
}

window.onload = function() {
    const currentPage = window.location.href;  
    const receiveLink = document.getElementById('receiveLink');

    if (currentPage.includes("Treasurer_BSIT_3A_remittance") || currentPage.includes("Treasurer_BSIT_3B_remittance")) {
        receiveLink.classList.add('active');
    }
}


function toggleDropdown(id) {
    var dropdown = document.getElementById(id);
    dropdown.classList.toggle("show");
}