const model = require('../../models');
const bcrypt = require('bcrypt'); 
const { Op } = require('sequelize');
const jwt = require('jsonwebtoken')
require ("dotenv").config()



const Admin_dashboard = (req, res) => {
    model.register_user.findOne({
        where: {
            role: 'Admin' 
        }
    })
    .then(user => {
        if (user) {
            const treasurerName = user.firstName + ' ' + user.lastName; 
            res.render('Admin_dashboard', { treasurerName });
        } else {
            res.render('Admin_dashboard', { treasurerName: 'No admin found' });
        }
    })
    .catch(err => {
        console.error(err);
        res.render('Admin_dashboard', { treasurerName: 'Error retrieving name' });
    });
}

const Admin_register_user = (req, res) => {
    res.render('Admin_register_user'); 
};

const Admin_3A_verify_remittance = (req, res) => {
    const selectedDate = req.query.date || ''; 

    Promise.all([ 
        model.register_user.findAll(), 
        model.remittance.findAll() 
    ])
    .then(([users, remittances]) => {  
        const filteredStudents = users.filter(user =>
            user.role === 'STUDENT' &&
            user.yearLevel === '3' &&
            user.block === 'A' 
        );

        const representatives = users.filter(user => user.role === 'REPRESENTATIVE');
        const treasurer = users.find(user => user.role === 'TREASURER'); 

        console.log("Representatives:", representatives);
        console.log("Treasurer:", treasurer); 

        const studentRemittances = remittances.map(remittance => {
            const student = users.find(user => user.firstName + ' ' + user.lastName === remittance.student);
            
            console.log("Checking Remittance:", remittance);

            if (student && student.block === 'A' && remittance.status.trim().toLowerCase() !== 'received') {  
                const representative = representatives.find(rep => rep.block === student.block && rep.yearLevel === student.yearLevel);
                
                return {
                    studentName: remittance.student,
                    payment: remittance.payable,
                    amountPaid: remittance.paid,
                    date: remittance.date,
                    block: student.block,
                    representativeName: representative ? `${representative.firstName} ${representative.lastName}` : 'N/A',
                    treasurerName: treasurer ? `${treasurer.firstName} ${treasurer.lastName}` : 'N/A',
                    status: remittance.status  
                };
            }
        }).filter(remittance => remittance);  

        console.log("Filtered Student Remittances:", studentRemittances); 

        const representativeNames = representatives
            .filter(rep => rep.block === 'A')  
            .map(representative => `${representative.firstName} ${representative.lastName}`);

        res.render("Admin_verify_remittance", {
            blockKey: 'BSIT - 3A',
            studentRemittances,
            representativeNames,
            filteredStudents,
            selectedDate, 
        });
    })
    .catch(error => {
        console.error(error);
        res.status(500).render("error", { message: "Unable to retrieve data" });
    });
};


const Admin_3B_verify_remittance = (req, res) => {
    Promise.all([ 
        model.register_user.findAll(), 
        model.remittance.findAll() 
    ])
    .then(([users, remittances]) => {  
        const filteredStudents = users.filter(user =>
            user.role === 'STUDENT' &&
            user.yearLevel === '3' &&
            user.block === 'B' 
        );

        const representatives = users.filter(user => user.role === 'REPRESENTATIVE');
        
        console.log("Representatives:", representatives); 
        
        const studentRemittances = remittances.map(remittance => {
            const student = users.find(user => user.firstName + ' ' + user.lastName === remittance.student);
            
            console.log("Checking Remittance Status:", remittance.status); 
            if (student && student.block === 'B' && remittance.status.toLowerCase().trim() !== 'received') {
                const representative = representatives.find(rep => rep.block === student.block && rep.yearLevel === student.yearLevel);
                
                return {
                    studentName: remittance.student,
                    payment: remittance.payable,
                    amountPaid: remittance.paid,
                    date: remittance.date,
                    block: student.block,
                    representativeName: representative ? `${representative.firstName} ${representative.lastName}` : 'N/A',
                    status: remittance.status  
                };
            }
        }).filter(remittance => remittance); 

        console.log("Filtered Student Remittances:", studentRemittances);  

        const representativeNames = representatives
            .filter(rep => rep.block === 'B')  
            .map(representative => `${representative.firstName} ${representative.lastName}`);

        res.render("Admin_verify_remittance", {
            blockKey: 'BSIT - 3B',
            studentRemittances,
            representativeNames,
            filteredStudents,
        });
    })
    .catch(error => {
        console.error(error);
        res.status(500).render("error", { message: "Unable to retrieve data" });
    });
};


module.exports = {

    ///admin
    Admin_register_user,
    Admin_dashboard,
    Admin_3A_verify_remittance,
    Admin_3B_verify_remittance,
 
}