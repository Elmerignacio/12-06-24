function toggleDropdown(dropdownId) {
    const dropdowns = document.getElementsByClassName("dropdown-content");
    for (let i = 0; i < dropdowns.length; i++) {
        if (dropdowns[i].id !== dropdownId) {
            dropdowns[i].classList.remove('show');
        }
    }
    const dropdown = document.getElementById(dropdownId);
    dropdown.classList.toggle('show');
}

window.onclick = function (event) {
    if (!event.target.matches('.dropbtn') && !event.target.matches('.arrow')) {
        const dropdowns = document.getElementsByClassName("dropdown-content");
        for (let i = 0; i < dropdowns.length; i++) {
            const openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show');
            }
        }
    }
}

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
studentSelect.innerHTML += '<option value="all">All Students</option>'; 

if (yearLevel && block) {
    fetch(`/students?yearLevel=${yearLevel}&block=${block}`)
        .then(response => response.json())
        .then(data => {
            data.students.forEach(student => {
                const option = document.createElement('option');
                option.value = [student.firstName, student.lastName].join(' ');
                option.textContent = `${student.firstName} ${student.lastName}`;
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