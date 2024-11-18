const model = require('../models');
const bcrypt = require('bcrypt'); 
const { Op } = require('sequelize');
const jwt = require('jsonwebtoken')
require ("dotenv").config()

const login = (req, res) => {
    res.render('login'); 

};
const login_post = async (req, res) => {
    const {username, password} = req.body;

    try {
        const user = await model.register_user.findOne({where: {userName:username}});
        if (!user) return res.status(400).redirect ("login")

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch)return res.status(400).redirect ("login")

        const outTokenValue = jwt.sign({
            exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24),
            role: user.role,
            userid:user.id,
            firstname: user.firstName,
            lastname: user.lastName,
             }, process.env.JWT_SECRET,)

             res.cookie("funds", outTokenValue,{
                httpOnly:true,
                secure:true,
                sameSite:"strict",
                maxAge:1000*60*60*24    

             });

             return res.redirect("Treasurer_dashboard")
                
    } catch (error) {
        console.log(error);
        
    }
 
};

const Admin_dashboard = (req, res) => {
    res.render('Admin_dashboard');
};

const Admin_register_user = (req, res) => {
    res.render('Admin_register_user');
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
        return res.status(status).render("Treasurer_register_user", { message: "Something went wrong, please try again!" });
    };

    model.register_user.findOne({ where: { userId: register_post_db.userId } })
        .then(existingUser => {
            if (existingUser) {
                return res.status(400).render("Treasurer_register_user", {
                    message: "User ID already exists. Please use a different ID.",
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
                        message: `A user with the name ${register_post_db.firstName} ${register_post_db.lastName} already exists in Year ${register_post_db.yearLevel} and Block ${register_post_db.block}.`
                    });
                }

                if (register_post_db.role === "representative") {
                    return model.register_user.findOne({
                        where: {
                            yearLevel: register_post_db.yearLevel,
                            block: register_post_db.block,
                            role: "representative"
                        }
                    })
                    .then(existingRepresentative => {
                        if (existingRepresentative) {
                            return res.status(400).render("Treasurer_register_user", {
                                message: `A representative for Year ${register_post_db.yearLevel} and Block ${register_post_db.block} already exists.`
                            });
                        }
                        return createUser(register_post_db, res);
                    })
                    .catch(() => handleError("Representative Check Error:"));
                }

                if (register_post_db.role === "treasurer") {
                    return model.register_user.findOne({
                        where: {
                            yearLevel: register_post_db.yearLevel,
                            block: register_post_db.block,
                            role: "treasurer"
                        }
                    })
                    .then(existingTreasurer => {
                        if (existingTreasurer) {
                            return res.status(400).render("Treasurer_register_user", {
                                message: `A treasurer for Year ${register_post_db.yearLevel} and Block ${register_post_db.block} already exists. Only one treasurer is allowed per block.`
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
                return res.status(500).render("Treasurer_register_user", { message: "Something went wrong while hashing the password!" });
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
            res.status(200).render("Treasurer_register_user", { message: "Registration successful!" });
        })
        .catch(error => {
            console.error("Database Insert Error:", error);
            res.status(500).render("Treasurer_register_user", { message: "Something went wrong, please try again!" });
        });
};


const Treasurer_dashboard = (req, res) => {
    res.render('Treasurer_dashboard');
};


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
            ['STUDENT', 'REPRESENTATIVE'].includes(user.role) &&
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
            ['STUDENT', 'REPRESENTATIVE'].includes(user.role) &&
            user.yearLevel === '3' &&
            user.block === 'B'
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
        role: ['student', 'representative']
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
                return res.status(404).render("error", { message: "No students found for the selected year, block, or name." });
            }

            const payables = students.map(student => ({
                yearLevel: yearLevel,
                block: block,
                student: `${student.firstName} ${student.lastName}`,
                description: description,
                amount: amount,
            }));

            return model.payable.bulkCreate(payables);
        })
        .then(() => {
            res.status(200).render("Treasurer_create_payable", { message: "Payables successfully created!" });
        })
        .catch(error => {
            console.error(error);
            res.status(500).render("error", { message: "Unable to create payables." });
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
            
            if (student && student.block === 'A') {
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

        console.log("Student Remittances:", studentRemittances); 

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
            
            if (student && student.block === 'B') {
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

        console.log("Student Remittances:", studentRemittances); 

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


const Treasurer_save_fund = (req, res)=> {
    

    const { yearlevel, block, amount, date } = req.body;
 
}

const updateStudent = async (req, res) => {
    const { studentId, firstName, lastName, gender, yearLevel, block, payable, amountPaid } = req.body;

    try {
        // Update the student's information
        await register_user.update({
            firstName,
            lastName,
            gender,
            yearLevel,
            block
        }, {
            where: { userId: studentId }
        });

        // Update the remittance record
        const remittanceRecord = await remittance.findOne({
            where: { student: studentId, payable }
        });

        if (remittanceRecord) {
            const newPaidAmount = remittanceRecord.paid + parseInt(amountPaid, 10);
            const newBalance = remittanceRecord.balance - newPaidAmount;

            await remittance.update({
                paid: newPaidAmount,
                balance: newBalance
            }, {
                where: { student: studentId, payable }
            });
        }

        res.status(200).json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'An error occurred while updating student information.' });
    }
}

module.exports = {
    login,
    Admin_dashboard,
    Admin_register_user,
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
    updateStudent
};
