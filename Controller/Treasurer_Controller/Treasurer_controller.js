const model = require('../../models');
const bcrypt = require('bcrypt'); 
const { Op } = require('sequelize');
const jwt = require('jsonwebtoken')
require ("dotenv").config()
const { Sequelize } = require('sequelize');

const login = (req, res) => {
    res.render('login'); 
};

const login_post = async (req, res) => {
    const { username, password } = req.body;

    // Log for debugging input
    console.log("Login attempt received");
    console.log("Username received:", username);
    console.log("Password received:", password);

    try {
        // Find user in the database (ensure case insensitivity and trim)
        const user = await model.register_user.findOne({
            where: { userName: username.trim() }
        });

        console.log("User found in DB:", user);

        // If user is not found
        if (!user) {
            console.log("User not found in database");
            return res.status(400).redirect("login"); // Redirect to login page
        }

        // Verify the password using bcrypt
        const passwordMatch = await bcrypt.compare(password, user.password);
        console.log("Password match:", passwordMatch);

        if (!passwordMatch) {
            console.log("Password mismatch for user:", username);
            return res.status(400).redirect("login");
        }

        // Generate JWT Token
        const outTokenValue = jwt.sign(
            {
                exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // Token expires in 24 hours
                role: user.role.trim().toUpperCase(), // Normalize role
                userid: user.id,
                firstname: user.firstName,
                lastname: user.lastName,
            },
            process.env.JWT_SECRET
        );

        console.log("Generated JWT Token:", outTokenValue);

        // Set JWT Token in cookie
        res.cookie("funds", outTokenValue, {
            httpOnly: true,
            sameSite: "strict",
            maxAge: 1000 * 60 * 60 * 24, // 24 hours
        });

        // Redirect based on role
        switch (user.role.trim().toUpperCase()) {
            case 'ADMIN':
                console.log("Redirecting to Admin Dashboard");
                return res.redirect('/Admin_dashboard');
            case 'TREASURER':
                console.log("Redirecting to Treasurer Dashboard");
                return res.redirect('/Treasurer_dashboard');
            case 'REPRESENTATIVE':
                console.log("Redirecting to Representative Dashboard");
                return res.redirect('/Representative_dashboard');
            default:
                console.log("Unrecognized role:", user.role);
                return res.status(400).redirect("login"); // Redirect if role is unrecognized
        }
    } catch (error) {
        console.error("Error in login_post:", error);
        return res.status(500).redirect("login"); // Redirect on server error
    }
};



const logout = (req, res) => {
    try {
        // Clear the "funds" cookie
        res.clearCookie("funds", {
            httpOnly: true,
            sameSite: "strict",
        });

        console.log("User logged out successfully.");
        return res.redirect("/login"); // Redirect to login page after logout
    } catch (error) {
        console.log("Logout error:", error);
        return res.status(500).send("Logout failed. Please try again.");
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
        register_post_db.userName = "N/A";
        register_post_db.password = "N/A";
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
    const token = req.cookies.funds;

    if (!token) {
        return res.redirect('login');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const treasurerName = decoded.firstname + ' ' + decoded.lastname;

        Promise.all([
            model.fund.sum('amountReceive'),
            model.payable.sum('balances', {
                where: {
                    block: ['A', 'B']
                }
            })
        ])
        .then(([totalFunds, blockABalances]) => {
            res.render('Treasurer_dashboard', {
                treasurerName: treasurerName,
                totalFunds: totalFunds || 0,
                blockABalances: blockABalances || 0
            });
        })
        .catch(err => {
            console.error(err);
            res.render('Treasurer_dashboard', {
                treasurerName: treasurerName,
                totalFunds: 0,
                blockABalances: 0
            });
        });
    } catch (err) {
        console.error('JWT verification error:', err);
        return res.redirect('login');
    }
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
        // Filter users based on role, year level, and block
        const filteredUsers = users.filter(user =>
            ['STUDENT', 'REPRESENTATIVE', 'TREASURER'].includes(user.role) &&
            user.yearLevel === '3' &&
            user.block === 'A'
        );

        // Get and sort representative names
        const representativeNames = filteredUsers
            .filter(user => user.role === 'REPRESENTATIVE')
            .map(representative => `${representative.firstName} ${representative.lastName}`)
            .sort(); 

        // Map user data and include payables
        const userPayablesWithBalances = filteredUsers.map(user => {
            const userPayables = payables.filter(payable => 
                payable.student === `${user.firstName} ${user.lastName}`.toUpperCase()
            );

            return {
                ...user.toJSON(),
                payables: userPayables.map(payable => ({
                    description: payable.payables,
                    balance: payable.balances
                }))
            };
        }).sort((a, b) => {
            // Sort by lastName, and then by firstName if lastName is the same
            const lastNameA = a.lastName.toUpperCase();
            const lastNameB = b.lastName.toUpperCase();
            if (lastNameA < lastNameB) return -1;
            if (lastNameA > lastNameB) return 1;
            const firstNameA = a.firstName.toUpperCase();
            const firstNameB = b.firstName.toUpperCase();
            return firstNameA.localeCompare(firstNameB);
        });

        // Render the EJS view with sorted data
        res.render("Treasurer_BSIT_3A_remittance", {
            blockKey: 'BSIT - 3B',
            representativeNames,
            filteredUsers: userPayablesWithBalances,
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
        // Filter users based on role, year level, and block
        const filteredUsers = users.filter(user =>
            ['STUDENT', 'REPRESENTATIVE', 'TREASURER'].includes(user.role) &&
            user.yearLevel === '3' &&
            user.block === 'B'
        );

        // Get and sort representative names
        const representativeNames = filteredUsers
            .filter(user => user.role === 'REPRESENTATIVE')
            .map(representative => `${representative.firstName} ${representative.lastName}`)
            .sort(); 

        // Map user data and include payables
        const userPayablesWithBalances = filteredUsers.map(user => {
            const userPayables = payables.filter(payable => 
                payable.student === `${user.firstName} ${user.lastName}`.toUpperCase()
            );

            return {
                ...user.toJSON(),
                payables: userPayables.map(payable => ({
                    description: payable.payables,
                    balance: payable.balances
                }))
            };
        }).sort((a, b) => {
            // Sort by lastName, and then by firstName if lastName is the same
            const lastNameA = a.lastName.toUpperCase();
            const lastNameB = b.lastName.toUpperCase();
            if (lastNameA < lastNameB) return -1;
            if (lastNameA > lastNameB) return 1;
            const firstNameA = a.firstName.toUpperCase();
            const firstNameB = b.firstName.toUpperCase();
            return firstNameA.localeCompare(firstNameB);
        });

        // Render the EJS view with sorted data
        res.render("Treasurer_BSIT_3A_remittance", {
            blockKey: 'BSIT - 3B',
            representativeNames,
            filteredUsers: userPayablesWithBalances,
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

    const searchCondition = {
        yearLevel: yearLevel,
        block: block,
        role: { [Op.in]: ['STUDENT', 'REPRESENTATIVE', 'TREASURER'] },
    };

    model.register_user.findAll({ where: searchCondition })
        .then(students => {
            res.json({ students });
        })
        .catch(error => {
            console.error(error);
            res.status(500).send("Error fetching students.");
        });
}; 



const create_payable = (req, res) => {
    const { yearLevel, block, student, description, amount } = req.body;

    if (!yearLevel || !block || !description || !amount) {
        return res.status(400).render("Treasurer_create_payable", {
            message: "All fields are required.",
            messageType: 'error',
        });
    }

    let searchCondition = { role: { [Op.in]: ['STUDENT', 'REPRESENTATIVE', 'TREASURER'] } };

    // Add specific conditions if "all" is not selected
    if (yearLevel !== "all") {
        searchCondition.yearLevel = yearLevel;
    }

    if (block !== "all") {
        searchCondition.block = block;
    }

    if (student !== "all") {
        const nameParts = student.trim().split(' ');
        searchCondition = {
            ...searchCondition,
            [Op.or]: [
                { firstName: { [Op.in]: nameParts } },
                { lastName: { [Op.in]: nameParts } }
            ],
        };
    }

    model.register_user.findAll({ where: searchCondition })
        .then(students => {
            if (!students.length) {
                return res.status(404).render("Treasurer_create_payable", {
                    message: "No students found for the selected criteria.",
                    messageType: 'error',
                });
            }

            const checkPromises = students.map(student =>
                model.payable.findOne({
                    where: {
                        student: `${student.firstName} ${student.lastName}`.toUpperCase(),
                        payables: description.toUpperCase(),
                    },
                }).then(existingPayable => {
                    if (existingPayable) {
                        throw new Error(
                            `Payable already exists for ${student.firstName} ${student.lastName}`
                        );
                    }
                    return student;
                })
            );

            return Promise.all(checkPromises);
        })
        .then(validStudents => {
            const payables = validStudents.map(student => ({
                userId: student.userId, 
                gender: student.gender, 
                yearLevel: student.yearLevel, // Save student's actual yearLevel
                block: student.block, // Save student's actual block
                student: `${student.firstName} ${student.lastName}`.toUpperCase(),
                payables: description.toUpperCase(),
                balances: amount,
            }));

            return model.payable.bulkCreate(payables);
        })
        .then(() => {
            res.status(200).render("Treasurer_create_payable", {
                message: "Payables successfully created!",
                messageType: 'success',
            });
        })
        .catch(error => {
            console.error(error);

            if (error.message.includes("Payable already exists")) {
                return res.status(400).render("Treasurer_create_payable", {
                    message: error.message,
                    messageType: 'error',
                });
            }

            res.status(500).render("Treasurer_create_payable", {
                message: "Unable to create payables. Please try again.",
                messageType: 'error',
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

            const studentFullName = `${student.firstName} ${student.lastName}`;

            // Retrieve payables and remittances for the student
            return model.payable.findAll({ where: { student: studentFullName } })
                .then(payables => {
                    return model.remittance.findAll({ where: { student: studentFullName } })
                        .then(remittances => {                            const payablesWithBalance = payables.map(payable => {
                                const matchedRemittance = remittances.find(
                                    remittance => remittance.payables === payable.payables // Match payables and remittances by description
                                );

                                const amountPaid = matchedRemittance ? matchedRemittance.paid : 0; // Get paid amount if available
                                const updatedBalance = payable.balances; // Balances are already updated in the database

                                return {
                                    ...payable.toJSON(),
                                    amountPaid,
                                    updatedBalance
                                };
                            });

                            // Format the current date in 'YYYY-MM-DD'
                            const currentDate = new Date().toISOString().split("T")[0];

                            // Render the student info page with the necessary data
                            res.render("Treasurer_student_Info", {
                                student,
                                payables: payablesWithBalance,
                                remittances,
                                currentDate
                            });
                        });
                });
        })
        .catch(error => {
            console.error("Error retrieving student information:", error);
            res.status(500).render("error", { message: "Unable to retrieve student information." });
        });
};

function getCurrentLocalDate() {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset()); 
    return now.toISOString().split('T')[0]; 
}

const save_remittance = (req, res) => {
    const { studentName, studentBlock, studentYearLevel, studentId } = req.body;
    const remittances = [];
    let updatePromises = [];

    model.register_user.findOne({
        where: {
            role: 'TREASURER',
        }
    }).then(treasurer => {
        if (!treasurer) {
            throw new Error(`Treasurer not found for Block: ${studentBlock}, Year Level: ${studentYearLevel}`);
        }

        const { firstName, lastName } = treasurer;

        // Process the payables
        for (const [key, value] of Object.entries(req.body)) {
            if (key.startsWith('Description_')) {
                const payableId = key.split('_')[1];
                const description = req.body[`Description_${payableId}`];
                const paidAmount = parseFloat(req.body[`inputtedAmount_${payableId}`]);
                const balances = parseFloat(req.body[`balance_${payableId}`]);

                if (!isNaN(paidAmount) && paidAmount > 0 && !isNaN(balances)) {
                    const newBalance = balances - paidAmount;

                    if (newBalance < 0) {
                        console.log(`Cannot process payment. The balance after payment would be negative: ${newBalance}`);
                        continue;
                    }

                    updatePromises.push(
                        model.payable.findOne({
                            where: {
                                student: studentName,
                                payables: description
                            }
                        }).then(payable => {
                            if (payable) {
                                const gender = payable.gender;

                                return model.remittance.findOne({
                                    where: {
                                        student: studentName,
                                        payables: description,
                                        block: studentBlock,
                                        yearLevel: studentYearLevel,
                                        date: getCurrentLocalDate()
                                    }
                                }).then(existingRemittance => {
                                    if (existingRemittance) {
                                        const updatedPaidAmount = existingRemittance.paid + paidAmount;
                                        const updatedBalance = payable.balances - paidAmount;

                                        return model.remittance.update(
                                            { paid: updatedPaidAmount, balances: updatedBalance },
                                            { where: { id: existingRemittance.id } }
                                        ).then(() => {
                                            return model.payable.update(
                                                { balances: updatedBalance },
                                                {
                                                    where: {
                                                        student: studentName,
                                                        payables: description
                                                    }
                                                }
                                            );
                                        });
                                    } else {
                                        remittances.push({
                                            userId: studentId,
                                            student: studentName,
                                            block: studentBlock,
                                            yearLevel: studentYearLevel,
                                            gender: gender,
                                            payables: description,
                                            paid: paidAmount,
                                            balances: newBalance,
                                            date: getCurrentLocalDate(),
                                            status: 'pendings',
                                            remittedBy: `${firstName} ${lastName}`
                                        });

                                        return model.payable.update(
                                            { balances: newBalance },
                                            {
                                                where: {
                                                    student: studentName,
                                                    payables: description
                                                }
                                            }
                                        );
                                    }
                                });
                            }
                        }).catch(err => {
                            console.error("Error fetching payable record:", err);
                        })
                    );
                } else {
                    console.log(`Invalid paidAmount or balance: Paid Amount: ${paidAmount}, Balance: ${balances}`);
                }
            }
        }

        // Save the changes and remittance records
        Promise.all(updatePromises)
            .then(() => {
                if (remittances.length > 0) {
                    return model.remittance.bulkCreate(remittances);
                }
            })
            .then(() => {
                res.render("Treasurer_student_Info", { 
                    message: "Remittance processed successfully!", 
                    messageType: 'success' 
                });
                res.redirect(`/Display_Student_Info/${studentId}`);
            })
            .catch(error => {
                console.error("Error in remittance processing:", error);
                res.render("Treasurer_student_Info", { 
                    message: "Failed to save remittances. Please try again.", 
                    messageType: 'error' 
                });
            });
    }).catch(err => {
        console.error("Error finding treasurer:", err);
        res.render("Treasurer_student_Info", { 
            message: "Error processing remittance. Please try again.", 
            messageType: 'error' 
        });
    });
};



function getCurrentLocalDate() {
    const date = new Date();
    return date.toISOString().split('T')[0];
}
const treasurer_3A_verify_remittance = (req, res) => {
    const selectedDate = req.query.date || '';

    // Fetch specific data based on filters
    Promise.all([
        model.register_user.findAll(),
        model.remittance.findAll(),
        model.denomination.findAll({
            where: {
                yearLevel: 3,
                block: 'A'
            }
        })
    ])
    .then(([users, remittances, denominations]) => {
        // Filter students in block A and year 3
        const filteredStudents = users.filter(user =>
            user.role === 'STUDENT' &&
            user.yearLevel === '3' &&
            user.block === 'A'
        );

        const representatives = users.filter(user => user.role === 'REPRESENTATIVE');
        const treasurer = users.find(user => user.role === 'TREASURER');

        // Filter remittances for block A and year 3 students only, excluding 'receivedByTreasurer' status and remittances made by the treasurer
        const filteredRemittances = remittances.filter(remittance => {
            const student = users.find(user => `${user.firstName} ${user.lastName}` === remittance.student);
            return student && student.block === 'A' && student.yearLevel === '3' && remittance.status !== 'Verified' && remittance.remittedBy !== treasurer?.firstName + ' ' + treasurer?.lastName;
        });

        // Map filtered remittances
        const studentRemittances = filteredRemittances.map(remittance => {
            const student = users.find(user => `${user.firstName} ${user.lastName}` === remittance.student);
            if (student) {
                const representative = representatives.find(rep => rep.block === student.block && rep.yearLevel === student.yearLevel);
                const remittedByUser = users.find(user => `${user.firstName} ${user.lastName}` === remittance.remittedBy);

                return {
                    studentName: remittance.student,
                    payment: remittance.payables,  // Can be renamed to 'payables' if you updated the field name
                    amountPaid: remittance.paid,
                    date: remittance.date,
                    block: student.block,
                    representativeName: representative ? `${representative.firstName} ${representative.lastName}` : 'N/A',
                    treasurerName: treasurer ? `${treasurer.firstName} ${treasurer.lastName}` : 'N/A',
                    remittedBy: remittedByUser ? `${remittedByUser.firstName} ${remittedByUser.lastName}` : remittance.remittedBy || 'N/A',
                    status: remittance.status
                };
            }
        }).filter(remittance => remittance); // Filter out undefined remittances

        console.log("Filtered Student Remittances:", studentRemittances);

        const representativeNames = representatives
            .filter(rep => rep.block === 'A' && rep.yearLevel === '3')
            .map(representative => `${representative.firstName} ${representative.lastName}`);

        // Pass the filtered data to the view
        res.render("Treasurer_verify_remittance", {
            blockKey: 'BSIT - 3A',
            yearLevel: '3',
            block: 'A',
            studentRemittances,
            representativeNames,
            filteredStudents,
            selectedDate,
            denominations
        });
    })
    .catch(error => {
        console.error(error);
        res.status(500).render("error", { message: "Unable to retrieve data" });
    });
};


const treasurer_3B_verify_remittance = (req, res) => {
    const selectedDate = req.query.date || '';

    Promise.all([
        model.register_user.findAll(),
        model.remittance.findAll(),
        model.denomination.findAll({
            where: {
                yearLevel: 3,
                block: 'B'
            }
        })
    ])
    .then(([users, remittances, denominations]) => {
        const filteredStudents = users.filter(user =>
            user.role === 'STUDENT' &&
            user.yearLevel === '3' &&
            user.block === 'B'
        );

        const representatives = users.filter(user => user.role === 'REPRESENTATIVE');
        const treasurer = users.find(user => user.role === 'TREASURER');

        const filteredRemittances = remittances.filter(remittance => {
            const student = users.find(user => `${user.firstName} ${user.lastName}` === remittance.student);
            return student && student.block === 'B' && student.yearLevel === '3' && remittance.status !== 'Verified' && remittance.remittedBy !== treasurer?.firstName + ' ' + treasurer?.lastName;
        });


        const studentRemittances = filteredRemittances.map(remittance => {
            const student = users.find(user => `${user.firstName} ${user.lastName}` === remittance.student);
            if (student) {
                const representative = representatives.find(rep => rep.block === student.block && rep.yearLevel === student.yearLevel);
                const remittedByUser = users.find(user => `${user.firstName} ${user.lastName}` === remittance.remittedBy);

                return {
                    studentName: remittance.student,
                    payment: remittance.payables,  
                    amountPaid: remittance.paid,
                    date: remittance.date,
                    block: student.block,
                    representativeName: representative ? `${representative.firstName} ${representative.lastName}` : 'N/A',
                    treasurerName: treasurer ? `${treasurer.firstName} ${treasurer.lastName}` : 'N/A',
                    remittedBy: remittedByUser ? `${remittedByUser.firstName} ${remittedByUser.lastName}` : remittance.remittedBy || 'N/A',
                    status: remittance.status
                };
            }
        }).filter(remittance => remittance); 

        console.log("Filtered Student Remittances:", studentRemittances);

        const representativeNames = representatives
            .filter(rep => rep.block === 'B' && rep.yearLevel === '3')
            .map(representative => `${representative.firstName} ${representative.lastName}`);

        // Pass the filtered data to the view
        res.render("Treasurer_verify_remittance", {
            blockKey: 'BSIT - 3B',
            yearLevel: '3',
            block: 'B',
            studentRemittances,
            representativeNames,
            filteredStudents,
            selectedDate,
            denominations
        });
    })
    .catch(error => {
        console.error(error);
        res.status(500).render("error", { message: "Unable to retrieve data" });
    });
};


const updateStudent = (req, res) => {
    const { studentId, userId, firstName, lastName, gender, yearLevel, block, role, password } = req.body;

    const uppercaseData = {
        userId: userId.toUpperCase(),
        firstName: firstName.toUpperCase(),
        lastName: lastName.toUpperCase(),
        gender: gender.toUpperCase(),
        yearLevel: yearLevel.toString(),
        block: block.toUpperCase(),
        role: role.toUpperCase(),
        password: password
    };

    let username = '';
    let passwordToSave = uppercaseData.password; 

    if (uppercaseData.role === 'TREASURER') {
        model.register_user.findOne({ where: { role: 'TREASURER' } })
            .then(existingTreasurer => {
                if (existingTreasurer && existingTreasurer.userId !== studentId) {
                    throw new Error('A treasurer already exists in the system.');
                }

                username = uppercaseData.userId;

                return updateUserAndRelatedRecords();
            })
            .catch(error => {
                console.error('Error checking for existing treasurer:', error.message);
                res.redirect(`/Display_Student_Info/${studentId}?error=TREASURER_EXISTS`);
            });
    } else {
        if (uppercaseData.role === 'STUDENT') {
            username = 'N/A';
            passwordToSave = 'N/A';
        } else if (uppercaseData.role === 'REPRESENTATIVE') {
            model.register_user.findOne({ where: { role: 'REPRESENTATIVE', block: uppercaseData.block } })
                .then(existingRepresentative => {
                    if (existingRepresentative && existingRepresentative.userId !== studentId) {
                        throw new Error(`A representative is already assigned to block ${uppercaseData.block}.`);
                    }

                    username = uppercaseData.userId;

                    return updateUserAndRelatedRecords();
                })
                .catch(error => {
                    console.error('Error checking for existing representative:', error.message);
                    res.redirect(`/Display_Student_Info/${studentId}?error=REPRESENTATIVE_EXISTS`);
                });
            return; 
        } else {
            username = uppercaseData.userId;
        }

        updateUserAndRelatedRecords();
    }

    function updateUserAndRelatedRecords() {
        if (passwordToSave !== 'N/A') {
            bcrypt.hash(passwordToSave, 10, (err, hashedPassword) => {
                if (err) {
                    console.error('Error hashing password:', err);
                    return res.redirect(`/Display_Student_Info/${studentId}?error=HASH_ERROR`);
                }

                saveUserRecord(hashedPassword);
            });
        } else {
            saveUserRecord(passwordToSave); 
        }
    }

    function saveUserRecord(passwordToSave) {
        model.register_user.update(
            {
                userId: uppercaseData.userId,
                firstName: uppercaseData.firstName,
                lastName: uppercaseData.lastName,
                gender: uppercaseData.gender,
                yearLevel: uppercaseData.yearLevel,
                block: uppercaseData.block,
                role: uppercaseData.role,
                userName: username,
                password: passwordToSave
            },
            { where: { userId: studentId } }
        )
        .then(() => {
            console.log("Student record updated successfully.");

            return model.payable.update(
                {
                    userId: uppercaseData.userId,
                    student: `${uppercaseData.firstName} ${uppercaseData.lastName}`,
                    yearLevel: uppercaseData.yearLevel,
                    block: uppercaseData.block,
                    gender: uppercaseData.gender,
                    role: uppercaseData.role
                },
                { where: { userId: studentId } }
            );
        })
        .then(() => {
            console.log("Payable record updated successfully.");

            return model.remittance.update(
                {
                    userId: uppercaseData.userId,
                    student: `${uppercaseData.firstName} ${uppercaseData.lastName}`,
                    yearLevel: uppercaseData.yearLevel,
                    block: uppercaseData.block,
                    gender: uppercaseData.gender,
                    role: uppercaseData.role
                },
                { where: { userId: studentId } }
            );
        })
        .then(() => {
            console.log("Remittance record updated successfully.");
            res.redirect(`/Display_Student_Info/${studentId}`);
        })
        .catch((error) => {
            console.error('Error updating student information, payable, or remittance:', error.message);
            res.redirect(`/Display_Student_Info/${studentId}?error=1`);
        });
    }
};

const Treasurer_save_fund = (req, res) => {
    const {
        date,
        block,
        Amount1000 = 0,
        Amount500 = 0,
        Amount200 = 0,
        Amount100 = 0,
        Amount50 = 0,
        Amount20 = 0,
        coins = 0
    } = req.body;


    const totalAmount =
        (Number(Amount1000) * 1000) +
        (Number(Amount500) * 500) +
        (Number(Amount200) * 200) +
        (Number(Amount100) * 100) +
        (Number(Amount50) * 50) +
        (Number(Amount20) * 20) +
        Number(coins);


    if (!date || totalAmount <= 0) {
        return res.status(400).send("Please provide all required fields with valid data.");
    }


    model.remittance.findAll({
        attributes: ['yearLevel', 'block', 'payables', 'paid', 'status'],
        where: { 
            date: date,
            block: block,
            status: 'Remitted' 
        }
    })
    .then(remittances => {
        if (remittances.length === 0) {
            return res.status(404).send("No matching remittance records found for the specified date and block.");
        }

        // Group remittances by payable
        const groupedRemittances = {};

        remittances.forEach(remittance => {
            const payable = remittance.payables;

            // If the payable exists, add the paid amount
            if (groupedRemittances[payable]) {
                groupedRemittances[payable].paid += remittance.paid;
            } else {
                // Otherwise, create a new entry for this payable
                groupedRemittances[payable] = {
                    yearLevel: remittance.yearLevel,
                    block: remittance.block,
                    payable: payable,
                    paid: remittance.paid
                };
            }
        });

        // Iterate over the grouped remittances and save them into the fund table
        const fundPromises = Object.values(groupedRemittances).map(remittance => {
            return model.fund.findOne({
                where: {
                    date:date,
                    yearLevel: remittance.yearLevel,
                    block: remittance.block,
                    payable: remittance.payable
                }
            }).then(existingFund => {
                if (existingFund) {
                    // Ensure the amountReceive is a number (use 0 as fallback)
                    const updatedAmountReceive = (existingFund.amountReceive || 0) + remittance.paid;
                    return existingFund.update({
                        amountReceive: updatedAmountReceive,
                        denomination_1000: Amount1000,
                        denomination_500: Amount500,
                        denomination_200: Amount200,
                        denomination_100: Amount100,
                        denomination_50: Amount50,
                        denomination_20: Amount20,
                        coins: coins,
                        totalAmount
                    });
                } else {
                    // Otherwise, create a new fund record
                    return model.fund.create({
                        yearLevel: remittance.yearLevel,
                        block: remittance.block,
                        date: date,
                        payable: remittance.payable,
                        amountReceive: remittance.paid,
                        denomination_1000: Amount1000,
                        denomination_500: Amount500,
                        denomination_200: Amount200,
                        denomination_100: Amount100,
                        denomination_50: Amount50,
                        denomination_20: Amount20,
                        coins: coins,
                        totalAmount
                    });
                }
            });
        });

        // Execute all fund creation or update promises
        Promise.all(fundPromises)
            .then(() => {
                // Update the status of the remittance to 'Verified'
                return model.remittance.update(
                    { status: 'Verified' }, // Set the status to 'Verified'
                    { where: { date: date, block: block, status: 'Remitted' } } // Only update 'Received' status records
                );
            })
            .then(() => {
                // Destroy the remittance records after verifying
                return model.denomination.destroy({
                    where: { date: date, block: block }
                });
            })
            .then(() => {
                res.status(200).send("All remittance data saved, status updated to Verified, and remittance records destroyed successfully.");
            })
            .catch(error => {
                console.error("Error saving remittance, updating status, or deleting records:", error);
                res.status(500).send("An error occurred while saving the remittance data, updating the status, or deleting the records.");
            });
    })
    .catch(error => {
        console.error("Error fetching remittance records:", error);
        res.status(500).send("An error occurred while fetching the remittance records.");
    });
};

const Treasurer_archieve = (req, res) => {  
    const { studentId } = req.body;
  
    model.register_user.findOne({ where: { userId: studentId } })
      .then(student => {
        if (!student) {
          return res.status(404).send("Student not found");
        }

        model.sequelize.transaction((t) => {
          return model.archieve.create({
            userId: student.userId,
            firstName: student.firstName,
            lastName: student.lastName,
            yearLevel: student.yearLevel,
            block: student.block,
            gender: student.gender,
          }, { transaction: t })
          .then(() => {
            return model.register_user.destroy({
              where: { userId: studentId },
              transaction: t
            });
          });
        })
        .then(() => {
          res.redirect('/Treasurer_archieve');  
        })
        .catch(error => {
          console.error(error);
          res.status(500).send("Error processing archiving");
        });
      })
      .catch(error => {
        console.error(error);
        res.status(500).send("Error fetching student from register_users");
      });
};

const Treasurer_archieve_student = (req, res) => {
    model.archieve.findAll() 
      .then(archivedStudents => {
        res.render('Treasurer_archieve', { archivedStudents });
      })
      .catch(error => {
        console.error("Error fetching archived students:", error);
        res.status(500).send("Error fetching archived students");
      });
};

const Treasurer_display_archive = (req, res) => {
    const { userId } = req.body;

    model.archieve.findOne({ where: { userId } })
      .then(student => {
        if (!student) {
          return res.status(404).send("Student not found in archive");
        }

        model.register_user.create({
          userId: student.userId,
          role:'STUDENT',
          firstName: student.firstName,
          lastName: student.lastName,
          yearLevel: student.yearLevel,
          block: student.block,
          gender: student.gender,
        })
          .then(() => {
            model.archieve.destroy({ where: { userId } })
              .then(() => {
                res.redirect('/Treasurer_archieve');
              })
              .catch(error => {
                console.error("Error deleting student from archive:", error);
                res.status(500).send("Error deleting student from archive");
              });
          })
          .catch(error => {
            console.error("Error adding student back to register_users:", error);
            res.status(500).send("Error adding student back to register_users");
          });
      })
      .catch(error => {
        console.error("Error fetching student from archive:", error);
        res.status(500).send("Error fetching student from archive");
      });
};

const Treasurer_fund = (req, res) => {
    model.payable.findAll({
      attributes: ['payables'],
      group: ['payables'],
      raw: true,
    })
    .then(uniquePayables => {
      model.fund.findAll({
        attributes: ['yearLevel', 'block', 'payable', 'amountReceive'],
        raw: true, 
      })
      .then(fundRecords => {
        const groupedData = {};  
  
        fundRecords.forEach(record => {
          if (record.amountReceive && parseFloat(record.amountReceive) > 0) {
            const key = `${record.yearLevel} ${record.block}`; 
            if (!groupedData[key]) {
              groupedData[key] = {};
            }
  
            if (!groupedData[key][record.payable]) {
              groupedData[key][record.payable] = 0; 
            }
  
            groupedData[key][record.payable] += parseFloat(record.amountReceive); 
          }
        });
  
        model.expense.findAll({
          attributes: ['budgetSource', 'total'],
          raw: true,
        })
        .then(expenseRecords => {
          const expensesByBudgetSource = {};
  
          expenseRecords.forEach(expense => {
            uniquePayables.forEach(payable => {
              if (expense.budgetSource && expense.budgetSource === payable.payables) {
                if (!expensesByBudgetSource[expense.budgetSource]) {
                  expensesByBudgetSource[expense.budgetSource] = 0; 
                }
                expensesByBudgetSource[expense.budgetSource] += parseFloat(expense.total);  
              }
            });
          });
  
          // Calculate COH for each payable
          const cohData = {};
          Object.keys(groupedData).forEach(key => {
            cohData[key] = {};
            uniquePayables.forEach(payable => {
              const totalReceived = groupedData[key][payable] || 0;
              const totalExpenses = expensesByBudgetSource[payable] || 0;
              cohData[key][payable] = totalReceived - totalExpenses;
  
              // Ensure the calculated COH is a valid number
              if (isNaN(cohData[key][payable])) {
                cohData[key][payable] = 0;  // Default to 0 if calculation is invalid
              }
            });
          });
  
          // Save COH to the database
          Object.keys(cohData).forEach(key => {
            uniquePayables.forEach(payable => {
              const cohValue = cohData[key][payable];
              if (cohValue > 0) {
                model.fund.update(
                  { cashOnHand: cohValue }, 
                  { 
                    where: { 
                      yearLevel: key.split(' ')[0], 
                      block: key.split(' ')[1],
                      payable: payable 
                    } 
                  })
                .then(() => {
                  console.log(`COH for ${key} - ${payable} saved: ₱${cohValue}`);
                })
                .catch(err => {
                  console.error(`Error saving COH for ${key} - ${payable}:`, err);
                });
              }
            });
          });
  
          res.render("funds", {
            groupedData,             
            allPayables: uniquePayables.map(item => item.payables), 
            expensesByBudgetSource,    
            totalExpenses: expensesByBudgetSource,  
            cohData, // Send COH data to the view
          });
        })
        .catch(err => {
          console.error("Error fetching expense records:", err);  
          res.status(500).send("Error fetching expense records");
        });
      })
      .catch(err => {
        console.error("Error fetching fund records:", err);  
        res.status(500).send("Error fetching fund records");
      });
    })
    .catch(err => {
      console.error("Error fetching unique payables:", err);  
      res.status(500).send("Error fetching unique payables");
    });
  };
  

const Treasurer_3A_verified_remittance = (req, res) => {
    const selectedDate = req.query.date || '';

    // Fetch specific data based on filters
    Promise.all([
        model.register_user.findAll(),
        model.remittance.findAll(),
        model.denomination.findAll({
            where: {
                yearLevel: 3,
                block: 'A'
            }
        })
    ])
    .then(([users, remittances, denominations]) => {
        // Filter students in block A and year 3
        const filteredStudents = users.filter(user =>
            user.role === 'STUDENT' &&
            user.yearLevel === '3' &&
            user.block === 'A'
        );

        const representatives = users.filter(user => user.role === 'REPRESENTATIVE');
        const treasurer = users.find(user => user.role === 'TREASURER');

        // Filter remittances for block A and year 3 students only, excluding non-treasurer remittances
        const filteredRemittances = remittances.filter(remittance => {
            const student = users.find(user => `${user.firstName} ${user.lastName}` === remittance.student);
            return student &&
                student.block === 'A' &&
                student.yearLevel === '3' &&
                remittance.status !== 'Verified' &&
                remittance.remittedBy === `${treasurer?.firstName} ${treasurer?.lastName}`; // Only show remittances by the treasurer
        });

        // Map filtered remittances
        const studentRemittances = filteredRemittances.map(remittance => {
            const student = users.find(user => `${user.firstName} ${user.lastName}` === remittance.student);
            if (student) {
                const representative = representatives.find(rep => rep.block === student.block && rep.yearLevel === student.yearLevel);
                const remittedByUser = users.find(user => `${user.firstName} ${user.lastName}` === remittance.remittedBy);

                return {
                    studentName: remittance.student,
                    payment: remittance.payables,  // Can be renamed to 'payables' if you updated the field name
                    amountPaid: remittance.paid,
                    date: remittance.date,
                    block: student.block,
                    representativeName: representative ? `${representative.firstName} ${representative.lastName}` : 'N/A',
                    treasurerName: treasurer ? `${treasurer.firstName} ${treasurer.lastName}` : 'N/A',
                    remittedBy: remittedByUser ? `${remittedByUser.firstName} ${remittedByUser.lastName}` : remittance.remittedBy || 'N/A',
                    status: remittance.status
                };
            }
        }).filter(remittance => remittance); // Filter out undefined remittances

        console.log("Filtered Student Remittances:", studentRemittances);

        const representativeNames = representatives
            .filter(rep => rep.block === 'A' && rep.yearLevel === '3')
            .map(representative => `${representative.firstName} ${representative.lastName}`);

        // Pass the filtered data to the view
        res.render("Treasurer_remittance", {
            blockKey: 'BSIT - 3A',
            yearLevel: '3',
            block: 'A',
            studentRemittances,
            representativeNames,
            filteredStudents,
            selectedDate,
            denominations
        });
    })
    .catch(error => {
        console.error(error);
        res.status(500).render("error", { message: "Unable to retrieve data" });
    });
};  

const Treasurer_3B_verified_remittance = (req, res) => {
    const selectedDate = req.query.date || '';

    // Fetch specific data based on filters
    Promise.all([
        model.register_user.findAll(),
        model.remittance.findAll(),
        model.denomination.findAll({
            where: {
                yearLevel: 3,
                block: 'B'
            }
        })
    ])
    .then(([users, remittances, denominations]) => {
        // Filter students in block A and year 3
        const filteredStudents = users.filter(user =>
            user.role === 'STUDENT' &&
            user.yearLevel === '3' &&
            user.block === 'B'
        );

        const representatives = users.filter(user => user.role === 'REPRESENTATIVE');
        const treasurer = users.find(user => user.role === 'TREASURER');

        // Filter remittances for block A and year 3 students only, excluding non-treasurer remittances
        const filteredRemittances = remittances.filter(remittance => {
            const student = users.find(user => `${user.firstName} ${user.lastName}` === remittance.student);
            return student &&
                student.block === 'B' &&
                student.yearLevel === '3' &&
                remittance.status !== 'Verified' &&
                remittance.remittedBy === `${treasurer?.firstName} ${treasurer?.lastName}`; // Only show remittances by the treasurer
        });

        // Map filtered remittances
        const studentRemittances = filteredRemittances.map(remittance => {
            const student = users.find(user => `${user.firstName} ${user.lastName}` === remittance.student);
            if (student) {
                const representative = representatives.find(rep => rep.block === student.block && rep.yearLevel === student.yearLevel);
                const remittedByUser = users.find(user => `${user.firstName} ${user.lastName}` === remittance.remittedBy);

                return {
                    studentName: remittance.student,
                    payment: remittance.payables,  // Can be renamed to 'payables' if you updated the field name
                    amountPaid: remittance.paid,
                    date: remittance.date,
                    block: student.block,
                    representativeName: representative ? `${representative.firstName} ${representative.lastName}` : 'N/A',
                    treasurerName: treasurer ? `${treasurer.firstName} ${treasurer.lastName}` : 'N/A',
                    remittedBy: remittedByUser ? `${remittedByUser.firstName} ${remittedByUser.lastName}` : remittance.remittedBy || 'N/A',
                    status: remittance.status
                };
            }
        }).filter(remittance => remittance); // Filter out undefined remittances

        console.log("Filtered Student Remittances:", studentRemittances);

        const representativeNames = representatives
            .filter(rep => rep.block === 'B' && rep.yearLevel === '3')
            .map(representative => `${representative.firstName} ${representative.lastName}`);

        // Pass the filtered data to the view
        res.render("Treasurer_remittance", {
            blockKey: 'BSIT - 3B',
            yearLevel: '3',
            block: 'B',
            studentRemittances,
            representativeNames,
            filteredStudents,
            selectedDate,
            denominations
        });
    })
    .catch(error => {
        console.error(error);
        res.status(500).render("error", { message: "Unable to retrieve data" });
    });
};

const treasurer_3A_show_treasurer_save_fund = (req, res) => {
    const {
        Amount1000 = 0,
        Amount500 = 0,
        Amount200 = 0,
        Amount100 = 0,
        Amount50 = 0,
        Amount20 = 0,
        coins = 0,
        block,
        yearLevel,
        date,
    } = req.body;

    console.log("Amounts received:", {
        Amount1000,
        Amount500,
        Amount200,
        Amount100,
        Amount50,
        Amount20,
        coins,
    });

    const totalRemitted =
        (Number(Amount1000) * 1000) +
        (Number(Amount500) * 500) +
        (Number(Amount200) * 200) +
        (Number(Amount100) * 100) +
        (Number(Amount50) * 50) +
        (Number(Amount20) * 20) +
        Number(coins);

    console.log("Total remitted calculated:", totalRemitted);

    model.remittance
        .findAll({
            where: {
                block: block,
                yearLevel: yearLevel,
                status: 'Pendings',
            },
        })
        .then((remittances) => {
            if (remittances.length === 0) {
                return res.status(404).send("No pending remittance records found.");
            }

            const payableGroups = remittances.reduce((groups, remittance) => {
                const payable = remittance.payables;
                if (!groups[payable]) {
                    groups[payable] = [];
                }
                groups[payable].push(remittance);
                return groups;
            }, {});

            const fundPromises = Object.keys(payableGroups).map((payable) => {
                const groupTotalPaid = payableGroups[payable].reduce(
                    (sum, remittance) => sum + Number(remittance.paid),
                    0
                );

                const currentDate = date || new Date(); // Use provided date or generate new one

                // Check if a record with the same date, yearLevel, block, and payable exists
                return model.fund.findOne({
                    where: {
                        block: block,
                        yearLevel: yearLevel,
                        date: currentDate,
                        payable: payable,
                    },
                }).then((existingFundRecord) => {
                    if (existingFundRecord) {
                        // Update the existing record
                        const updatedAmountReceive =
                            Number(existingFundRecord.amountReceive) + groupTotalPaid;
                        return existingFundRecord.update({
                            amountReceive: updatedAmountReceive,
                        });
                    } else {
                        // Create a new fund record
                        return model.fund.create({
                            block: block,
                            totalAmountRemitted: totalRemitted,
                            amountReceive: groupTotalPaid,
                            payable: payable,
                            yearLevel: yearLevel,
                            date: currentDate,
                        });
                    }
                });
            });

            return Promise.all(fundPromises);
        })
        .then(() => {
            return model.remittance.update(
                { status: 'Verified', date: new Date() }, // Update the remittance status and date
                {
                    where: {
                        block: block,
                        yearLevel: yearLevel,
                        status: 'Pendings',
                    },
                }
            );
        })
        .then(() => {
            res.redirect(`/Treasurer_3${block}_verified_remittance`);
        })
        .catch((err) => {
            console.error("Error processing remittance data:", err);
            res.status(500).send("An error occurred while processing remittance data.");
        });
};

const Treasurer_display_expenses = (req, res) => {
    model.fund.findAll({
        attributes: ['id', 'payable', 'amountReceive'], 
    })
    .then(funds => {
        console.log(funds);
        res.render('Treasurer_create_expenses', { payables: funds });
    })
    .catch(error => {
        console.error('Error fetching funds:', error);
        res.status(500).send('Internal Server Error');
    });
};
const treasurer_create_expenses = (req, res) => {
    const { budgetSource, date, description, quantity, label, price, grandTotal } = req.body;

    console.log('Budget Source:', budgetSource);

    const currentDate = date || (() => {
        const now = new Date();
        now.setHours(now.getHours() + 8);
        return now.toISOString().split('T')[0];
    })();

    const descriptions = Array.isArray(description) ? description : [description];
    const quantities = Array.isArray(quantity) ? quantity : [quantity];
    const labels = Array.isArray(label) ? label : [label];
    const prices = Array.isArray(price) ? price : [price];

    const expenses = descriptions
        .map((desc, index) => {
            const qty = parseInt(quantities[index], 10) || 0;
            const unitPrice = parseFloat(prices[index]) || 0;

            return {
                budgetSource: budgetSource,
                date: currentDate,
                description: desc.trim(),
                qty,
                label: (labels[index] || '').trim(),
                price: unitPrice,
                total: grandTotal
            };
        })
        .filter(expense => expense.description && expense.qty > 0 && expense.price > 0);

    // Validate fund availability before saving expenses
    model.fund.findOne({ where: { payable: budgetSource } })
        .then((fund) => {
            if (!fund) {
                console.log('Fund not found.');
                res.render('TREASURER/Treasurer_create_expenses', {
                    message: 'Budget source not found.',
                    messageType: 'error',
                    payables: []
                });
                return;
            }

            // Check if grandTotal exceeds fund.amountReceive
            if (grandTotal > fund.amountReceive) {
                const message = 'The expense exceeds the available fund amount.';
                const messageType = 'error';

                // Fetch payables and pass to the view
                model.fund.findAll()
                    .then((payables) => {
                        res.render('TREASURER/Treasurer_create_expenses', {
                            message,
                            messageType,
                            payables
                        });
                    })
                    .catch(error => {
                        console.error('Error fetching payables:', error);
                        res.render('TREASURER/Treasurer_create_expenses', {
                            message: 'An error occurred while fetching payables.',
                            messageType: 'error',
                            payables: []
                        });
                    });
                return;
            }

            // Proceed to save expenses if validation passed
            if (expenses.length > 0) {
                model.expense.bulkCreate(expenses)
                    .then(() => {
                        console.log('Expenses successfully saved:', expenses);

                        // Provide success message
                        res.render('TREASURER/Treasurer_create_expenses', {
                            message: 'Expenses have been successfully recorded!',
                            messageType: 'success',
                            payables: [] // You can fetch and pass updated payables here if needed
                        });
                    })
                    .catch((error) => {
                        console.error('Error saving expenses:', error);
                        res.render('TREASURER/Treasurer_create_expenses', {
                            message: 'An error occurred while saving expenses.',
                            messageType: 'error',
                            payables: []
                        });
                    });
            } else {
                console.log('No valid expenses to save.');
                res.render('TREASURER/Treasurer_create_expenses', {
                    message: 'No valid expenses to save.',
                    messageType: 'error',
                    payables: []
                });
            }
        })
        .catch((error) => {
            console.error('Error fetching fund:', error);
            res.render('TREASURER/Treasurer_create_expenses', {
                message: 'An error occurred while fetching the fund.',
                messageType: 'error',
                payables: []
            });
        });
};





const Treasurer_receivable = (req, res) => {
    const startDate = req.query.startDate || '2024-12-01';
    const endDate = req.query.endDate || '2024-12-31';

    // Fetch payables data from the database
    model.payable.findAll({
        where: {
            createdAt: {
                [Sequelize.Op.between]: [startDate, endDate]
            }
        }
    })
    .then(allPayables => {
        // Grouping the data by yearLevel, block, and calculating totals for each payable
        const groupedData = {};
        const totals = {};
        let totalReceivable = 0;

        allPayables.forEach((payableRecord) => {
            const key = `${payableRecord.yearLevel} ${payableRecord.block}`;

            // Initialize groupedData for each key if it doesn't exist
            if (!groupedData[key]) {
                groupedData[key] = {};
            }

            // Aggregate the balances by payable name
            if (!groupedData[key][payableRecord.payables]) {
                groupedData[key][payableRecord.payables] = 0;
            }

            groupedData[key][payableRecord.payables] += payableRecord.balances;

            // Calculate the total for each payable across all blocks and year levels
            if (!totals[payableRecord.payables]) {
                totals[payableRecord.payables] = 0;
            }

            totals[payableRecord.payables] += payableRecord.balances;
        });

        // Calculate the total receivable (sum of all totals for each payable)
        totalReceivable = Object.values(totals).reduce((acc, curr) => acc + curr, 0);

        // Get a list of unique payables
        const uniquePayables = Object.keys(totals);

        // Pass data to the view, including totalReceivable
        res.render('Treasurer_receivable', {
            allPayables: uniquePayables,
            groupedData: groupedData,
            totals: totals,
            totalReceivable: totalReceivable // Ensure this is passed correctly
        });
    })
    .catch(error => {
        console.error(error);
        res.status(500).send('An error occurred while fetching data');
    });
};

const Treasurer_expenses = (req, res) => {
    const startDate = req.query.startDate || '2024-12-01';
    const endDate = req.query.endDate || '2024-12-31';
    const budgetSource = req.query.budgetSource || null; // Optional filter for budgetSource

    // Fetch expenses based on budgetSource
    model.expense.findAll({
        where: {
            date: {
                [Sequelize.Op.between]: [startDate, endDate]
            },
            ...(budgetSource ? { budgetSource: budgetSource } : {}) // Apply filter if budgetSource is provided
        },
        attributes: ['label', 'description', 'qty', 'price', 'total', 'budgetSource']
    })
    .then(expenses => {
        const groupedData = {};
        const totals = {};

        // Group data by description (e.g., payable type)
        expenses.forEach(expense => {
            const key = expense.description; // Group by description or other logical field

            // Initialize groupedData if not present
            if (!groupedData[key]) {
                groupedData[key] = {};
            }

            // Aggregate totals by label (e.g., payable name)
            if (!groupedData[key][expense.label]) {
                groupedData[key][expense.label] = 0;
            }

            groupedData[key][expense.label] += expense.total;

            // Calculate the total for each label
            if (!totals[expense.label]) {
                totals[expense.label] = 0;
            }

            totals[expense.label] += expense.total;
        });

        // Get unique labels from the expense records
        const uniqueLabels = Object.keys(totals);

        // Calculate total expenses
        const totalExpense = expenses.reduce((sum, expense) => sum + parseFloat(expense.total || 0), 0);

        // Render the view with the grouped data and totals
        res.render('Treasurer_expenses', {
            allPayables: uniqueLabels, // Unique labels to be used as table headers
            groupedData: groupedData,
            totals: totals,
            totalExpense: totalExpense,
            budgetSource: budgetSource || 'All Sources' // Show filter applied
        });
    })
    .catch(error => {
        console.error(error);
        res.status(500).send('An error occurred while fetching expense data');
    });
};

const Treasurer_view_expense = (req, res) => {
    const selectedDate = req.body.date || new Date().toISOString().split('T')[0]; 
    console.log('Selected Date:', selectedDate); 

    model.expense.findAll({
        attributes: ['id', 'description', 'qty', 'label', 'price', 'total', 'date'], 
    })
    .then(expenses => {
        console.log('Expenses:', expenses); 


        if (expenses.length === 0) {
            expenses = [];
        }

        res.render('Treasurer_view_expense', { expenses: expenses, selectedDate: selectedDate });
    })
    .catch(error => {
        console.error('Error fetching expenses:', error);
        res.status(500).send('Internal Server Error');
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
    logout,
    treasurer_3A_verify_remittance,
    treasurer_3B_verify_remittance,
    Treasurer_save_fund,
    updateStudent,
    Treasurer_fund,
    Treasurer_archieve,
    Treasurer_archieve_student,
    Treasurer_display_archive,
    Treasurer_3A_verified_remittance,
    Treasurer_3B_verified_remittance,
   treasurer_3A_show_treasurer_save_fund,
   Treasurer_display_expenses,
   treasurer_create_expenses,
   Treasurer_view_expense,
   Treasurer_receivable,
   Treasurer_expenses





    
   


  
};