const model = require('../models');
const bcrypt = require('bcrypt'); 
const { Op } = require('sequelize');
const jwt = require('jsonwebtoken')
require ("dotenv").config()

const login = (req, res) => {
    res.render('login'); 
};
const login_post = async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await model.register_user.findOne({ where: { userName: username } });
        if (!user) return res.status(400).redirect("login");

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) return res.status(400).redirect("login");

        const outTokenValue = jwt.sign({
            exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24),
            role: user.role,
            userid: user.id,
            firstname: user.firstName,
            lastname: user.lastName,
        }, process.env.JWT_SECRET);

        res.cookie("funds", outTokenValue, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 1000 * 60 * 60 * 24
        });

        switch (user.role) {
            case 'ADMIN':
                return res.redirect('/Admin_dashboard');
            case 'TREASURER':
                return res.redirect('/Treasurer_dashboard');
            case 'student':
                return res.redirect('/Student_dashboard');
            default:
                console.log('Unknown role');
                return res.status(400).redirect("login");
        }

    } catch (error) {
        console.log(error);
        return res.status(500).redirect("login");
    }
};
const register_user_by_role = (req, res) => {
    const register_post_db = {
        userId: req.body.userId,
        lastName: req.body.lastName.toUpperCase(),
        firstName: req.body.firstName.toUpperCase(),
        yearLevel: req.body.yearLevel.toUpperCase(),
        block: req.body.block,
        gender: req.body.gender.toUpperCase(),
        role: req.body.role.toUpperCase(),
        userName: req.body.userName,
        password: req.body.password,  
    };

    const handleError = (message, status = 500) => {
        console.error(message);
        return res.status(status).render("Treasurer_register_user", { 
            message: { text: "Something went wrong, please try again!", type: 'error' }
        });
    };
    
    model.register_user.findOne({ where: { userId: register_post_db.userId } })
        .then(existingUser => {
            if (existingUser) {
                return res.status(400).render("Treasurer_register_user", {
                    message: { text: "User ID already exists. Please use a different ID.", type: 'error' }
                });
            }   

            return model.register_user.findOne({
                where: {
                    firstName: register_post_db.firstName,
                    lastName: register_post_db.lastName,
                    yearLevel: register_post_db.yearLevel,
                    block: register_post_db.block
                }
            }).then(existingNameUser => {
                if (existingNameUser) {
                    return res.status(400).render("Treasurer_register_user", {
                        message: { 
                            text: `A user with the name ${register_post_db.firstName} ${register_post_db.lastName} already exists in Year ${register_post_db.yearLevel} and Block ${register_post_db.block}.`, 
                            type: 'error' 
                        }
                    });
                }

                if (register_post_db.role === "REPRESENTATIVE") {
                    return model.register_user.findOne({
                        where: {
                            yearLevel: register_post_db.yearLevel,
                            block: register_post_db.block,
                            role: "REPRESENTATIVE"
                        }
                    })
                    .then(existingRepresentative => {
                        if (existingRepresentative) {
                            return res.status(400).render("Treasurer_register_user", {
                                message: { 
                                    text: `A representative for Year ${register_post_db.yearLevel} and Block ${register_post_db.block} already exists.`, 
                                    type: 'error' 
                                }
                            });
                        }
                        return createUser(register_post_db, res);
                    })
                    .catch(() => handleError("Representative Check Error:"));
                }
                
                if (register_post_db.role === "TREASURER") {
                    return model.register_user.findOne({
                        where: {
                            yearLevel: register_post_db.yearLevel,
                            role: "TREASURER"
                        }
                    })
                    .then(existingTreasurer => {
                        if (existingTreasurer) {
                            return res.status(400).render("Treasurer_register_user", {
                                message: { 
                                    text: `A treasurer already exists, only 1 treasurer user allowed on this system`, 
                                    type: 'error' 
                                }
                            });
                        }
                        return createUser(register_post_db, res);
                    })
                    .catch(() => handleError("Treasurer Check Error:"));
                }

                return createUser(register_post_db, res);
            });
        })
        .catch(() => handleError("User ID Check Error:"));
};

const createUser = (register_post_db, res) => {
    if (register_post_db.role !== "STUDENT") {
        bcrypt.hash(register_post_db.password, 10, (err, hashedPassword) => {
            if (err) {
                console.error("Error hashing password:", err);
                return res.status(500).render("Treasurer_register_user", { 
                    message: { text: "Something went wrong while hashing the password!", type: 'error' }
                });
            }
            register_post_db.password = hashedPassword;
            saveUser(register_post_db, res);
        });
    } else {
        saveUser(register_post_db, res);
    }
};

const saveUser = (register_post_db, res) => {
    model.register_user.create(register_post_db)
        .then(() => {
            res.status(200).render("Treasurer_register_user", { 
                message: { text: "Registration successful!", type: 'success' }
            });
        })
        .catch(error => {
            console.error("Database Insert Error:", error);
            res.status(500).render("Treasurer_register_user", { 
                message: { text: "Something went wrong, please try again!", type: 'error' }
            });
        });
};


const Treasurer_dashboard = (req, res) => {
    model.register_user.findOne({
        where: {
            role: 'Treasurer' 
        }
    })
    .then(user => {
        if (user) {
            const treasurerName = user.firstName + ' ' + user.lastName; 
            res.render('Treasurer_dashboard', { treasurerName });
        } else {
            res.render('Treasurer_dashboard', { treasurerName: 'No treasurer found' });
        }
    })
    .catch(err => {
        console.error(err);
        res.render('Treasurer_dashboard', { treasurerName: 'Error retrieving name' });
    });
}

const Treasurer_create_payable = (req, res) => {
    res.render('Treasurer_create_payable');
};


const Treasurer_register_user = (req, res) => {
    res.render('Treasurer_register_user');
};

const Display_BSIT_3A = (req, res) => {
    Promise.all([
        model.register_user.findAll(),
        model.payable.findAll(),
        model.remittance.findAll() 
    ])
    .then(([users, payables, remittances]) => {  
        const filteredUsers = users.filter(user =>
            ['STUDENT', 'REPRESENTATIVE', 'TREASURER'].includes(user.role) &&
            user.yearLevel === '3' &&
            user.block === 'A'
        );

        const representativeNames = filteredUsers
            .filter(user => user.role === 'REPRESENTATIVE')
            .map(representative => `${representative.firstName} ${representative.lastName}`);

        res.render("Treasurer_BSIT_3A_remittance", {
            blockKey: 'BSIT - 3A',
            representativeNames,
            filteredUsers,
            payables,
            remittances 
        });
    })
    .catch(error => {
        console.error(error);
        res.status(500).render("error", { message: "Unable to retrieve data" });
    });
};


const Display_BSIT_3B = (req, res) => {
    Promise.all([
        model.register_user.findAll(),
        model.payable.findAll(),
        model.remittance.findAll() 
    ])
    .then(([users, payables, remittances]) => {  
        const filteredUsers = users.filter(user =>
            ['STUDENT', 'REPRESENTATIVE','TREASURER'].includes(user.role) &&
            user.yearLevel === '3' &&
            user.block === 'B'
        );

        const representativeNames = filteredUsers
            .filter(user => user.role === 'REPRESENTATIVE')
            .map(representative => `${representative.firstName} ${representative.lastName}`);

        res.render("Treasurer_BSIT_3A_remittance", {
            blockKey: 'BSIT - 3B',
            representativeNames,
            filteredUsers,
            payables,
            remittances 
        });
    })
    .catch(error => {
        console.error(error);
        res.status(500).render("error", { message: "Unable to retrieve data" });
    });
};

const student = (req, res) => {
    const { yearLevel, block } = req.query;

    model.register_user.findAll({
        where: {
            yearLevel: yearLevel,
            block: block,
            role: ['student', 'representative']
        }
    })
    .then(students => {
        res.json({ students });
    })
    .catch(error => {
        console.error(error);
        res.status(500).json({ error: 'Unable to fetch students.' });
    });
}; 

const create_payable = (req, res) => {
    const { yearLevel, block, student, description, amount } = req.body;

    let searchCondition = {
        yearLevel: yearLevel,
        block: block,
        role: ['STUDENT', 'REPRESENTATIVE', 'TREASURER'],
    };

    if (student !== "all") {
        const nameParts = student.trim().split(' ');

        searchCondition = {
            ...searchCondition,
            [Op.or]: [
                { firstName: { [Op.in]: nameParts } },
                { lastName: { [Op.in]: nameParts } }
            ]
        };
    }

    model.register_user.findAll({ where: searchCondition })
        .then(students => {
            if (students.length === 0) {
                return res.status(404).render("Treasurer_create_payable", { 
                    message: "No students found for the selected year, block, or name.",
                    messageType: 'error'
                });
            }

            const checkPromises = students.map(student =>
                model.payable.findOne({
                    where: {
                        student: `${student.firstName} ${student.lastName}`.toUpperCase(),
                        description: description.toUpperCase()
                    }
                }).then(existingPayable => {
                    if (existingPayable) {
                        throw new Error(`Payable already exists for student ${student.firstName} ${student.lastName}`);
                    }
                    return student;
                })
            );

            return Promise.all(checkPromises);
        })
        .then(validStudents => {
            const payables = validStudents.map(student => ({
                yearLevel: yearLevel,
                block: block,
                student: `${student.firstName} ${student.lastName}`.toUpperCase(),
                description: description.toUpperCase(),
                amount: amount,
            }));

            return model.payable.bulkCreate(payables);
        })
        .then(() => {
            res.status(200).render("Treasurer_create_payable", { 
                message: "Payables successfully created!",
                messageType: 'success' 
            });
        })
        .catch(error => {
            console.error(error);
            if (error.message.includes("Payable already exists")) {
                return res.status(400).render("Treasurer_create_payable", { 
                    message: error.message,
                    messageType: 'error' 
                });
            }
            res.status(500).render("error", { 
                message: "Unable to create payables.",
                messageType: 'error' 
            });
        });
};

const Display_Student_Info = (req, res) => {
    const userId = req.params.userId;

    model.register_user.findOne({ where: { userId: userId } })
        .then(student => {
            if (!student) {
                return res.status(404).render("error", { message: "Student not found." });
            }
            return model.payable.findAll({ where: { student: `${student.firstName} ${student.lastName}` } })
                .then(payables => {
                    return model.remittance.findAll({ where: { student: `${student.firstName} ${student.lastName}` } })
                        .then(remittances => {

                            const payablesWithBalance = payables.map(payable => {
                                const matchedRemittance = remittances.find(rem => rem.payable === payable.description);
                                const amountPaid = matchedRemittance ? matchedRemittance.paid : 0;
                                const balance = payable.amount;

                                return {
                                    ...payable.toJSON(),
                                    amountPaid,
                                    balance
                                };
                            });

                            const currentDate = new Date().toLocaleDateString(); 

                            res.render("Treasurer_studentInfo", { 
                                student, 
                                payables: payablesWithBalance, 
                                remittances,
                                currentDate 
                            });
                        });
                });
        })
        .catch(error => {
            console.error(error);
            res.status(500).render("error", { message: "Unable to retrieve student information." });
        });
};



function getCurrentLocalDate() {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset()); 
    return now.toISOString().split('T')[0]; 
}

const save_remittance = async (req, res) => {
    const { studentName, studentBlock, studentYearLevel, studentId } = req.body;

    const remittances = [];

    for (const [key, value] of Object.entries(req.body)) {
        if (key.startsWith('Description_')) {
            const payableId = key.split('_')[1];
            const description = req.body[`Description_${payableId}`];
            const paidAmount = req.body[`paidAmount_${payableId}`];
            const balances = req.body[`balance${payableId}`];

            if (paidAmount && paidAmount > 0) {
                const existingRemittance = await model.remittance.findOne({
                    where: {
                        student: studentName,
                        payable: description,
                        date: getCurrentLocalDate()
                    }
                });

                if (!existingRemittance) {
                    remittances.push({
                        student: studentName,
                        block: studentBlock,
                        yearLevel: studentYearLevel,
                        payable: description,
                        paid: paidAmount,
                        balance: balances - paidAmount,
                        date: getCurrentLocalDate(),
                        status: 'pending' 
                    });

                    const payable = await model.payable.findOne({
                        where: {
                            student: studentName,
                            description: description
                        }
                    });

                    if (payable) {
                        const newBalance = payable.amount - paidAmount;

                        await model.payable.update(
                            { amount: newBalance },
                            {
                                where: {
                                    student: studentName,
                                    description: description
                                }
                            }
                        );
                    }
                }
            }
        }
    }

    if (remittances.length > 0) {
        try {
            const results = await Promise.all(
                remittances.map(remittance => model.remittance.create(remittance))
            );
            res.redirect(`/Display_Student_Info/${studentId}`);
        } catch (error) {
            console.error("Error saving remittance:", error);
            res.status(500).send("Failed to save remittances.");
        }
    } else {
        res.status(400).send("No valid payable amounts provided.");
    }
};

const treasurer_3A_verify_remittance = (req, res) => {
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
        
        console.log("Representatives:", representatives); 


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
                    status: remittance.status  
                };
            }
        }).filter(remittance => remittance);  

        console.log("Filtered Student Remittances:", studentRemittances); 

        const representativeNames = representatives
            .filter(rep => rep.block === 'A')  
            .map(representative => `${representative.firstName} ${representative.lastName}`);

        res.render("Treasurer_verify_remittance", {
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

const treasurer_3B_verify_remittance = (req, res) => {
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

        res.render("Treasurer_verify_remittance", {
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


const updateStudent = (req, res) => {
    const { studentId, firstName, lastName, gender, yearLevel, block, payable: payableId,  } = req.body;

    model.register_user.update(
        { firstName, lastName, gender, yearLevel, block },
        { where: { userId: studentId } }
    )
    .then(() => {
        console.log("Student record updated successfully.");
        return model.payable.findOne({ where: { id: payableId } });
    })
    .then((payableRecord) => {
        if (!payableRecord) {
            throw new Error('Payable record not found.');
        }
        console.log("Payable record found: ", payableRecord);

        return model.payable.update(
            { student: `${firstName} ${lastName}`,yearLevel ,block},
            { where: { id: payableId } }
        );  
    })
    .then(() => {
        console.log("Payable record updated successfully.");
        return model.remittance.findOne({ where: { id: payableId } });
    })
    .then((remittanceRecord) => {
        if (!remittanceRecord) {
            throw new Error('Payable record not found.');
        }
        console.log("Payable record found: ", remittanceRecord);

        return model.remittance.update(
            { student: `${firstName} ${lastName}`},
            { where: { id: payableId } }
        );  
    })
       
    .then(() => {
        res.status(200).json({ success: true, message: 'Student information, payable, and remittance updated successfully.' });
    })
    .catch((error) => {
        console.error('Error updating student information, payable, or remittance:', error.message);
        res.status(500).json({ success: false, message: error.message });
    });
};

const Treasurer_save_fund = (req, res) => {
    const { Receive, date } = req.body; 
    
    if (Receive && date) {

        model.remittance.update(
            { 
                status: 'Received',  
                date: date         
            },
            {
                where: {
                    status: 'Pending'  
                }
            })
            .then(() => {
                res.redirect('/Treasurer_3A_verify_remittance'); 
            })
            .catch(err => {
                console.error(err);
                res.status(500).send("Error updating the remittance status");
            });
    } else {
        res.status(400).send("Invalid form submission");
    }
};

//admin

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
        
        console.log("Representatives:", representatives); 


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
                    status: remittance.status  
                };
            }
        }).filter(remittance => remittance);  

        console.log("Filtered Student Remittances:", studentRemittances); 

        const representativeNames = representatives
            .filter(rep => rep.block === 'A')  
            .map(representative => `${representative.firstName} ${representative.lastName}`);

        res.render("Treasurer_verify_remittance", {
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

        res.render("Treasurer_verify_remittance", {
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
    login,
    student,
    register_user_by_role,
    Treasurer_create_payable,
    Treasurer_dashboard,
    Treasurer_register_user,
    Display_BSIT_3A,
    Display_BSIT_3B,
    create_payable,
    Display_Student_Info,
    save_remittance,
    login_post,
    treasurer_3A_verify_remittance,
    treasurer_3B_verify_remittance,
    Treasurer_save_fund,
    updateStudent,

///admin
    Admin_register_user,
    Admin_dashboard,
    Admin_3A_verify_remittance,
    Admin_3B_verify_remittance,
 
  
};
