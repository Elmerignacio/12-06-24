const model = require('../../models');
const bcrypt = require('bcrypt'); 
const { Op } = require('sequelize');
const jwt = require('jsonwebtoken')
require ("dotenv").config()


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
    // Extract the JWT token from the cookies
    const token = req.cookies.funds;

    if (!token) {
        return res.redirect('login'); // Redirect to login if no token
    }

    try {
        // Verify the JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Extract user details from the decoded token
        const treasurerName = decoded.firstname + ' ' + decoded.lastname;

        // Fetch the total funds from the fund model
        model.fund.sum('amountReceive')
            .then(totalFunds => {
                // Render the dashboard with the treasurer's name and total funds
                res.render('Treasurer_dashboard', {
                    treasurerName: treasurerName,
                    totalFunds: totalFunds || 0, // If no funds, default to 0
                });
            })
            .catch(err => {
                console.error(err);
                res.render('Treasurer_dashboard', {
                    treasurerName: treasurerName,
                    totalFunds: 0,
                });
            });
    } catch (err) {
        console.error('JWT verification error:', err);
        return res.redirect('login'); // Redirect to login if token verification fails
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
        const filteredUsers = users.filter(user =>
            ['STUDENT', 'REPRESENTATIVE', 'TREASURER'].includes(user.role) &&
            user.yearLevel === '3' &&
            user.block === 'A'
        );
        const representativeNames = filteredUsers
            .filter(user => user.role === 'REPRESENTATIVE')
            .map(representative => `${representative.firstName} ${representative.lastName}`);

        const userPayablesWithBalances = filteredUsers.map(user => {
            const userPayables = payables.filter(payable => payable.student === `${user.firstName} ${user.lastName}`.toUpperCase());

            return {
                ...user.toJSON(),
                payables: userPayables.map(payable => ({
                    description: payable.payables,
                    balance: payable.balances
                }))
            };
        });

        res.render("Treasurer_BSIT_3A_remittance", {
            blockKey: 'BSIT - 3A',
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
        const filteredUsers = users.filter(user =>
            ['STUDENT', 'REPRESENTATIVE', 'TREASURER'].includes(user.role) &&
            user.yearLevel === '3' &&
            user.block === 'B'
        );
        const representativeNames = filteredUsers
            .filter(user => user.role === 'REPRESENTATIVE')
            .map(representative => `${representative.firstName} ${representative.lastName}`);

        const userPayablesWithBalances = filteredUsers.map(user => {
            const userPayables = payables.filter(payable => payable.student === `${user.firstName} ${user.lastName}`.toUpperCase());

            return {
                ...user.toJSON(),
                payables: userPayables.map(payable => ({
                    description: payable.payables,
                    balance: payable.balances
                }))
            };
        });

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

    let searchCondition = {
        yearLevel: yearLevel,
        block: block,
        role: { [Op.in]: ['STUDENT', 'REPRESENTATIVE', 'TREASURER'] },
    };

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
                yearLevel: yearLevel,
                block: block,
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
                        .then(remittances => {
                            // Process payables with corresponding remittance details
                            const payablesWithBalance = payables.map(payable => {
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
    let hasValidPayables = false;  
    let updatePromises = [];  

    for (const [key, value] of Object.entries(req.body)) {
        if (key.startsWith('Description_')) {
            const payableId = key.split('_')[1];
            const description = req.body[`Description_${payableId}`];
            const paidAmount = parseFloat(req.body[`inputtedAmount_${payableId}`]);  
            const balances = parseFloat(req.body[`balance_${payableId}`]); 

            if (!isNaN(paidAmount) && paidAmount > 0 && !isNaN(balances)) {
                // Check if the new balance after the payment is negative
                const newBalance = balances - paidAmount;
                if (newBalance < 0) {
                    console.log(`Cannot process payment. The balance after payment would be negative: ${newBalance}`);
                    continue; // Skip this payable if the balance is negative
                }

                hasValidPayables = true; 

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

                                    updatePromises.push(
                                        model.remittance.update(
                                            { 
                                                paid: updatedPaidAmount,
                                                balances: updatedBalance
                                            },
                                            {
                                                where: { id: existingRemittance.id }
                                            }
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
                                        })
                                    );
                                } else {
                                    remittances.push({
                                        userId: studentId,
                                        student: studentName,
                                        block: studentBlock,
                                        yearLevel: studentYearLevel,
                                        gender: gender,
                                        payables: description,
                                        paid: paidAmount,
                                        balances: newBalance, // Use the new balance
                                        date: getCurrentLocalDate(),
                                        status: 'pending'
                                    });

                                    updatePromises.push(
                                        model.payable.update(
                                            { balances: newBalance }, // Update to the new balance
                                            {
                                                where: {
                                                    student: studentName,
                                                    payables: description
                                                }
                                            }
                                        )
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

    Promise.all(updatePromises)
        .then(() => {
            if (remittances.length > 0) {
                return model.remittance.bulkCreate(remittances);
            }
        })
        .then(() => {
            res.redirect(`/Display_Student_Info/${studentId}`);
        })
        .catch(error => {
            console.error("Error in remittance processing:", error);
            res.status(500).send("Failed to save remittances.");
        });
};



function getCurrentLocalDate() {
    const date = new Date();
    return date.toISOString().split('T')[0];
}
const treasurer_3A_verify_remittance = (req, res) => {
    const selectedDate = req.query.date || ''; 

    // Fetch users, remittances, and denominations
    Promise.all([ 
        model.register_user.findAll(), 
        model.remittance.findAll(),
        model.denomination.findAll()  // Fetch denomination data
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

        // Filter remittances for block A and year 3 students only
        const filteredRemittances = remittances.filter(remittance => {
            const student = users.find(user => `${user.firstName} ${user.lastName}` === remittance.student);
            return student && student.block === 'A' && student.yearLevel === '3';
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
                    amountPaid: remittance.paid,   // Specific to the correct block and year level
                    date: remittance.date,
                    block: student.block,
                    representativeName: representative ? `${representative.firstName} ${representative.lastName}` : 'N/A',
                    treasurerName: treasurer ? `${treasurer.firstName} ${treasurer.lastName}` : 'N/A',
                    remittedBy: remittedByUser ? `${remittedByUser.firstName} ${remittedByUser.lastName}` : remittance.remittedBy || 'N/A',
                    status: remittance.status      // Specific to the correct student and their payables
                };
            }
        }).filter(remittance => remittance);  // Filter out any undefined remittance

        console.log("Filtered Student Remittances:", studentRemittances);  // Log remittances to check

        const representativeNames = representatives
            .filter(rep => rep.block === 'A' && rep.yearLevel === '3')
            .map(representative => `${representative.firstName} ${representative.lastName}`);

        // Pass the data to the view, including filtered students and denominations
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

    // Fetch users, remittances, and denominations
    Promise.all([ 
        model.register_user.findAll(), 
        model.remittance.findAll(),
        model.denomination.findAll()  // Fetch denomination data
    ])
    .then(([users, remittances, denominations]) => {  
        // Filter students, representatives, and treasurer
        const filteredStudents = users.filter(user =>
            user.role === 'STUDENT' &&
            user.yearLevel === '3' &&
            user.block === 'B' 
        );

        const representatives = users.filter(user => user.role === 'REPRESENTATIVE');
        const treasurer = users.find(user => user.role === 'TREASURER'); 

        // Map remittances for students in block A
        const studentRemittances = remittances.map(remittance => {
            const student = users.find(user => `${user.firstName} ${user.lastName}` === remittance.student);

            // Apply your condition to check if the student is from block A
            if (student && student.block === 'B') {
                const representative = representatives.find(rep => rep.block === student.block && rep.yearLevel === student.yearLevel);

                // Use the `remittedBy` field from the remittance database
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
        }).filter(remittance => remittance);  // Filter out any undefined remittance

        console.log("Filtered Student Remittances:", studentRemittances);  // Log remittances to check

        const representativeNames = representatives
            .filter(rep => rep.block === 'B')
            .map(representative => `${representative.firstName} ${representative.lastName}`);

        // Pass the denomination data to the view
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
        Amount1000 = 0,
        Amount500 = 0,
        Amount200 = 0,
        Amount100 = 0,
        Amount50 = 0,
        Amount20 = 0,
        coins = 0
    } = req.body;

    // Calculate the total collected amount
    const totalAmount =
        (Number(Amount1000) * 1000) +
        (Number(Amount500) * 500) +
        (Number(Amount200) * 200) +
        (Number(Amount100) * 100) +
        (Number(Amount50) * 50) +
        (Number(Amount20) * 20) +
        Number(coins);

    // Validate inputs
    if (!date || totalAmount <= 0) {
        return res.status(400).send("Please provide all required fields with valid data.");
    }

    // Query the `remittance` database to fetch `yearLevel`, `block`, `payables`, and `paid` for the specific date
    model.remittance.findAll({
        attributes: ['yearLevel', 'block', 'payables', 'paid'],
        where: { date: date } // Adjust the condition to match the data from the correct date
    })
    .then(remittances => {
        if (remittances.length === 0) {
            return res.status(404).send("No matching remittance records found for the specified date.");
        }

        // Group remittances by `payable`
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

        // Iterate over the grouped remittances and save them into the `fund` table
        const fundPromises = Object.values(groupedRemittances).map(remittance => {
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
        });

        // Execute all fund creation promises
        Promise.all(fundPromises)
            .then(() => {
                // Update the status of the remittance to 'receivedByTreasurer'
                return model.remittance.update(
                    { status: 'receivedByTreasurer' }, // Set the status to 'receivedByTreasurer'
                    { where: { date: date } } // Update records matching the specific date
                );
            })
            .then(() => {
                res.status(200).send("All remittance data saved and status updated successfully.");
            })
            .catch(error => {
                console.error("Error saving remittance or updating status:", error);
                res.status(500).send("An error occurred while saving the remittance data or updating the status.");
            });
    })
    .catch(error => {
        console.error("Error fetching remittance records:", error);
        res.status(500).send("An error occurred while fetching the remittance records.");
    });
};




const Treasurer_archieve = (req, res) => {  
    const { studentId } = req.body; // Get studentId from the request
  
    // Fetch the student from the register_users table
    model.register_user.findOne({ where: { userId: studentId } })
      .then(student => {
        if (!student) {
          return res.status(404).send("Student not found");
        }
  
        // Insert the student into the archieves table
        model.archieve.create({
          userId: student.userId,
          firstName: student.firstName,
          lastName: student.lastName,
          yearLevel: student.yearLevel,
          block: student.block,
          gender: student.gender,
        })
        .then(() => {
          // After successfully inserting into archieves, delete from register_users
          model.register_user.destroy({ where: { userId: studentId } })
            .then(() => {
              // Redirect to admin page or send success response
              res.redirect("Treasurer_archieve");
            })
            .catch(error => {
              console.error(error);
              res.status(500).send("Error deleting student from register_users");
            });
        })
        .catch(error => {
          console.error(error);
          res.status(500).send("Error inserting student into archieves");
        });
      })
      .catch(error => {
        console.error(error);
        res.status(500).send("Error fetching student from register_users");
      });
  };

  
  const Treasurer_archieve_student = (req, res) => {
    model.archieve.findAll() // Fetch all students in the archive table
      .then(archivedStudents => {
        res.render('Treasurer_archieve', { archivedStudents });
      })
      .catch(error => {
        console.error("Error fetching archived students:", error);
        res.status(500).send("Error fetching archived students");
      });
  };
  


  const Treasurer_fund = (req, res) => {
    model.payable.findAll({
        attributes: ['yearLevel', 'block', 'payables', 'balances'],
        raw: true,
    })
    .then(records => {
        console.log("Raw Records:", records); // Debugging log

        // Group data by yearLevel and block, and sum balances per payable
        const groupedData = {};
        
        // Grouping logic
        records.forEach(record => {
            // Check if the balances are present and greater than 0
            if (record.balances && parseFloat(record.balances) > 0) {
                const key = `${record.yearLevel} ${record.block}`; // key for each yearLevel and block combination

                // Initialize grouping structure for new combinations
                if (!groupedData[key]) {
                    groupedData[key] = {};
                }

                // Initialize payable category if not already set
                if (!groupedData[key][record.payables]) {
                    groupedData[key][record.payables] = 0;
                }

                // Add the balances to the corresponding payable
                groupedData[key][record.payables] += parseFloat(record.balances);
            }
        });

        console.log("Grouped Data:", groupedData); // Debugging log

        // Send the grouped data to the view (EJS)
        res.render("funds", { groupedData });
    })
    .catch(err => {
        console.error(err);
        res.status(500).send("Error fetching fund data");
    });
};



const Treasurer_display_archive = (req, res) => {
    const { userId } = req.body;
  
    // Find student in the archive table
    model.archieve.findOne({ where: { userId } })
      .then(student => {
        if (!student) {
          return res.status(404).send("Student not found in archive");
        }
  
        // Add student back to register_users
        model.register_user.create({
          userId: student.userId,
          firstName: student.firstName,
          lastName: student.lastName,
          yearLevel: student.yearLevel,
          block: student.block,
          role: 'STUDENT',
          gender: student.gender,
        })
          .then(() => {
            // Delete student from archive table
            model.archieve.destroy({ where: { userId } })
              .then(() => {
                // Redirect back to the archive page
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


    //representative

    
   


  
};