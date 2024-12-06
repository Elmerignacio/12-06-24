
const model = require('../../models');
const bcrypt = require('bcrypt'); 
const { Op } = require('sequelize');
const jwt = require('jsonwebtoken')
require ("dotenv").config()


const Representative_dashboard = (req, res) => {
    // Extract the JWT token from the cookies
    const token = req.cookies.funds;

    if (!token) {
        return res.redirect('login'); // Redirect to login if no token
    }

    try {
        // Verify the JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Extract user details from the decoded token
        const representativeName = decoded.firstname + ' ' + decoded.lastname;
        const userId = decoded.userid; // Assuming the user ID is stored in the token

        // Fetch the representative data from the database based on the user ID
        model.register_user.findOne({
            where: {
                id: userId, // Use the user ID from the token
                role: 'REPRESENTATIVE'
            }
        })
        .then(representative => {
            if (representative) {
                const block = representative.block; // Assuming 'block' is a field
                const yearLevel = representative.yearLevel; // Assuming 'yearLevel' is a field

                // Fetch the total funds from the fund model
                model.fund.sum('amountReceive')
                    .then(totalFunds => {
                        // Render the dashboard with the representative's name, block, yearLevel, and total funds
                        res.render('REPRESENTATIVE/Representative_dashboard', {
                            representativeName: representativeName,
                            block, // Pass the block
                            yearLevel, // Pass the yearLevel
                            totalFunds: totalFunds || 0, // If no funds, default to 0
                        });
                    })
                    .catch(err => {
                        console.error(err);
                        res.render('REPRESENTATIVE/Representative_dashboard', {
                            representativeName: representativeName,
                            block,
                            yearLevel,
                            totalFunds: 0, // Default to 0 if no funds found
                        });
                    });
            } else {
                // If no representative is found, render with default values
                res.render('REPRESENTATIVE/Representative_dashboard', {
                    representativeName: 'No representative found',
                    block: null,
                    yearLevel: null,
                    totalFunds: 0
                });
            }
        })
        .catch(err => {
            console.error(err);
            res.render('REPRESENTATIVE/Representative_dashboard', {
                representativeName: 'Error retrieving representative',
                block: null,
                yearLevel: null,
                totalFunds: 0
            });
        });
    } catch (err) {
        console.error('JWT verification error:', err);
        return res.redirect('login'); // Redirect to login if token verification fails
    }
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

        // Extract yearLevel and block for use in EJS template
        const yearLevel = '3';  // This value is hardcoded in your filter
        const block = 'A';  // This value is also hardcoded

        // Render the EJS template and pass the required values
        res.render("REPRESENTATIVE/Representative_BSIT_3A_remittance", {
            blockKey: 'BSIT - 3A',
            representativeNames,
            filteredUsers: userPayablesWithBalances,
            payables,
            remittances,
            block,  // Pass block to EJS template
            yearLevel  // Pass yearLevel to EJS template
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

        // Extract yearLevel and block for use in EJS template
        const yearLevel = '3';  // This value is hardcoded in your filter
        const block = 'B';  // This value is also hardcoded

        // Render the EJS template and pass the required values
        res.render("REPRESENTATIVE/Representative_BSIT_3A_remittance", {
            blockKey: 'BSIT - 3B',
            representativeNames,
            filteredUsers: userPayablesWithBalances,
            payables,
            remittances,
            block,  // Pass block to EJS template
            yearLevel  // Pass yearLevel to EJS template
        });
    })
    .catch(error => {
        console.error(error);
        res.status(500).render("error", { message: "Unable to retrieve data" });
    });
};


const Representative_display_Student_Info = (req, res) => {
    const userId = req.params.userId;

    model.register_user.findOne({ where: { userId: userId } })
        .then(student => {
            if (!student) {
                return res.status(404).render("error", { message: "Student not found." });
            }

            const studentFullName = `${student.firstName} ${student.lastName}`;
            const block = student.block; // Assuming 'block' is a field in the student data
            const yearLevel = student.yearLevel; // Assuming 'yearLevel' is a field in the student data

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
                            res.render("Representative_studentInfo", {
                                student,
                                payables: payablesWithBalance,
                                remittances,
                                currentDate,
                                block, // Pass block to the EJS template
                                yearLevel // Pass yearLevel to the EJS template
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

    // Fetch the representative for the specific block and year level
    model.register_user.findOne({
        where: {
            role: 'REPRESENTATIVE',
            block: studentBlock,
            yearLevel: studentYearLevel
        }
    }).then(representative => {
        if (!representative) {
            throw new Error(`Representative not found for Block: ${studentBlock}, Year Level: ${studentYearLevel}`);
        }

        const { firstName, lastName } = representative;

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
                                            balances: newBalance,
                                            date: getCurrentLocalDate(),
                                            status: 'pending',
                                            remittedBy: `${firstName} ${lastName}` // Assign specific representative's name
                                        });

                                        updatePromises.push(
                                            model.payable.update(
                                                { balances: newBalance },
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

        return Promise.all(updatePromises)
            .then(() => {
                if (remittances.length > 0) {
                    return model.remittance.bulkCreate(remittances);
                }
            })
            .then(() => {
                res.redirect(`/Representative_display_Student_Info/${studentId}`);
            });
    }).catch(error => {
        console.error("Error in remittance processing:", error);
        res.status(500).send("Failed to save remittances.");
    });
};


const Representative_3A_verify_remittance = (req, res) => {
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

            if (student && student.block === 'A' && 
                remittance.status.trim().toLowerCase() !== 'remitted' && 
                remittance.status.trim().toLowerCase() !== 'verified') {  // Exclude 'received' and 'verified' status
                const representative = representatives.find(rep => rep.block === student.block && rep.yearLevel === student.yearLevel);

                // Only include if a representative processed the remittance
                if (representative && remittance.remittedBy === representative.firstName + ' ' + representative.lastName) {
                    const remittanceData = {
                        studentName: remittance.student,
                        payment: remittance.payables,
                        amountPaid: remittance.paid,
                        balances: remittance.balances,
                        block: student.block,
                        remittedBy: remittance.remittedBy || 'N/A', 
                        representativeName: representative ? `${representative.firstName} ${representative.lastName}` : 'N/A',
                        treasurerName: treasurer ? `${treasurer.firstName} ${treasurer.lastName}` : 'N/A',
                        status: remittance.status,  
                        paid: remittance.paid    
                    };

                    // Add the date only if the status is not 'received' or 'verified'
                    if (remittance.status.trim().toLowerCase() !== 'remitted' && remittance.status.trim().toLowerCase() !== 'verified') {
                        remittanceData.date = remittance.date;
                    }

                    return remittanceData;
                }
            }
        }).filter(remittance => remittance);  

        console.log("Filtered Student Remittances:", studentRemittances); 

        const representativeNames = representatives
            .filter(rep => rep.block === 'A')
            .map(representative => `${representative.firstName} ${representative.lastName}`);

        res.render("Representative_verify_remittance", {
            blockKey: 'BSIT - 3A',
            yearLevel: '3',
            block:'A',
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


const Representative_3B_verify_remittance = (req, res) => {
    const selectedDate = req.query.date || ''; 

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
        const treasurer = users.find(user => user.role === 'TREASURER'); 

        console.log("Representatives:", representatives);
        console.log("Treasurer:", treasurer); 

        const studentRemittances = remittances.map(remittance => {
            const student = users.find(user => user.firstName + ' ' + user.lastName === remittance.student);
            
            console.log("Checking Remittance:", remittance);

            if (student && student.block === 'B' && 
                remittance.status.trim().toLowerCase() !== 'remitted' && 
                remittance.status.trim().toLowerCase() !== 'verified') {  
                const representative = representatives.find(rep => rep.block === student.block && rep.yearLevel === student.yearLevel);

                // Include the date only if the status is not 'received' or 'receivedByTreasurer'
                const remittanceData = {
                    studentName: remittance.student,
                    payment: remittance.payables,
                    amountPaid: remittance.paid,
                    balances: remittance.balances,
                    block: student.block,
                    remittedBy: remittance.remittedBy || 'N/A', 
                    representativeName: representative ? `${representative.firstName} ${representative.lastName}` : 'N/A',
                    treasurerName: treasurer ? `${treasurer.firstName} ${treasurer.lastName}` : 'N/A',
                    status: remittance.status,  
                    paid: remittance.paid    
                };

                // Add the date only if the status is not 'received' or 'receivedByTreasurer'
                if (remittance.status.trim().toLowerCase() !== 'remitted' && remittance.status.trim().toLowerCase() !== 'verified') {
                    remittanceData.date = remittance.date;
                }

                return remittanceData;
            }
        }).filter(remittance => remittance);  

        console.log("Filtered Student Remittances:", studentRemittances); 

        const representativeNames = representatives
            .filter(rep => rep.block === 'B')
            .map(representative => `${representative.firstName} ${representative.lastName}`);

        res.render("Representative_verify_remittance", {
            blockKey: 'BSIT - 3B',
            yearLevel: '3',
            block:'B',
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


const Representative_save_fund = (req, res) => {
    const { Receive, date, Amount1000, Amount500, Amount200, Amount100, Amount50, Amount20, coin, block, yearLevel } = req.body;

    if (Receive && date && block) {
        // Update the remittance status for the specified block
        model.remittance.update(
            {
                status: 'Remitted',
                date: date
            },
            {
                where: {
                    status: 'Pending',
                    block: block,
                    yearLevel:yearLevel
                }
            }
        )
        .then(() => {
            return model.denomination.findOne({
                where: { date: date, block: block , yearLevel: yearLevel } 
            });
        })
        .then(existingRecord => {
            if (existingRecord) {
                return existingRecord.update({
                    Amount1000: (Number(existingRecord.Amount1000) || 0) + (Number(Amount1000) || 0),
                    Amount500: (Number(existingRecord.Amount500) || 0) + (Number(Amount500) || 0),
                    Amount200: (Number(existingRecord.Amount200) || 0) + (Number(Amount200) || 0),
                    Amount100: (Number(existingRecord.Amount100) || 0) + (Number(Amount100) || 0),
                    Amount50: (Number(existingRecord.Amount50) || 0) + (Number(Amount50) || 0),
                    Amount20: (Number(existingRecord.Amount20) || 0) + (Number(Amount20) || 0),
                    coin: (Number(existingRecord.coin) || 0) + (Number(coin) || 0)
                });
            } else {
                return model.denomination.create({
                    date: date,
                    block: block,
                    yearLevel:yearLevel,
                    Amount1000: Number(Amount1000) || 0,
                    Amount500: Number(Amount500) || 0,
                    Amount200: Number(Amount200) || 0,
                    Amount100: Number(Amount100) || 0,
                    Amount50: Number(Amount50) || 0,
                    Amount20: Number(Amount20) || 0,
                    coin: Number(coin) || 0
                });
            }
        })
        .then(() => {
            res.redirect(`/Representative_3${block}_verify_remittance`); 
        })
        .catch(err => {
            console.error(err);
            res.status(500).send("Error updating the remittance status or saving denomination data");
        });
    } else {
        res.status(400).send("Invalid form submission or missing block information.");
    }
};



module.exports = {
    
    Representative_dashboard,
    Display_BSIT_3A,
    Representative_3A_verify_remittance,
    Representative_display_Student_Info,
    save_remittance,
    Display_BSIT_3B,
    Representative_3B_verify_remittance,
    Representative_save_fund,
  
    
}