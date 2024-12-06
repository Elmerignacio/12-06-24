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


document.getElementById('yearLevel').addEventListener('change', updateStudents);
document.getElementById('block').addEventListener('change', updateStudents);

function updateStudents() {
    const yearLevel = document.getElementById('yearLevel').value;
    const block = document.getElementById('block').value;
    const studentSelect = document.getElementById('student');


    studentSelect.innerHTML = '<option value="" disabled selected>NAME</option>';

    if (yearLevel && block) {
        fetch(`/students?yearLevel=${yearLevel}&block=${block}`)
            .then(response => response.json())
            .then(data => {
                data.students.forEach(student => {
                    const option = document.createElement('option');
                    option.value = [student.firstName, student.lastName];
                    option.textContent = `${student.firstName} ${student.lastName}`;
                    studentSelect.appendChild(option);
                });
            })
            .catch(error => {
                console.error('Error fetching students:', error);
            });
    }
}

function updateStudents() {
const yearLevel = document.getElementById('yearLevel').value;
const block = document.getElementById('block').value;
const studentSelect = document.getElementById('student');


studentSelect.innerHTML = '<option value="" disabled selected>NAME</option>';
studentSelect.innerHTML += '<option value="all">ALL STUDENT</option>'; 

if (yearLevel && block) {
    fetch(`/students?yearLevel=${yearLevel}&block=${block}`)
        .then(response => response.json())
        .then(data => {
            data.students.forEach(student => {
                const option = document.createElement('option');
                option.value = [student.firstName, student.lastName].join(' ');
                option.textContent = `${student.lastName} ${student.firstName}`;
                studentSelect.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error fetching students:', error);
        });
}
}

window.onload = function() {
    const notification = document.getElementById('notification');
    if (notification) {
        notification.style.display = 'block';
  
        setTimeout(() => {
            notification.style.display = 'none';
        }, 5000); 
    }
  };


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