const model = require('../models');

const login = (req, res) => {
    res.render('login');
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
        lastName: req.body.lastName,
        firstName: req.body.firstName,
        yearLevel: req.body.yearLevel,
        block: req.body.block,
        gender: req.body.gender,
        role: req.body.role,
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
    return model.register_user.create(register_post_db)
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
            model.payable.findAll()
        ])
        .then(([users, payables]) => {
            const filteredUsers = users.filter(user =>
                ['student', 'representative'].includes(user.role) &&
                user.yearLevel === '3' &&
                user.block === 'A'
            );

            const representativeNames = filteredUsers
                .filter(user => user.role === 'representative')
                .map(representative => `${representative.firstName} ${representative.lastName}`);

            res.render("Treasurer_BSIT_3A_remittance", {
                blockKey: 'BSIT - 3A',
                representativeNames,
                filteredUsers,
                payables
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
            model.payable.findAll()
        ])
        .then(([users, payables]) => {
            const filteredUsers = users.filter(user =>
                ['student', 'representative'].includes(user.role) &&
                user.yearLevel === '3' &&
                user.block === 'B'
            );

            const representativeNames = filteredUsers
                .filter(user => user.role === 'representative')
                .map(representative => `${representative.firstName} ${representative.lastName}`);

            res.render("Treasurer_BSIT_3A_remittance", {
                blockKey: 'BSIT - 3B',
                representativeNames,
                filteredUsers,
                payables
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
        const [firstName, lastName] = student.split(' ');
        searchCondition = { ...searchCondition, firstName, lastName };
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
                                const balance = payable.amount - amountPaid;

                                return {
                                    ...payable.toJSON(),
                                    amountPaid,
                                    balance
                                };
                            });

                            res.render("Treasurer_studentInfo", { student, payables: payablesWithBalance, remittances });
                        });
                });
        })
        .catch(error => {
            console.error(error);
            res.status(500).render("error", { message: "Unable to retrieve student information." });
        });
};
// Save remittance
const save_remittance = (req, res) => {
    const { date, paidAmounts, studentId } = req.body;
    const remittancePromises = [];
    let hasValidPayments = false;
    let hasNegativeBalance = false;

    console.log("Incoming date:", date); // Log incoming date for debugging

    // Ensure the date is in "YYYY-MM-DD" format
    const dateParts = date.split('-'); // Assuming date is in "YYYY-MM-DD"
    if (dateParts.length !== 3) {
        return res.status(400).render("error", { message: "Invalid date format. Please use YYYY-MM-DD." });
    }

    const [year, month, day] = dateParts;

    // Ensure month and day are two digits
    const formattedMonth = month.padStart(2, '0');
    const formattedDay = day.padStart(2, '0');

    const saveDate = `${year}-${formattedMonth}-${formattedDay}`; // Construct the date in the correct format
    console.log("Date to be saved:", saveDate); // Check the output

    for (const payableId in paidAmounts) {
        const amountPaid = parseFloat(paidAmounts[payableId]);

        if (amountPaid > 0) {
            hasValidPayments = true;
            remittancePromises.push(
                model.payable.findByPk(payableId).then((payable) => {
                    if (!payable) {
                        console.error(`Payable with ID ${payableId} not found`);
                        return Promise.resolve();
                    }

                    const balance = payable.amount - amountPaid;

                    if (balance < 0) {
                        hasNegativeBalance = true;
                    }

                    const remittance = {
                        payable: payable.description,
                        date: saveDate,  
                        paid: amountPaid,
                        balance,
                        description: payable.description,
                        yearLevel: payable.yearLevel,
                        block: payable.block,
                        student: payable.student
                    };

                    return model.remittance.create(remittance).catch((error) => {
                        console.error('Error saving remittance:', error.message);
                    });
                })
            );
        }
    }

    Promise.all(remittancePromises)
        .then(() => {
            if (hasValidPayments && !hasNegativeBalance) {
                res.redirect(`/Display_Student_Info/${studentId}`);
            } else {
                res.status(400).render("error", { message: hasNegativeBalance ? "One or more payments exceed the balance." : "No valid payments to save." });
            }
        })
        .catch((error) => {
            console.error('Error processing remittance:', error);
            res.status(500).render("error", { message: "Unable to save remittance." });
        });
};




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
};
