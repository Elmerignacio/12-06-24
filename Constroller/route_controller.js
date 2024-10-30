const model = require('../models')


const login = (req, res) => {
  res.render('login')
};


const Admin_dashboard = (req, res) => {
  res.render('Admin_dashboard')
};

const Admin_register_user = (req, res) => {
  res.render('Admin_register_user')
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

  console.log("Register Data:", register_post_db);

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

          if (register_post_db.role === "representative") {
              return model.register_user.findOne({
                  where: { yearLevel: register_post_db.yearLevel, block: register_post_db.block, role: "representative" }
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

          return createUser(register_post_db, res);
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
  res.render('Treasurer_dashboard')
};


const Treasurer_create_payable = (req, res) => {
  res.render('Treasurer_create_payable')
};


const Treasurer_register_user = (req, res) => {
  res.render('Treasurer_register_user')
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

    const filteredPayables = payables.filter(payable => 
      payable.yearLevel === '3' && 
      payable.block === 'A'
    );

    res.render("Treasurer_BSIT_3A_remittance", { 
      blockKey: 'BSIT - 3A',
      representativeNames,
      filteredUsers,
      payables: filteredPayables 
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

const Treasurer_studentInfo = (req, res) => {
  res.render('Treasurer_studentInfo')
};

// Route to fetch students based on yearLevel and block
const  student = (req, res) => {
  const { yearLevel, block } = req.query;
  
  model.register_user.findAll({
      where: {
          yearLevel,
          block,
          role: 'student' // Assuming students have the role 'student'
      },
      attributes: ['userId', 'firstName', 'lastName'] // Select only necessary fields
  })
  .then(students => {
      res.json(students);
  })
  .catch(error => {
      console.error("Error fetching students:", error);
      res.status(500).json({ message: "Error fetching students" });
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
  Treasurer_studentInfo
  



};
