function calculateTotal() {
    var amountInputs = document.querySelectorAll('.amount-input');
    var totalAmount = 0;

    amountInputs.forEach(function(input) {
        var denomination = parseFloat(input.getAttribute('data-denomination'));
        var amount = parseInt(input.value) || 0; 
        totalAmount += denomination * amount;
    });

    document.getElementById('totalAmount').textContent = totalAmount.toFixed(2); 
    document.getElementById('collectedAmount').textContent = totalAmount.toFixed(2); 

    checkAmounts();
}

document.querySelectorAll('.amount-input').forEach(function(input) {
    input.addEventListener('input', calculateTotal);
});

function toggleDropdown(id) {
    const dropdown = document.getElementById(id);
    dropdown.classList.toggle("show");
}

function openPopup() {
    document.getElementById("popupForm").style.display = "flex";
}

function closePopup() {
    document.getElementById("popupForm").style.display = "none";
}

function updateCollectedAmount() {
    const selectedDate = document.getElementById("date").value;
    const tableRows = document.querySelectorAll(".scrollable-table-container tbody tr");
    let collectedAmount = 0;
    let statusText = "Pending"; 

    document.getElementById("collectedAmount").textContent = "0.00";

    tableRows.forEach(row => {
        const rowDate = row.getAttribute("data-date").trim();
        const amountPaid = parseFloat(row.querySelector("td:nth-child(4)").textContent.trim()) || 0;
        const status = row.getAttribute("data-status").trim();

        if (rowDate === selectedDate) {
            collectedAmount += amountPaid; 
            statusText = status || "Pending"; 
        }
    });

    document.getElementById("collectedAmount").textContent = collectedAmount.toFixed(2);
    document.getElementById("status").textContent = statusText;

    checkAmounts();
}

function checkAmounts() {
    const collectedAmount = parseFloat(document.getElementById("collectedAmount").textContent.trim());
    const totalAmount = parseFloat(document.getElementById("totalAmount").textContent.trim());

    const receiveButton = document.getElementById("receiveButton");

    if (collectedAmount === totalAmount) {
        receiveButton.disabled = false;
    } else {
        receiveButton.disabled = true;
    }
}

function toggleDropdown(dropdownId, buttonId) {
const dropdownContent = document.getElementById(dropdownId);
const button = document.getElementById(buttonId);

dropdownContent.classList.toggle("show");

button.classList.toggle("active");
}

window.onload = function() {
const currentPage = window.location.href;  
const receiveLink = document.getElementById('receiveLink');
const remittanceLink = document.getElementById('remittanceLink');

if (currentPage.includes("Treasurer_BSIT_3A_remittance") || currentPage.includes("Treasurer_BSIT_3B_remittance")) {
receiveLink.classList.add('active');
}

if (currentPage.includes("Treasurer_3A_verify_remittance") || currentPage.includes("treasurer_3B_verify_remittance")) {
remittanceLink.classList.add('active');
}
}