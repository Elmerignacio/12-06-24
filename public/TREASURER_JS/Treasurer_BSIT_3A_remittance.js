
document.getElementById('receiveLink').addEventListener('mouseover', function() {
    document.getElementById('receiveDropdown').classList.add('show');
});

document.getElementById('receiveLink').addEventListener('mouseout', function() {
    document.getElementById('receiveDropdown').classList.remove('show');
});

document.getElementById('receiveDropdown').addEventListener('mouseover', function() {
    this.classList.add('show');
});

document.getElementById('receiveDropdown').addEventListener('mouseout', function() {
    this.classList.remove('show');
});



document.getElementById('remittanceLink').addEventListener('mouseover', function() {
    document.getElementById('remittanceDropdown').classList.add('show');
});

document.getElementById('remittanceLink').addEventListener('mouseout', function() {
    document.getElementById('remittanceDropdown').classList.remove('show');
});

document.getElementById('remittanceDropdown').addEventListener('mouseover', function() {
    this.classList.add('show');
});

document.getElementById('remittanceDropdown').addEventListener('mouseout', function() {
    this.classList.remove('show');
});



function setupDropdown(linkId, dropdownId) {
    const linkElement = document.getElementById(linkId);
    const dropdownElement = document.getElementById(dropdownId);

    linkElement.addEventListener('mouseover', function () {
        dropdownElement.classList.add('show');
    });

    linkElement.addEventListener('mouseout', function () {
        dropdownElement.classList.remove('show');
    });

    dropdownElement.addEventListener('mouseover', function () {
        this.classList.add('show');
    });

    dropdownElement.addEventListener('mouseout', function () {
        this.classList.remove('show');
    });
}

setupDropdown('reportLink', 'reportDropdown');


function toggleDropdown(dropdownId) {
    const dropdownElement = document.getElementById(dropdownId);

    dropdownElement.classList.toggle('show');
}

function setupDropdown(linkId, dropdownId) {
    const linkElement = document.getElementById(linkId);
    const dropdownElement = document.getElementById(dropdownId);

    linkElement.addEventListener('mouseover', function () {
        dropdownElement.classList.add('show');
    });

    linkElement.addEventListener('mouseout', function () {
        dropdownElement.classList.remove('show');
    });

    dropdownElement.addEventListener('mouseover', function () {
        this.classList.add('show');
    });

    dropdownElement.addEventListener('mouseout', function () {
        this.classList.remove('show');
    });
}

setupDropdown('userLink', 'userDropdown');


window.addEventListener('load', function() {
    const currentPath = window.location.pathname;
    const links = document.querySelectorAll('.nav-link');
    links.forEach(link => {
        if (currentPath.includes(link.getAttribute('href'))) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
});

function toggleDropdown(dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    dropdown.classList.toggle('show');
}


document.getElementById('searchInput').addEventListener('input', function() {
    const searchValue = this.value.toUpperCase();
    const rows = document.querySelectorAll('#dataTable tbody tr');

    rows.forEach(row => {
        const name = row.getAttribute('data-name').toUpperCase();
        const payables = row.getAttribute('data-payables').toUpperCase();

        if (name.includes(searchValue) || payables.includes(searchValue)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
});
