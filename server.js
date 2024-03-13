(async () => {
    const mysql = require('mysql2/promise');
    const inquirer = require('inquirer');
  
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: 'password',
      database: 'company_db',
    });
  
    try {
      await connection.connect();
      console.log('Connected to MySQL database');
      startApp();
    } catch (err) {
      console.error('Error connecting to MySQL:', err);
      process.exit(1);
    }
  
    async function startApp() {
      try {
        const answers = await inquirer.prompt([
          {
            type: 'list',
            name: 'action',
            message: 'What would you like to do?',
            choices: [
              'View all departments',
              'View all roles',
              'View all employees',
              'Add a department',
              'Add a role',
              'Add an employee',
              'Update an employee role',
            ],
          },
        ]);
  
        switch (answers.action) {
          case 'View all departments':
            await viewDepartments();
            break;
          case 'View all roles':
            await viewRoles();
            break;
          case 'View all employees':
            await viewEmployees();
            break;
          case 'Add a department':
            await addDepartment();
            break;
          case 'Add a role':
            await addRole();
            break;
          case 'Add an employee':
            await addEmployee();
            break;
          case 'Update an employee role':
            await updateEmployeeRole();
            break;
          default:
            console.log('Invalid choice');
            await connection.end();
            process.exit(0);
        }
      } catch (error) {
        console.error('Error in startApp:', error);
        process.exit(1);
      }
    }
  
    async function viewDepartments() {
      try {
        const [rows] = await connection.execute('SELECT * FROM departments');
        console.table(rows);
        startApp();
      } catch (error) {
        console.error('Error in viewDepartments:', error);
        startApp();
      }
    }
  
    async function viewRoles() {
      try {
        const [rows] = await connection.execute('SELECT * FROM roles');
        console.table(rows);
        startApp();
      } catch (error) {
        console.error('Error in viewRoles:', error);
        startApp();
      }
    }
  
    async function viewEmployees() {
      try {
        const [rows] = await connection.execute('SELECT * FROM employees');
        console.table(rows);
        startApp();
      } catch (error) {
        console.error('Error in viewEmployees:', error);
        startApp();
      }
    }
  
    async function addDepartment() {
      try {
        const answer = await inquirer.prompt([
          {
            type: 'input',
            name: 'name',
            message: 'Enter the name of the department:',
          },
        ]);
    
        const query = 'INSERT INTO departments (name) VALUES (?)';
        const [rows, fields] = await connection.execute(query, [answer.name]);
    
        console.log('Department added successfully!');
        startApp();
      } catch (error) {
        console.error('Error in addDepartment:', error);
        process.exit(1);
      }
    }
  
    async function addRole() {
      try {
        const departmentQuery = 'SELECT id, name FROM departments';
        const [departments] = await connection.execute(departmentQuery);
    
        const answer = await inquirer.prompt([
          {
            type: 'input',
            name: 'title',
            message: 'Enter the title of the role:',
          },
          {
            type: 'input',
            name: 'salary',
            message: 'Enter the salary for the role:',
            filter: (value) => parseFloat(value.replace(/[$,]/g, '')),
          },
          {
            type: 'list',
            name: 'department',
            message: 'Select the department for the role:',
            choices: departments.map((department) => ({
              name: department.name,
              value: department.id,
            })),
          },
        ]);
    
        const query = 'INSERT INTO roles (title, salary, department_id) VALUES (?, ?, ?)';
        const [rows, fields] = await connection.execute(query, [answer.title, answer.salary, answer.department]);
    
        console.log('Role added successfully!');
        startApp();
      } catch (error) {
        console.error('Error in addRole:', error);
        process.exit(1);
      }
    }  
  
    async function addEmployee() {
      const roleQuery = 'SELECT id, title FROM roles';
      try {
          const [roles] = await connection.execute(roleQuery);
          const answer = await inquirer.prompt([
              {
                  type: 'input',
                  name: 'first_name',
                  message: 'Enter the first name of the employee:',
              },
              {
                  type: 'input',
                  name: 'last_name',
                  message: 'Enter the last name of the employee:',
              },
              {
                  type: 'list',
                  name: 'role',
                  message: 'Select the role for the employee:',
                  choices: roles.map((role) => ({ name: role.title, value: role.id })),
              },
              {
                  type: 'list',
                  name: 'manager',
                  message: 'Select the manager for the employee:',
                  choices: [{ name: 'None', value: null }, ...roles.map((role) => ({ name: role.title, value: role.id }))],
              },
          ]);
          const query = 'INSERT INTO employees (first_name, last_name, role_id, manager_id) VALUES (?, ?, ?, ?)';
          await connection.execute(
              query,
              [answer.first_name, answer.last_name, answer.role, answer.manager]
          );
          console.log('Employee added successfully!');
          startApp();
      } catch (err) {
          console.error('Error in addEmployee:', err);
          startApp();
      }
  }
  
    async function updateEmployeeRole() {
      try {
          const [employees] = await connection.execute('SELECT id, CONCAT(first_name, " ", last_name) AS name FROM employees');
          const [roles] = await connection.execute('SELECT id, title FROM roles');
          const answer = await inquirer.prompt([
              {
                  type: 'list',
                  name: 'employee',
                  message: 'Select the employee to update:',
                  choices: employees.map((employee) => ({ name: employee.name, value: employee.id })),
              },
              {
                  type: 'list',
                  name: 'role',
                  message: 'Select the new role for the employee:',
                  choices: roles.map((role) => ({ name: role.title, value: role.id })),
              },
          ]);
          const [result] = await connection.execute(
              'UPDATE employees SET role_id = ? WHERE id = ?',
              [answer.role, answer.employee]
          );
          console.log('Employee role updated successfully!');
          startApp();
      } catch (error) {
          console.error('Error in updateEmployeeRole:', error);
          startApp();
      }
  }
  
  process.on('exit', async () => {
    try {
      await connection.end();
      console.log('MySQL connection closed.');
    } catch (err) {
      console.error('Error closing MySQL connection:', err);
    }
  });
  })();
  